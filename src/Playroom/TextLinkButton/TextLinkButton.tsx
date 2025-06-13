import type { ReactNode } from 'react';

import * as styles from './TextLinkButton.css';

interface ResetButtonProps {
  onClick: () => void;
  children: ReactNode;
}

export const TextLinkButton = ({ onClick, children }: ResetButtonProps) => (
  <button className={styles.button} onClick={onClick}>
    {children}
  </button>
);
