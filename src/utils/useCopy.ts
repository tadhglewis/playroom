import copy from 'copy-to-clipboard';
import { useState, useRef, useEffect } from 'react';

export const useCopy = () => {
  const [copying, setCopying] = useState(false);
  const [content, setContent] = useState('');
  const copyLocked = useRef(false);

  useEffect(() => {
    if (copying && !copyLocked.current) {
      copyLocked.current = true;

      copy(content);

      setTimeout(() => {
        copyLocked.current = false;

        setCopying(false);
        setContent('');
      }, 2000);
    }
  }, [copying, content]);

  return {
    copying,
    copyClick: (input: string) => {
      if (!copying) {
        setCopying(true);
        setContent(input);
      }
    },
  };
};
