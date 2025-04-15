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
import type { PlayroomProps } from '../Playroom';
import { Inline } from '../Inline/Inline';
import { TextLinkButton } from '../TextLinkButton/TextLinkButton';
import { Spread } from '../Spread/Spread';
import { ScrollContainer } from '../ScrollContainer/ScrollContainer';
import DismissIcon from '../icons/DismissIcon';
import { TalkButton } from './TalkButton';
import SpeakerIcon from '../icons/SpeakerIcon';
import LoadingIcon from '../icons/LoadingIcon';
import SendIcon from '../icons/SendIcon';
import ImageIcon from '../icons/ImageIcon';
import { AISnippet } from './AISnippet';

import * as styles from './AIPanel.css';

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

const speakThis = (str: string, synth: typeof window.speechSynthesis) => {
  const voices = synth.getVoices();
  const utterThis = new SpeechSynthesisUtterance(str);
  utterThis.voice = voices[0];
  utterThis.pitch = 1; // Eg. min="0" max="2" value="1" step="0.1"
  utterThis.rate = 1.4; // Eg. min="0.5" max="2" value="1" step="0.1"
  synth.speak(utterThis);
};

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
  const speechRef = useRef<typeof window.speechSynthesis | null>(null);

  useEffect(() => {
    speechRef.current = window.speechSynthesis;
    // First use of synth does not pick up the correct voice.
    // Calling `getVoices` straight up resolves this.
    speechRef.current.getVoices();
  }, []);

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

\`\`\`jsx
<Stack space="medium">
  <Checkbox label="Checkbox" stateName="myCheckbox" />

  {getState("myCheckbox") && (
    <Notice tone="positive">
      <Text>Good job! You checked the checkbox!</Text>
    </Notice>
  )}
</Stack>
\`\`\`

\`\`\`jsx
<Stack space="medium">
  <Checkbox label="Checkbox" stateName="myCheckbox" />

  {getState("myCheckbox") ? (
    <Notice tone="positive">
      <Text>Good job! You checked the checkbox!</Text>
    </Notice>
  ) : (
    <Notice tone="critical">
      <Text>Oops! You haven’t checked the checkbox!</Text>
    </Notice>
  )}
</Stack>
\`\`\`

\`\`\`jsx
{setDefaultState("myCheckbox", true)}

<Stack space="medium">
  <Checkbox label="Checkbox" stateName="myCheckbox" />

  {getState("myCheckbox") ? (
    <Notice tone="positive">
      <Text>Good job! You checked the checkbox!</Text>
    </Notice>
  ) : (
    <Notice tone="critical">
      <Text>Oops! You haven’t checked the checkbox!</Text>
    </Notice>
  )}
</Stack>
\`\`\`

\`\`\`jsx
<Card>
  <Stack space="large">
    <TextField label="First name" stateName="firstName" />
    <TextField label="Last name" stateName="lastName" />

    {getState("firstName") && getState("lastName") ? (
      <Heading level="4">
        👋 Hello {getState("firstName")} {getState("lastName")}!
      </Heading>
    ) : null}
  </Stack>
</Card>
\`\`\`

\`\`\`jsx
{setDefaultState("screen", "Home")}

{getState("screen") === "Home" && (
  <Card>
    <Stack space="large">
      <Heading level="3">Home</Heading>
      <Actions>
        <Button onClick={() => setState("screen", "Welcome")}>Sign in</Button>
      </Actions>
    </Stack>
  </Card>
)}

{getState("screen") === "Welcome" && (
  <Card>
    <Stack space="large">
      <Heading level="3">👋 Welcome!</Heading>
      <Placeholder height={100} />
      <Actions>
        <Button onClick={() => resetState("screen")}>Sign out</Button>
      </Actions>
    </Stack>
  </Card>
)}
\`\`\`

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

Generate and return only 1 unless specifically asked to generate multiple versions, options, or variants.
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
    if (!imageDataUrl) {
      return [];
    }

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
            <Stack space="xlarge">
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
                  const { message, ...rest } = parseResponse(msg.content) ?? {};
                  const jsxVariations = Object.values(rest);
                  const isUserMessage = msg.role === 'user';

                  return (
                    <Stack space="medium" key={msg.id}>
                      <Box
                        className={{
                          [styles.message]: true,
                          [styles.assistantMessage]: !isUserMessage,
                          [styles.userMessage]: isUserMessage,
                          [styles.userMessageBlock]:
                            isUserMessage &&
                            messages[index - 1]?.role === msg.role,
                        }}
                      >
                        <Stack space="small">
                          <Text>
                            <span className={styles.messageContent}>
                              {message || msg.content}
                              {!isUserMessage ? <>&nbsp;</> : null}
                            </span>
                            {!isUserMessage ? (
                              <span className={styles.readMessage}>
                                <Button
                                  aria-label="Listen to assistant"
                                  title="Listen to assistant"
                                  variant="transparent"
                                  onClick={() => {
                                    if (speechRef.current) {
                                      speakThis(
                                        message || msg.content,
                                        speechRef.current
                                      );
                                    }
                                  }}
                                >
                                  <SpeakerIcon size={16} />
                                </Button>
                              </span>
                            ) : null}
                          </Text>
                          {msg.experimental_attachments?.[0] ? (
                            <Box className={styles.imageAttachment}>
                              <img
                                src={msg.experimental_attachments[0].url}
                                className={styles.attachmentImage}
                                alt="Uploaded image"
                              />
                            </Box>
                          ) : null}
                        </Stack>
                      </Box>

                      {jsxVariations.map((variant, variantIndex) => (
                        <AISnippet
                          key={index}
                          snippet={variant}
                          active={
                            msg.id === previewId &&
                            suggestionIndex === variantIndex
                          }
                          label={
                            jsxVariations.length > 1
                              ? `View ${variantIndex + 1}`
                              : 'View'
                          }
                          onApply={() => {
                            setSuggestionIndex(variantIndex);
                            setPreviewId('');
                            dispatch({
                              type: 'updateCode',
                              payload: {
                                code: variant,
                              },
                            });
                          }}
                          onSelect={() => {
                            setPreviewId(msg.id);
                            setSuggestionIndex(variantIndex);
                            dispatch({
                              type: 'previewSuggestion',
                              payload: {
                                code: variant,
                              },
                            });
                          }}
                        />
                      ))}
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
                      <ImageIcon />
                    </Button>
                  </Inline>

                  <Inline space="small" nowrap>
                    <TalkButton
                      aria-label="Speak"
                      title="Speak"
                      onComplete={setInput}
                    />
                    <Button
                      type="submit"
                      disabled={input.trim().length === 0}
                      tone={
                        input.trim().length > 0 || loading
                          ? 'accent'
                          : undefined
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
                        <LoadingIcon size={20} />
                      ) : (
                        <SendIcon size={20} dim={input.trim().length === 0} />
                      )}
                    </Button>
                  </Inline>
                </Spread>
              </Box>
            </Stack>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
