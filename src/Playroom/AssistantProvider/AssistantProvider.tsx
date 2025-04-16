import {
  createContext,
  type Dispatch,
  type SetStateAction,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import type { PlayroomProps } from '../Playroom';
import { StoreContext } from '../../StoreContext/StoreContext';
import { useChat, type Message } from '@ai-sdk/react';

interface Props {
  children: ReactNode;
  snippets: PlayroomProps['snippets'];
  components: PlayroomProps['components'];
}

// Only check if it starts with `{` as the end is not available until
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

export const AssistantProvider = ({
  children,
  snippets,
  components,
}: Props) => {
  const [state, dispatch] = useContext(StoreContext);
  const [error, setError] = useState('');
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [activeSuggestion, setActiveSuggestion] = useState<{
    messageId: string;
    variantIndex: number;
  } | null>(null);

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
        setActiveSuggestion({
          messageId: message.id,
          variantIndex: 0,
        });
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

  const errorMessage = error || chatError?.message;
  const loading =
    !errorMessage && (status === 'streaming' || status === 'submitted');
  const displayMessages = messages
    .filter(
      (msg, index) =>
        msg.role !== 'system' &&
        !(
          loading &&
          index === messages.length - 1 &&
          (!msg.content || isMessageStructuredResponse(msg.content))
        )
    )
    .map((message) => {
      const { message: messageContent, ...variants } =
        parseResponse(message.content) ?? {};

      return {
        id: message.id,
        role: message.role,
        message: messageContent || message.content,
        attachments: message.experimental_attachments,
        variants: Object.values(variants).map((variant, variantIndex) => ({
          variant,
          active:
            message.id === activeSuggestion?.messageId &&
            variantIndex === activeSuggestion.variantIndex,
        })),
      };
    });

  const reset = () => {
    setMessages(preprompt);
    setImageDataUrl(null);
  };

  const applyVariant: AssistantContextValue['applyVariant'] = (variant) => {
    setActiveSuggestion(null);
    dispatch({
      type: 'updateCode',
      payload: {
        code: variant,
      },
    });
  };

  const previewVariant: AssistantContextValue['previewVariant'] = ({
    variant,
    id,
    variantIndex,
  }) => {
    setActiveSuggestion({
      messageId: id,
      variantIndex,
    });
    dispatch({
      type: 'previewSuggestion',
      payload: {
        code: variant,
      },
    });
  };

  const resetPreviewVariant = () => {
    setActiveSuggestion(null);
  };

  return (
    <AssistantContext.Provider
      value={{
        messages: displayMessages,
        input,
        handleInputChange,
        handleSubmit: (e) => {
          setError('');
          setActiveSuggestion(null);
          handleSubmit(
            e,
            imageDataUrl
              ? {
                  experimental_attachments: [
                    {
                      url: imageDataUrl,
                      contentType: 'image/*',
                    },
                  ],
                }
              : undefined
          );
        },
        status,
        setInput,
        errorMessage,
        reset,
        loading,
        imageDataUrl,
        setImageDataUrl,
        applyVariant,
        previewVariant,
        resetPreviewVariant,
      }}
    >
      {children}
    </AssistantContext.Provider>
  );
};

type Chat = ReturnType<typeof useChat>;
type Variant = { variant: string; active: boolean };
type PlayroomAssistantMessage = {
  id: Message['id'];
  role: Message['role'];
  message: string;
  attachments: Message['experimental_attachments'];
  variants: Variant[];
};
export type AssistantContextValue = Pick<
  Chat,
  'input' | 'handleInputChange' | 'status' | 'setInput'
> & {
  messages: PlayroomAssistantMessage[];
  reset: () => void;
  errorMessage?: string;
  handleSubmit: Chat['handleSubmit'];
  loading: boolean;
  imageDataUrl: string | null;
  setImageDataUrl: Dispatch<SetStateAction<string | null>>;
  applyVariant: (variant: Variant['variant']) => void;
  previewVariant: (params: {
    variant: string;
    id: string;
    variantIndex: number;
  }) => void;
  resetPreviewVariant: () => void;
};

export const AssistantContext = createContext<AssistantContextValue | null>(
  null
);

export const useAssistant = () => {
  const context = useContext(AssistantContext);

  if (!context) {
    throw new Error('Must be used inside of a Assistant Context');
  }

  return context;
};
