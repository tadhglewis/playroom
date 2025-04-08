import {
  useState,
  useContext,
  useEffect,
  useRef,
  useLayoutEffect,
  type KeyboardEvent,
} from 'react';
import { type Message, useChat } from '@ai-sdk/react';
import { StoreContext } from '../../StoreContext/StoreContext';
import { Heading } from '../Heading/Heading';
import { Stack } from '../Stack/Stack';
import { Text } from '../Text/Text';
import { Button } from '../Button/Button';
import { Box } from '../Box/Box';
import * as styles from './AIPanel.css';
import type { PlayroomProps } from '../Playroom';
import { Inline } from '../Inline/Inline';
import { TextLinkButton } from '../TextLinkButton/TextLinkButton';
import { Spread } from '../Spread/Spread';
import { ScrollContainer } from '../ScrollContainer/ScrollContainer';
import classNames from 'classnames';

export default ({
  snippets,
  components,
}: {
  snippets: PlayroomProps['snippets'];
  components: PlayroomProps['components'];
}) => {
  const [state, dispatch] = useContext(StoreContext);
  const [error, setError] = useState('');
  const [loadingMessage, setLoadingMessage] = useState('Generating...');
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messageContainerRef = useRef<HTMLElement>(null);

  const systemPrompt = `
You are an expert React developer specializing in UI component composition. Your task is to help users create UI layouts using only the components provided.

## Available Components

${Object.keys(components)}

## Component Snippets

${snippets.map(
  ({ name, code, group }) =>
    `### ${name} (${group})
\`\`\`jsx
${code}
\`\`\`
`
)}

## Instructions

1. Create concise, elegant layouts using ONLY the components listed above.
2. Generate valid JSX with proper nesting and indentation.
3. Use props as shown in the component definitions.
4. When modifying existing code, preserve the structure while making requested changes.
5. If the user asks for a component you don't have, use the closest available alternative.
6. MUST follow snippets examples and syntax. For example, if a component is nested in a provider, you must always add the provider.

${
  state.aiExamples && state.aiExamples.length > 0
    ? `
## Example usage

Here are some example components that demonstrate best practices:

${state.aiExamples
  .map(
    ({ name, code, description }) =>
      `### ${name}${description ? ` - ${description}` : ''}
\`\`\`jsx
${code}
\`\`\`
`
  )
  .join('\n')}
`
    : ''
}

## Response Format (VERY IMPORTANT)

- RETURN ONLY RAW AND VALID JSX CODE - no explanations, no markdown, no code blocks (.e.g \`\`\`JSX).
- Your code will be directly rendered in the UI.
- Ensure all opening tags have matching closing tags.
- Include appropriate whitespace for readability.
`;

  const preprompt: Message[] = [
    {
      id: 'system-1',
      role: 'system',
      content: systemPrompt,
    },

    ...(state.code
      ? [
          {
            id: 'initial-code',
            role: 'system' as const,
            content: `Current code to modify if requested:\n\n${state.code}`,
          },
        ]
      : []),

    {
      id: 'welcome',
      role: 'assistant',
      content: state.code
        ? 'What changes would you like to make?'
        : "Describe what you'd like to build!",
    },
  ];

  const clearImageInput = () => {
    setImageDataUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    status,
    setInput,
    setMessages,
    error: chatError,
  } = useChat({
    api: 'https://indie-turtle.ssod.skinfra.xyz/_s2s/api/chat',
    headers: { 'X-Request-Via': 'SSOD' },
    initialMessages: preprompt,
    onFinish: (message) => {
      dispatch({
        type: 'updateCode',
        payload: {
          code: message.content,
        },
      });
    },
    onError: (err) => {
      setError(err.message || 'An error occurred while generating UI');
    },
  });

  const displayMessages = messages.filter((msg) => msg.role !== 'system');
  const clearConversation = () => {
    setMessages(preprompt);
    clearImageInput();
  };

  useEffect(() => {
    if (status === 'streaming' || status === 'submitted') {
      const loadingMessages = [
        'Pondering...',
        'Vibe coding...',
        'Procrastinating...',
        'Fiddling...',
        'Overthinking...',
        'Daydreaming...',
        'Turtle-coding...',
        'Shell-scripting...',
        'Considering...',
        'Contemplating...',
      ];

      const intervalId = setInterval(() => {
        const randomIndex = Math.floor(Math.random() * loadingMessages.length);
        setLoadingMessage(loadingMessages[randomIndex]);
      }, 2000);

      const randomIndex = Math.floor(Math.random() * loadingMessages.length);
      setLoadingMessage(loadingMessages[randomIndex]);

      return () => clearInterval(intervalId);
    }
  }, [status]);

  useEffect(() => {
    const fileInput = fileInputRef.current;
    if (!fileInput) return undefined;

    const handleFileChange = () => {
      const file = fileInput.files?.[0];
      if (!file) {
        setImageDataUrl(null);
        setInput('');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setImageDataUrl(e.target?.result as string);
        textareaRef.current?.focus();
      };
      reader.readAsDataURL(file);
    };

    fileInput.addEventListener('change', handleFileChange);
    return () => fileInput.removeEventListener('change', handleFileChange);
  }, [setInput]);

  const hasError = error || chatError;
  const loading =
    !hasError && (status === 'streaming' || status === 'submitted');

  const getImageAttachment = () => {
    if (!imageDataUrl) return [];

    return [
      {
        url: imageDataUrl,
        contentType: 'image/*',
      },
    ];
  };

  useLayoutEffect(() => {
    const el = messageContainerRef.current;
    el?.scrollTo(0, el.scrollHeight);
  }, [displayMessages.length, loading, hasError]);

  return (
    <Box component="aside" className={styles.root}>
      <Box position="absolute" inset={0} display="flex" flexDirection="column">
        <Box flexGrow={0} padding="xxlarge">
          <Spread space="small" alignY="center">
            <Heading level="3">AI Assistant</Heading>
            {displayMessages.length > 1 && (
              <TextLinkButton onClick={clearConversation}>Reset</TextLinkButton>
            )}
          </Spread>
        </Box>

        <ScrollContainer
          ref={messageContainerRef}
          direction="vertical"
          fadeSize="small"
        >
          <Box className={styles.messageContainer}>
            <Stack space="large">
              {displayMessages.map((msg, index) => (
                <Box
                  key={msg.id}
                  className={classNames([
                    styles.message,
                    msg.role === 'user'
                      ? styles.userMessage
                      : styles.assistantMessage,

                    displayMessages[index - 1]?.role === msg.role
                      ? styles.groupMessageBlock
                      : undefined,
                  ])}
                >
                  <Text>
                    {msg.role === 'user' || msg.id === 'welcome'
                      ? msg.content
                      : `${msg.content.slice(
                          msg.content.length - 100,
                          msg.content.length
                        )}...`}
                  </Text>
                  {msg.experimental_attachments?.[0] ? (
                    <Box paddingTop="medium" className={styles.imageAttachment}>
                      <img
                        src={msg.experimental_attachments[0].url}
                        className={styles.attachmentImage}
                        alt="Uploaded"
                      />
                    </Box>
                  ) : null}
                </Box>
              ))}
            </Stack>
            {loading ? (
              <Box paddingX="large">
                <Text>
                  <span className={styles.turtle}>🐢</span>
                  {loadingMessage}
                </Text>
              </Box>
            ) : null}

            {hasError ? (
              <Box paddingX="large">
                <Text tone="critical">
                  {error || chatError?.message || 'An error occurred'}
                </Text>
              </Box>
            ) : null}
          </Box>
        </ScrollContainer>

        <Box
          component="form"
          flexGrow={0}
          onSubmit={(e) => {
            handleSubmit(e, { experimental_attachments: getImageAttachment() });
            clearImageInput();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              handleSubmit(e, {
                experimental_attachments: getImageAttachment(),
              });
              clearImageInput();
            }
          }}
        >
          <Box className={styles.fieldContainer}>
            {imageDataUrl ? (
              <Box paddingX="large" paddingTop="xxxlarge">
                <Box className={styles.imageAttachment}>
                  <img
                    src={imageDataUrl}
                    className={styles.attachmentImage}
                    alt="Uploaded"
                  />
                  <button
                    className={styles.clearImage}
                    onClick={clearImageInput}
                    aria-label="Remove image"
                    title="Remove image"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      xmlSpace="preserve"
                      focusable="false"
                      fill="currentColor"
                      width={16}
                      height={16}
                    >
                      <path d="m13.4 12 5.3-5.3c.4-.4.4-1 0-1.4s-1-.4-1.4 0L12 10.6 6.7 5.3c-.4-.4-1-.4-1.4 0s-.4 1 0 1.4l5.3 5.3-5.3 5.3c-.4.4-.4 1 0 1.4.2.2.4.3.7.3s.5-.1.7-.3l5.3-5.3 5.3 5.3c.2.2.5.3.7.3s.5-.1.7-.3c.4-.4.4-1 0-1.4L13.4 12z" />
                    </svg>
                  </button>
                </Box>
              </Box>
            ) : null}
            <Stack space="large">
              <textarea
                ref={textareaRef}
                className={styles.textarea}
                value={input}
                onChange={handleInputChange}
                autoFocus
                placeholder={
                  state.code
                    ? 'Example: Change the background color to blue, add spacing between items...'
                    : 'Example: Create a product card with image, title, price and buy button...'
                }
              />
              <Box className={styles.focusIndicator} />
              <Box paddingX="medium">
                <Spread space="small">
                  <Inline space="small" nowrap>
                    <Button
                      as="label"
                      htmlFor="image-upload"
                      aria-label="Upload Image"
                      title="Upload Image"
                      onKeyUp={(ev: KeyboardEvent<HTMLElement>) => {
                        if (ev.key === 'Enter') {
                          fileInputRef.current?.click();
                        }
                      }}
                    >
                      <input
                        type="file"
                        id="image-upload"
                        className={styles.imageInput}
                        ref={fileInputRef}
                        accept="image/*"
                      />
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        xmlSpace="preserve"
                        focusable="false"
                        fill="currentColor"
                        width={20}
                        height={20}
                      >
                        <path d="M19 2H5C3.3 2 2 3.3 2 5v14c0 1.7 1.3 3 3 3h14c1.7 0 3-1.3 3-3V5c0-1.7-1.3-3-3-3zM4 5c0-.6.4-1 1-1h14c.6 0 1 .4 1 1v7.6L17.4 10c-.8-.8-2.1-.8-2.8 0l-9.9 9.9c-.4-.1-.7-.5-.7-.9V5zm15 15H7.4l8.6-8.6 4 4V19c0 .6-.4 1-1 1z" />
                        <circle cx={8} cy={8} r={2} />
                      </svg>
                    </Button>
                  </Inline>
                  <Button
                    type="submit"
                    disabled={input.trim().length === 0}
                    aria-label={
                      input.trim().length === 0
                        ? 'Enter a prompt to generate UI'
                        : 'Generate UI'
                    }
                    title={
                      input.trim().length === 0
                        ? 'Enter a prompt to generate UI'
                        : 'Generate UI'
                    }
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      xmlSpace="preserve"
                      focusable="false"
                      fill="currentColor"
                      width={20}
                      height={20}
                      opacity={input.trim().length === 0 ? 0.6 : undefined}
                    >
                      <path d="M22 3c0-.1 0-.2-.1-.3v-.1c0-.1-.1-.2-.2-.3-.1-.1-.2-.1-.3-.2h-.1c-.1-.1-.2-.1-.3-.1h-.3l-19 6c-.4.2-.6.5-.7.9 0 .4.1.8.5 1l7.8 4.9 4.9 7.8c.2.3.5.5.8.5h.1c.4 0 .7-.3.8-.7l6-19c.1-.2.1-.3.1-.4zm-4.6 2.2-7.5 7.5-5.5-3.4 13-4.1zm-2.7 14.4-3.4-5.5 7.5-7.5-4.1 13z" />
                    </svg>
                  </Button>
                </Spread>
              </Box>
            </Stack>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
