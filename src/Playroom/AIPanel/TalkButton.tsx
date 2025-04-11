import { useEffect, useRef, useState } from 'react';
import { Button, type ButtonProps } from '../Button/Button';

type Props = Omit<ButtonProps, 'onClick'> & {
  onComplete?: (transcript: string) => void;
};

interface ResultEvent {
  results: Array<Array<{ transcript: string }>>;
}

interface SpeechInstance {
  lang: string;
  onresult: (event: ResultEvent) => void;
  start: () => void;
  onstart: (event: any) => void;
  onend: (event: any) => void;
}

export const TalkButton = ({
  onComplete,
  tone,
  children,
  ...restProps
}: Props) => {
  const [listening, setListening] = useState(false);
  const [initialised, setInitialised] = useState(false);
  const speechRef = useRef<SpeechInstance | null>(null);

  useEffect(() => {
    const SpeechAPI =
      // @ts-expect-error No types yet
      window.SpeechRecognition ||
      // @ts-expect-error No types yet
      window.webkitSpeechRecognition ||
      // @ts-expect-error No types yet
      window.mozSpeechRecognition ||
      // @ts-expect-error No types yet
      window.msSpeechRecognition;

    if (SpeechAPI) {
      const recognition = new SpeechAPI();
      recognition.lang = 'en_US';
      speechRef.current = recognition as SpeechInstance;
    }

    setInitialised(true);
  }, []);

  return initialised && speechRef.current ? (
    <Button
      {...restProps}
      tone={tone || (listening ? 'accent' : undefined)}
      onClick={() => {
        if (speechRef.current) {
          speechRef.current.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            if (transcript && typeof onComplete === 'function') {
              onComplete(transcript);
            }
          };
          speechRef.current.start();
          speechRef.current.onstart = () => setListening(true);
          speechRef.current.onend = () => setListening(false);
        }
      }}
    >
      {children || (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="currentcolor"
          height="20"
          width="20"
          viewBox="0 0 490.9 490.9"
        >
          <path d="M245.5,322.9c53,0,96.2-43.2,96.2-96.2V96.2c0-53-43.2-96.2-96.2-96.2s-96.2,43.2-96.2,96.2v130.5    C149.3,279.8,192.5,322.9,245.5,322.9z M173.8,96.2c0-39.5,32.2-71.7,71.7-71.7s71.7,32.2,71.7,71.7v130.5    c0,39.5-32.2,71.7-71.7,71.7s-71.7-32.2-71.7-71.7V96.2z" />
          <path d="M94.4,214.5c-6.8,0-12.3,5.5-12.3,12.3c0,85.9,66.7,156.6,151.1,162.8v76.7h-63.9c-6.8,0-12.3,5.5-12.3,12.3    s5.5,12.3,12.3,12.3h152.3c6.8,0,12.3-5.5,12.3-12.3s-5.5-12.3-12.3-12.3h-63.9v-76.7c84.4-6.3,151.1-76.9,151.1-162.8    c0-6.8-5.5-12.3-12.3-12.3s-12.3,5.5-12.3,12.3c0,76.6-62.3,138.9-138.9,138.9s-138.9-62.3-138.9-138.9    C106.6,220,101.2,214.5,94.4,214.5z" />
        </svg>
      )}
    </Button>
  ) : null;
};
