import { style } from '@vanilla-extract/css';
import { colorPaletteVars, sprinkles } from '../sprinkles.css';
import { vars } from '../vars.css';

export const imageAttachment = style([
  sprinkles({
    position: 'relative',
    borderRadius: 'medium',
  }),
  {
    width: 'fit-content',
  },
]);

export const attachmentImage = style([
  sprinkles({
    display: 'block',
    borderRadius: 'large',
  }),
  {
    maxHeight: '200px',
    maxWidth: '100%',
    objectFit: 'contain',
  },
]);

export const small = style({
  maxHeight: '70px',
  maxWidth: 'auto',
});

export const clearImage = style([
  sprinkles({
    position: 'absolute',
    top: 0,
    right: 0,
    borderRadius: 'full',
    padding: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }),
  {
    appearance: 'none',
    background: colorPaletteVars.background.surface,
    border: `1px solid ${colorPaletteVars.border.standard}`,
    height: '24px',
    width: '24px',
    transform: 'translate(50%, -50%)',
    '::before': {
      content: '',
      position: 'absolute',
      height: vars.touchableSize,
      width: vars.touchableSize,
      flexShrink: 0,
    },
  },
]);
