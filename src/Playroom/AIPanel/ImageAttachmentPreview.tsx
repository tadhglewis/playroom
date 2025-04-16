import type { AllHTMLAttributes } from 'react';
import { Box } from '../Box/Box';
import DismissIcon from '../icons/DismissIcon';

import * as styles from './ImageAttachmentPreview.css';

interface Props {
  src: string;
  alt: string;
  size?: 'standard' | 'small';
  onRemove?: AllHTMLAttributes<HTMLButtonElement>['onClick'];
}

export const ImageAttachmentPreview = ({ src, alt, size, onRemove }: Props) => (
  <Box className={styles.imageAttachment}>
    <Box
      component="img"
      src={src}
      className={{
        [styles.attachmentImage]: true,
        [styles.small]: size === 'small',
      }}
      alt={alt}
    />
    {onRemove ? (
      <button
        className={styles.clearImage}
        onClick={onRemove}
        aria-label="Remove image"
        title="Remove image"
      >
        <DismissIcon size={16} />
      </button>
    ) : null}
  </Box>
);
