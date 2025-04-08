import { style } from '@vanilla-extract/css';
import { colorPaletteVars, sprinkles } from '../sprinkles.css';
import { calc } from '@vanilla-extract/css-utils';
import { vars } from '../vars.css';

export const button = style([
  sprinkles({
    position: 'relative',
    font: 'small',
    border: 0,
    padding: 'small',
    appearance: 'none',
  }),
  {
    color: 'currentColor',
    backgroundColor: 'transparent',
    outline: 'none',
    textDecoration: 'underline',
    margin: calc(vars.space.small).negate().toString(),
    '::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      borderRadius: vars.radii.large,
      boxShadow: colorPaletteVars.shadows.focus,
      cursor: 'pointer',
      opacity: 0,
      transform: 'scale(0.8)',
      transition: vars.transition.medium,
    },
    selectors: {
      [`&:focus::before, &:hover::before`]: {
        opacity: 1,
        transform: 'scale(1)',
      },
    },
  },
]);
