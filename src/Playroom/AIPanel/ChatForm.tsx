import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  useContext,
} from 'react';

import { StoreContext } from '../../StoreContext/StoreContext';
import {
  type AssistantContextValue,
  useAssistant,
} from '../AssistantProvider/AssistantProvider';
import { Box } from '../Box/Box';
import { Button } from '../Button/Button';
import { Inline } from '../Inline/Inline';
import { Spread } from '../Spread/Spread';
import { Stack } from '../Stack/Stack';
import ImageIcon from '../icons/ImageIcon';
import LoadingIcon from '../icons/LoadingIcon';
import SendIcon from '../icons/SendIcon';

import { ImageAttachmentPreview } from './ImageAttachmentPreview';
import { TalkButton } from './TalkButton';

import * as styles from './ChatForm.css';

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

export const ChatForm = () => {
  const [state] = useContext(StoreContext);
  const [textareaRows, setTextareaRows] = useState(2);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    input,
    handleInputChange,
    handleSubmit,
    setInput,
    loading,
    imageDataUrl,
    setImageDataUrl,
  } = useAssistant();

  const clearImageInput = () => {
    setImageDataUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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
  }, [setInput, setImageDataUrl]);

  const onSubmit: AssistantContextValue['handleSubmit'] = (event) => {
    if (!loading && typeof onSubmit === 'function') {
      handleSubmit(event);
      clearImageInput();
      textareaRef.current?.focus();
    }
  };

  return (
    <Box
      component="form"
      onSubmit={onSubmit}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          onSubmit(e);
        }
      }}
    >
      <Box className={styles.fieldContainer}>
        {imageDataUrl ? (
          <Box paddingX="large" paddingTop="xxxlarge">
            <ImageAttachmentPreview
              src={imageDataUrl}
              alt="Uploaded image"
              size="small"
              onRemove={clearImageInput}
            />
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
                calculateLines(ev.currentTarget, textareaRows, 4)
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
                <Box position="relative">
                  <input
                    type="file"
                    id="image-upload"
                    className={styles.imageInput}
                    ref={fileInputRef}
                    accept="image/*"
                  />
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
                    <ImageIcon />
                  </Button>
                </Box>
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
  );
};
