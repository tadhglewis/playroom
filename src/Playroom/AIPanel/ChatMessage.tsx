import { useEffect, useRef } from 'react';
import type { AssistantContextValue } from '../AssistantProvider/AssistantProvider';
import { Box } from '../Box/Box';
import { Button } from '../Button/Button';
import SpeakerIcon from '../icons/SpeakerIcon';
import { Stack } from '../Stack/Stack';
import { Text } from '../Text/Text';
import { ImageAttachmentPreview } from './ImageAttachmentPreview';

import * as styles from './ChatMessage.css';

const speakThis = (str: string, synth: typeof window.speechSynthesis) => {
  const voices = synth.getVoices();
  const utterThis = new SpeechSynthesisUtterance(str);
  utterThis.voice = voices[0];
  utterThis.pitch = 1; // Eg. min="0" max="2" value="1" step="0.1"
  utterThis.rate = 1.4; // Eg. min="0.5" max="2" value="1" step="0.1"
  synth.speak(utterThis);
};

interface Props {
  message: AssistantContextValue['messages'][number];
  groupWithPreviousMessage?: boolean;
}

export const ChatMessage = ({ message, groupWithPreviousMessage }: Props) => {
  const speechRef = useRef<typeof window.speechSynthesis | null>(null);
  const isUserMessage = message.role === 'user';

  useEffect(() => {
    speechRef.current = window.speechSynthesis;
    // First use of synth does not pick up the correct voice.
    // Calling `getVoices` straight up resolves this.
    speechRef.current.getVoices();
  }, []);

  return (
    <Box
      className={{
        [styles.message]: true,
        [styles.assistantMessage]: !isUserMessage,
        [styles.userMessage]: isUserMessage,
        [styles.userMessageBlock]: groupWithPreviousMessage,
      }}
    >
      <Stack space="small">
        <Text>
          <span className={styles.messageContent}>
            {message.message}
            {!isUserMessage ? <>&nbsp;&nbsp;</> : null}
          </span>
          {!isUserMessage ? (
            <span className={styles.readMessage}>
              <Button
                aria-label="Listen to assistant"
                title="Listen to assistant"
                variant="transparent"
                onClick={() => {
                  if (speechRef.current) {
                    speakThis(message.message, speechRef.current);
                  }
                }}
              >
                <SpeakerIcon size={16} />
              </Button>
            </span>
          ) : null}
        </Text>
        {message.attachments?.[0] ? (
          <ImageAttachmentPreview
            src={message.attachments[0].url}
            alt="Uploaded image"
          />
        ) : null}
      </Stack>
    </Box>
  );
};
