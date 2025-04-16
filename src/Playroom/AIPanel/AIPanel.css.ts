import { style } from '@vanilla-extract/css';
import { sprinkles } from '../sprinkles.css';
import { vars } from '../vars.css';
import { calc } from '@vanilla-extract/css-utils';

export const root = sprinkles({
  position: 'relative',
  width: 'full',
  height: 'full',
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
