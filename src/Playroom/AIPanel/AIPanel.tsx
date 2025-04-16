import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Heading } from '../Heading/Heading';
import { Stack } from '../Stack/Stack';
import { Text } from '../Text/Text';
import { Box } from '../Box/Box';
import { TextLinkButton } from '../TextLinkButton/TextLinkButton';
import { Spread } from '../Spread/Spread';
import { ScrollContainer } from '../ScrollContainer/ScrollContainer';
import { AISnippet } from './AISnippet';
import { useAssistant } from '../AssistantProvider/AssistantProvider';
import { ChatMessage } from './ChatMessage';
import { ChatForm } from './ChatForm';

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

export default () => {
  const [loadingMessage, setLoadingMessage] = useState('Generating...');
  const messageContainerRef = useRef<HTMLElement>(null);

  const {
    messages,
    status,
    errorMessage,
    reset,
    loading,
    applyVariant,
    previewVariant,
  } = useAssistant();

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

  const hasError = Boolean(errorMessage);
  useLayoutEffect(() => {
    const el = messageContainerRef.current;
    el?.scrollTo(0, el.scrollHeight);
  }, [messages.length, loading, hasError]);

  return (
    <Box component="aside" className={styles.root}>
      <Box position="absolute" inset={0} display="flex" flexDirection="column">
        <Box padding="xxlarge">
          <Spread space="small" alignY="center">
            <Heading level="3">AI Assistant</Heading>
            {messages.length > 1 && (
              <TextLinkButton onClick={reset}>Reset</TextLinkButton>
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
              {messages.map((message, index) => (
                <Stack space="medium" key={message.id}>
                  <ChatMessage
                    message={message}
                    groupWithPreviousMessage={
                      message.role === 'user' &&
                      messages[index - 1]?.role === message.role
                    }
                  />

                  {message.variants.map(({ variant, active }, variantIndex) => (
                    <AISnippet
                      key={`${message.id}_${variantIndex}`}
                      snippet={variant}
                      active={active}
                      label={
                        message.variants.length > 1
                          ? `View ${variantIndex + 1}`
                          : 'View'
                      }
                      onApply={() => applyVariant(variant)}
                      onSelect={() =>
                        previewVariant({
                          variant,
                          id: message.id,
                          variantIndex,
                        })
                      }
                    />
                  ))}
                </Stack>
              ))}
            </Stack>

            {loading ? <Text>{loadingMessage}</Text> : null}

            {errorMessage ? <Text tone="critical">{errorMessage}</Text> : null}
          </Box>
        </ScrollContainer>

        <ChatForm />
      </Box>
    </Box>
  );
};
