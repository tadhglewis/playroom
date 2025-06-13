import { useState } from 'react';

import { useCopy } from '../../utils/useCopy';
import usePreviewUrl from '../../utils/usePreviewUrl';
import { Button } from '../Button/Button';
import { Heading } from '../Heading/Heading';
import { Inline } from '../Inline/Inline';
import { Stack } from '../Stack/Stack';
import { ToolbarPanel } from '../ToolbarPanel/ToolbarPanel';
import PlayIcon from '../icons/PlayIcon';
import ShareIcon from '../icons/ShareIcon';
import TickIcon from '../icons/TickIcon';

import { ThemeSelector } from './ThemeSelector';

interface PreviewPanelProps {
  themes: string[];
  visibleThemes: string[] | undefined;
}
export default ({ themes, visibleThemes }: PreviewPanelProps) => {
  const defaultTheme =
    visibleThemes && visibleThemes.length > 0 ? visibleThemes[0] : themes[0];
  const [userSelectedTheme, setUserSelectedTheme] = useState<
    string | undefined
  >();

  const activeTheme = userSelectedTheme || defaultTheme;

  const isThemed = themes.length > 1;

  const prototypeUrl = usePreviewUrl(activeTheme);
  const { copyClick, copying } = useCopy();

  return (
    <ToolbarPanel>
      <Stack space="xxlarge">
        <Heading as="h4" level="3">
          Preview
        </Heading>

        {isThemed ? (
          <ThemeSelector
            themes={themes}
            visibleThemes={visibleThemes}
            activeTheme={activeTheme}
            onChange={setUserSelectedTheme}
          />
        ) : null}

        <Inline space="large">
          <Button
            as="a"
            href={prototypeUrl}
            target="_blank"
            title="Open preview in new window"
            rel="noopener noreferrer"
            icon={<PlayIcon size={20} />}
          >
            Open
          </Button>
          <Button
            onClick={() => copyClick(prototypeUrl)}
            title="Copy preview link to clipboard"
            tone={copying ? 'positive' : undefined}
            icon={copying ? <TickIcon size={18} /> : <ShareIcon size={18} />}
          >
            {copying ? 'Copied ' : 'Copy link '}
          </Button>
        </Inline>
      </Stack>
    </ToolbarPanel>
  );
};
