import { style } from '@vanilla-extract/css';
import { colorPaletteVars, sprinkles } from '../sprinkles.css';

export const suggestion = style([
  sprinkles({
    position: 'relative',
    paddingLeft: 'large',
    paddingX: 'medium',
    paddingY: 'medium',
    borderRadius: 'large',
  }),
  {
    border: `1px solid ${colorPaletteVars.border.standard}`,
  },
]);

export const selected = style([
  {
    borderColor: 'transparent',
    background: colorPaletteVars.background.selection,
  },
]);

export const suggestionButton = style([
  sprinkles({
    position: 'absolute',
    inset: 0,
    padding: 'none',
    borderRadius: 'large',
    border: 0,
    cursor: 'pointer',
  }),
  {
    appearance: 'none',
    background: 'transparent',
    ':focus-visible': {
      outline: 'none',
      boxShadow: colorPaletteVars.shadows.focus,
    },
    ':hover': {
      backgroundColor: colorPaletteVars.background.neutral,
      opacity: 0.4,
    },
  },
]);

export const suggestionLabel = style({
  isolation: 'isolate',
  pointerEvents: 'none',
});
