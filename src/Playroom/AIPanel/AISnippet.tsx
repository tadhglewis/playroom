import { useCopy } from '../../utils/useCopy';

import { Box } from '../Box/Box';
import { Button } from '../Button/Button';
import CopyIcon from '../icons/CopyIcon';
import TickIcon from '../icons/TickIcon';
import { Inline } from '../Inline/Inline';
import { Spread } from '../Spread/Spread';
import { Stack } from '../Stack/Stack';
import { Text } from '../Text/Text';

import * as styles from './AISnippet.css';

export const AISnippet = ({
  snippet,
  label,
  active,
  onApply,
  onSelect,
}: {
  snippet: string;
  label: string;
  active: boolean;
  onApply: () => void;
  onSelect: () => void;
}) => {
  const { copyClick, copying } = useCopy();

  return (
    <Box
      className={{
        [styles.suggestion]: true,
        [styles.selected]: active,
      }}
    >
      <Box
        aria-label="View suggestion"
        component="button"
        className={styles.suggestionButton}
        onClick={onSelect}
      />
      <Box className={styles.suggestionLabel}>
        <Stack space="small">
          <Spread space="medium" alignY="center">
            <Text weight={active ? 'strong' : undefined}>{label}</Text>
            <Inline space="xlarge" alignY="center">
              <Button
                aria-label={copying ? 'Copied' : 'Copy code'}
                title={copying ? 'Copied' : 'Copy code'}
                variant="transparent"
                tone={copying ? 'positive' : undefined}
                onClick={() => copyClick(snippet)}
              >
                {copying ? <TickIcon size={16} /> : <CopyIcon size={16} />}
              </Button>
              <Button tone={active ? 'accent' : undefined} onClick={onApply}>
                Apply
              </Button>
            </Inline>
          </Spread>
        </Stack>
      </Box>
    </Box>
  );
};
