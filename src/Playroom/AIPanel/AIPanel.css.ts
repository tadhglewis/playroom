import { style } from '@vanilla-extract/css';
import { sprinkles, colorPaletteVars } from '../sprinkles.css';
import { vars } from '../vars.css';
import { calc } from '@vanilla-extract/css-utils';

const fieldVerticalPadding = 'xlarge';

export const root = sprinkles({
  position: 'relative',
  width: 'full',
  height: 'full',
});

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

const messagesEndBufferSize = 'xxlarge';
export const messageContainer = style([
  sprinkles({
    paddingX: 'xxlarge',
    paddingBottom: messagesEndBufferSize,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    gap: 'xlarge',
  }),
  {
    minHeight: calc('100%')
      .subtract(vars.space[messagesEndBufferSize])
      .toString(),
  },
]);

export const message = style([
  {
    borderRadius: '12px', // xlarge
    width: 'fit-content',
    whiteSpace: 'pre-line',
  },
]);

export const assistantMessage = style([
  {
    marginRight: vars.space.xxlarge,
    alignSelf: 'flex-start',
  },
]);

export const userMessage = style([
  sprinkles({
    paddingX: 'large',
    paddingY: 'medium',
  }),
  {
    backgroundColor: colorPaletteVars.background.neutral,
    marginLeft: vars.space.xxlarge,
    borderBottomRightRadius: 0,
    alignSelf: 'flex-end',
  },
]);

export const userMessageBlock = style({
  selectors: {
    [`${userMessage}&`]: {
      marginTop: calc(vars.space.large).negate().toString(),
      borderTopRightRadius: 0,
    },
  },
});

export const messageContent = style({
  lineHeight: '1.5em',
});

export const readMessage = style({
  verticalAlign: 'middle',
  display: 'inline-block',
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

export const imageAttachment = style([
  sprinkles({
    position: 'relative',
    borderRadius: 'medium',
  }),
  {
    width: 'fit-content',
  },
]);

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

export const attachmentImage = style([
  sprinkles({
    display: 'block',
    borderRadius: 'large',
  }),
  {
    maxHeight: '70px',
    height: 'auto',
    maxWidth: '70px',
    objectFit: 'contain',
  },
]);
