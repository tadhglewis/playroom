import { style, createVar } from '@vanilla-extract/css';
import { calc } from '@vanilla-extract/css-utils';
import { sprinkles, colorPaletteVars } from '../sprinkles.css';
import { vars } from '../vars.css';

export const reset = style([
  sprinkles({
    boxSizing: 'border-box',
    border: 0,
    margin: 'none',
    padding: 'none',
    appearance: 'none',
    userSelect: 'none',
    position: 'relative',
    display: 'flex',
    placeItems: 'center',
  }),
  {
    background: 'transparent',
    outline: 'none',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    WebkitTapHighlightColor: 'transparent',
  },
]);

const highlightColor = createVar();

export const base = style([
  sprinkles({
    borderRadius: 'large',
    paddingY: 'none',
    font: 'standard',
  }),
  {
    vars: {
      [highlightColor]: 'currentColor',
    },
    pointerEvents: 'auto',
    color: highlightColor,
    ':disabled': {
      pointerEvents: 'none',
    },
    selectors: {
      [`&:not(:disabled)::after`]: {
        content: '',
        position: 'absolute',
        transform: 'translateY(-50%)',
        minHeight: vars.touchableSize,
        minWidth: vars.touchableSize,
        left: calc(vars.grid).multiply(2).negate().toString(),
        right: calc(vars.grid).multiply(2).negate().toString(),
        height: '100%',
        top: '50%',
      },
      [`&:not(:disabled)`]: {
        cursor: 'pointer',
      },
      [`&:hover:not(:disabled), &:focus-visible:not(:disabled), &:has(:focus-visible)`]:
        {
          vars: {
            [highlightColor]: colorPaletteVars.foreground.accent,
          },
          borderColor: highlightColor,
        },
      [`&:active:not(:disabled)`]: {
        transform: 'scale(0.98)',
      },
      [`&:focus:not(:active):not(:hover):not([disabled]), &:has(:focus-visible)`]:
        {
          boxShadow: colorPaletteVars.shadows.focus,
        },
    },
  },
]);

export const disabled = style({
  selectors: {
    [`&:disabled`]: {
      opacity: 0.6,
    },
  },
});

export const variants = {
  ghost: style([
    sprinkles({
      paddingX: 'medium',
    }),
    {
      height: calc(vars.grid).multiply(9).toString(),
      border: `1px solid ${colorPaletteVars.foreground.neutralSoft}`,
    },
  ]),
  transparent: style([
    sprinkles({
      // paddingX: 'small',
    }),
  ]),
};

export const tone = {
  positive: style({
    vars: {
      [highlightColor]: `${colorPaletteVars.foreground.positive} !important`,
    },
    borderColor: highlightColor,
  }),
  accent: style({
    vars: {
      [highlightColor]: `${colorPaletteVars.foreground.accent} !important`,
    },
    borderColor: highlightColor,
  }),
};

export const iconContainer = style([
  sprinkles({ position: 'relative', paddingLeft: 'small' }),
  {
    top: '1px',
  },
]);
