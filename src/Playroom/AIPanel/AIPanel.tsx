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
import CopyIcon from '../icons/CopyIcon';
import DismissIcon from '../icons/DismissIcon';
import AddIcon from '../icons/AddIcon';
import { useCopy } from '../../utils/useCopy';
import TickIcon from '../icons/TickIcon';
import ChevronIcon from '../icons/ChevronIcon';
import PlayIcon from '../icons/PlayIcon';

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

const pxToInt = (str: string | null) =>
  typeof str === 'string' ? parseInt(str.replace('px', ''), 10) : 0;

const calculateLines = (
  target: HTMLTextAreaElement,
  lines: number,
  lineLimit?: number
) => {
  const { paddingBottom, paddingTop, lineHeight } =
    window.getComputedStyle(target);

  // If line height is not a pixel value (e.g. 'normal' or unitless),
  // bail out of grow behaviour as we cannot calculate accurately.
  if (!lineHeight.endsWith('px')) {
    return lines;
  }

  const padding = pxToInt(paddingTop) + pxToInt(paddingBottom);
  const currentRows = Math.floor(
    (target.scrollHeight - padding) / pxToInt(lineHeight)
  );

  if (target && target.value === '') {
    return lines;
  }

  return typeof lineLimit === 'number' && currentRows > lineLimit
    ? lineLimit
    : currentRows;
};

export default ({
  snippets,
  components,
}: {
  snippets: PlayroomProps['snippets'];
  components: PlayroomProps['components'];
}) => {
  const [state, dispatch] = useContext(StoreContext);
  const [error, setError] = useState('');
  const [previewId, setPreviewId] = useState('');
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [textareaRows, setTextareaRows] = useState(2);
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

Return a JSON object in the following format:

{
  "1": "<JSX code>",
  "2": "<JSX code>",
  "3": "<JSX code>",
  "4": "<JSX code>",
  "5": "<JSX code>",
  "6": "<JSX code>",
  "7": "<JSX code>",
  "8": "<JSX code>",
  "9": "<JSX code>",
  "message": "<message>"
}

1 must contain valid JSX. No explanations, no markdown, no code blocks (.e.g \`\`\`JSX). The code will be directly rendered in the UI. Ensure all opening tags have matching closing tags.
2 to 9 are optional and can be used to provide alternative suggestions. If you have multiple suggestions, return them in the order of preference.
message must contain the follow-up message to the end user.
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

  // Only checking starts with tag, as the end is not available until
  // streaming finishes
  const isMessageStructuredResponse = (str: string) => str.startsWith('{');

  const parseResponse = (str: string) => {
    try {
      return JSON.parse(str) as {
        message: string;
        [key: string]: string;
      };
    } catch {}
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
    api: 'http://localhost:15387/api/chat',
    // api: 'https://braid-ai.ssod.skinfra.xyz/_s2s/api/chat',
    headers: { 'X-Request-Via': 'SSOD' },
    initialMessages: preprompt,
    streamProtocol: 'text',
    onFinish: (message) => {
      const parsedMessage = parseResponse(message.content);
      if (message.role === 'assistant' && parsedMessage) {
        setSuggestionIndex(0);
        setPreviewId(message.id);
        dispatch({
          type: 'previewSuggestion',
          payload: {
            code: parsedMessage['1'],
          },
        });
      }
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

  const { copyClick, copying } = useCopy();

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
              {displayMessages
                .filter(
                  (msg, index) =>
                    !(
                      loading &&
                      index === displayMessages.length - 1 &&
                      (!msg.content || isMessageStructuredResponse(msg.content))
                    )
                )
                .map((msg, index) => {
                  const { message, ...rest } = parseResponse(msg.content) ?? {
                    jsx: '',
                  };

                  const jsxVariations = Object.values(rest);

                  const hasPreviewCode = jsxVariations.length > 0;

                  return (
                    <Stack space="medium" key={msg.id}>
                      <Box
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
                        {message ? (
                          <Text>
                            <span style={{ lineHeight: '1.5em' }}>
                              {message}
                            </span>
                          </Text>
                        ) : (
                          <>
                            <Text>
                              <span style={{ lineHeight: '1.5em' }}>
                                {msg.content}
                              </span>
                            </Text>
                            {msg.experimental_attachments?.[0] ? (
                              <Box
                                paddingTop="small"
                                className={styles.imageAttachment}
                              >
                                <img
                                  src={msg.experimental_attachments[0].url}
                                  className={styles.attachmentImage}
                                  alt="Uploaded"
                                />
                              </Box>
                            ) : null}
                          </>
                        )}
                      </Box>
                      {hasPreviewCode ? (
                        <Inline space="medium" alignY="center">
                          {msg.id === previewId && jsxVariations.length > 1 ? (
                            <>
                              <Button
                                aria-label="Previous suggestion"
                                title="Previous suggestion"
                                variant="transparent"
                                disabled={suggestionIndex === 0}
                                onClick={() => {
                                  const newIndex = suggestionIndex - 1;
                                  setSuggestionIndex(newIndex);
                                  dispatch({
                                    type: 'previewSuggestion',
                                    payload: {
                                      code: jsxVariations[newIndex],
                                    },
                                  });
                                }}
                              >
                                <ChevronIcon direction="left" size={16} />
                              </Button>
                              <Text size="small">{`${suggestionIndex + 1} of ${
                                jsxVariations.length
                              }`}</Text>
                              <Button
                                aria-label="Next suggestion"
                                title="Next suggestion"
                                variant="transparent"
                                disabled={
                                  suggestionIndex === jsxVariations.length - 1
                                }
                                onClick={() => {
                                  const newIndex = suggestionIndex + 1;
                                  setSuggestionIndex(newIndex);
                                  dispatch({
                                    type: 'previewSuggestion',
                                    payload: {
                                      code: jsxVariations[newIndex],
                                    },
                                  });
                                }}
                              >
                                <ChevronIcon direction="right" size={16} />
                              </Button>
                            </>
                          ) : null}
                          {msg.id !== previewId ? (
                            <Button
                              aria-label="Preview suggestion"
                              title="Preview suggestion"
                              variant="transparent"
                              onClick={() => {
                                setPreviewId(msg.id);
                                setSuggestionIndex(0);
                                dispatch({
                                  type: 'previewSuggestion',
                                  payload: {
                                    code: jsxVariations[0],
                                  },
                                });
                              }}
                            >
                              <PlayIcon size={16} />
                            </Button>
                          ) : null}
                          <Button
                            aria-label={copying ? 'Copied' : 'Copy code'}
                            title={copying ? 'Copied' : 'Copy code'}
                            variant="transparent"
                            tone={copying ? 'positive' : undefined}
                            onClick={() =>
                              copyClick(jsxVariations[suggestionIndex])
                            }
                          >
                            {copying ? (
                              <TickIcon size={16} />
                            ) : (
                              <CopyIcon size={16} />
                            )}
                          </Button>
                          <Button
                            aria-label="Apply code"
                            title="Apply code"
                            variant="transparent"
                            onClick={() => {
                              setSuggestionIndex(0);
                              setPreviewId('');
                              dispatch({
                                type: 'updateCode',
                                payload: {
                                  code: jsxVariations[suggestionIndex],
                                },
                              });
                            }}
                          >
                            <AddIcon size={16} />
                          </Button>
                        </Inline>
                      ) : null}
                    </Stack>
                  );
                })}
            </Stack>
            {loading ? <Text>{loadingMessage}</Text> : null}

            {hasError ? (
              <Text tone="critical">
                {error || chatError?.message || 'An error occurred'}
              </Text>
            ) : null}
          </Box>
        </ScrollContainer>

        <Box
          component="form"
          flexGrow={0}
          onSubmit={(e) => {
            if (!loading) {
              setError('');
              setSuggestionIndex(0);
              setPreviewId('');
              handleSubmit(e, {
                experimental_attachments: getImageAttachment(),
              });
              clearImageInput();
              textareaRef.current?.focus();
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              setError('');
              setSuggestionIndex(0);
              setPreviewId('');
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
                    <DismissIcon size={16} />
                  </button>
                </Box>
              </Box>
            ) : null}
            <Stack space="large">
              <textarea
                ref={textareaRef}
                className={styles.textarea}
                value={input}
                rows={textareaRows}
                onChange={(ev) => {
                  setTextareaRows(
                    calculateLines(ev.currentTarget, textareaRows, 5)
                  );
                  handleInputChange(ev);
                }}
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
                      variant="transparent"
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
                    tone={
                      input.trim().length > 0 || loading ? 'accent' : undefined
                    }
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
                    {loading ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 100 100"
                        preserveAspectRatio="xMidYMid"
                        width="20"
                        height="20"
                        fill="none"
                        className={styles.loader}
                      >
                        <circle
                          strokeLinecap="round"
                          strokeDasharray="70"
                          stroke="currentcolor"
                          strokeWidth="8"
                          r="46"
                          cy="50"
                          cx="50"
                        />
                      </svg>
                    ) : (
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
                    )}
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
