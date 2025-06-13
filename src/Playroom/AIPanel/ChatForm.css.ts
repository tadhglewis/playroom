import { style } from '@vanilla-extract/css';

import { colorPaletteVars, sprinkles } from '../sprinkles.css';
import { vars } from '../vars.css';

const fieldVerticalPadding = 'xlarge';

export const fieldContainer = style([
  sprinkles({
    position: 'relative',
    paddingX: 'small',
    paddingBottom: fieldVerticalPadding,
  }),
  {
    borderTop: `1px solid ${colorPaletteVars.border.standard}`,
  },
]);

export const textarea = style([
  sprinkles({
    font: 'large',
    width: 'full',
    paddingX: 'large',
    paddingY: fieldVerticalPadding,
    boxSizing: 'border-box',
    borderRadius: 'medium',
  }),
  {
    resize: 'none',
    outline: 'none',
    border: 'none',
    color: colorPaletteVars.foreground.neutral,
    background: colorPaletteVars.background.surface,
    '::placeholder': {
      color: colorPaletteVars.foreground.neutralSoft,
    },
  },
]);

export const focusIndicator = style({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  height: '2px',
  backgroundColor: colorPaletteVars.foreground.accent,
  transition: vars.transition.fast,
  transformOrigin: '50% 50%',
  selectors: {
    [`${textarea}:not(:focus-visible) ~ &`]: {
      opacity: 0,
      transform: 'translateY(-3px) scaleX(.75)',
    },
  },
});

export const imageInput = style([
  sprinkles({
    position: 'absolute',
    pointerEvents: 'none',
    opacity: 0,
    bottom: 0,
    overflow: 'hidden',
    height: 'full',
    width: 'full',
  }),
]);
