import { style } from '@vanilla-extract/css';
import { vars } from '../vars.css';
import { colorPaletteVars, sprinkles } from '../sprinkles.css';
import { calc } from '@vanilla-extract/css-utils';

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
  marginTop: calc(vars.space.large).negate().toString(),
  borderTopRightRadius: 0,
});

export const messageContent = style({
  lineHeight: '1.5em',
});

export const readMessage = style({
  verticalAlign: 'middle',
  display: 'inline-block',
});
