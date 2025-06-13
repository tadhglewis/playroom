import { useChat, type Message } from '@ai-sdk/react';
import {
  createContext,
  type Dispatch,
  type SetStateAction,
  useContext,
  useState,
  type ReactNode,
} from 'react';

import { StoreContext } from '../../StoreContext/StoreContext';
import type { PlayroomProps } from '../Playroom';

interface Props {
  children: ReactNode;
  snippets: PlayroomProps['snippets'];
  components: PlayroomProps['components'];
}

// Only check if it starts with `{` as the end is not available until
// streaming finishes
const isMessageStructuredResponse = (str: string) => str.startsWith('{');

const parseResponse = (str: string) => {
  try {
    return JSON.parse(str) as {
      message: string;
      [key: string]: string;
    };
  } catch {}
};

export const AssistantProvider = ({
  children,
  snippets,
  components,
}: Props) => {
  const [state, dispatch] = useContext(StoreContext);
  const [error, setError] = useState('');
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [activeSuggestion, setActiveSuggestion] = useState<{
    messageId: string;
    variantIndex: number;
  } | null>(null);

  const systemPrompt = `
You are an expert React developer specializing in UI component composition. Your task is to help users create UI layouts using only the components provided.

## Available Components

${Object.keys(components)}

## Component Snippets

${snippets.map(
  ({ name, code, group }) =>
    `### ${name} (${group})
\`\`\`jsx
${code}
\`\`\`
`
)}

\`\`\`jsx
### Page header example (Header)
<Box paddingY="small" background="surface">
  <PageBlock width="medium">
    <Columns space="small" alignY="center">
      <Column>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 170.079 68.031"
          y="0px"
          x="0px"
          display="block"
          height="40px"
        >
          <g fill="#000">
            <path d="M86.641,45.601c-3.697,0-7.037-0.408-10.012-3.385l3.834-3.833c1.942,1.938,4.467,2.208,6.269,2.208 c2.031,0,4.148-0.675,4.148-2.434c0-1.174-0.629-1.985-2.479-2.167l-3.699-0.36c-4.24-0.404-6.854-2.253-6.854-6.586 c0-4.869,4.282-7.485,9.064-7.485c3.653,0,6.72,0.632,8.976,2.75l-3.607,3.653c-1.354-1.217-3.43-1.576-5.459-1.576 c-2.344,0-3.336,1.082-3.336,2.254c0,0.857,0.361,1.85,2.436,2.03l3.7,0.361c4.643,0.45,6.992,2.932,6.992,6.9 C96.612,43.118,92.19,45.601,86.641,45.601z"></path>
            <path d="M104.548,35.405c0,3.022,1.85,5.232,5.143,5.232c2.568,0,3.832-0.722,5.32-2.21l3.564,3.472 c-2.391,2.392-4.691,3.701-8.932,3.701c-5.547,0-10.867-2.526-10.867-12.045c0-7.668,4.148-11.997,10.236-11.997 c6.539,0,10.238,4.783,10.238,11.232v2.614H104.548z M112.938,28.863c-0.635-1.396-1.943-2.434-3.926-2.434 c-1.986,0-3.293,1.038-3.924,2.434c-0.361,0.859-0.494,1.491-0.541,2.529h8.932C113.433,30.354,113.298,29.723,112.938,28.863z"></path>
            <path d="M127.685,35.405c0,3.022,1.852,5.232,5.141,5.232c2.572,0,3.836-0.722,5.324-2.21l3.562,3.472 c-2.391,2.392-4.691,3.701-8.93,3.701c-5.549,0-10.871-2.526-10.871-12.045c0-7.668,4.15-11.997,10.24-11.997 c6.539,0,10.238,4.783,10.238,11.232v2.614H127.685z M136.075,28.863c-0.633-1.396-1.941-2.434-3.924-2.434 c-1.986,0-3.295,1.038-3.926,2.434c-0.361,0.859-0.496,1.491-0.541,2.529h8.932C136.571,30.354,136.435,29.723,136.075,28.863z"></path>
            <path d="M160.339,45.331l-5.77-9.792l-2.486,2.802v6.99h-5.861V13.214h5.861v18.224l7.805-9.608h7.084l-8.391,9.473l9.02,14.029 H160.339z"></path>
          </g>
          <path
            fill="#0D3880"
            d="M34.015,1.51c-17.952,0-32.506,14.552-32.506,32.507c0,17.952,14.554,32.505,32.506,32.505 c17.958,0,32.508-14.553,32.508-32.505C66.523,16.062,51.972,1.51,34.015,1.51z M8.262,41.733c-0.281,0-0.511-0.226-0.511-0.504 c0-0.281,0.229-0.511,0.511-0.511c0.278,0,0.504,0.229,0.504,0.511C8.766,41.508,8.541,41.733,8.262,41.733z M8.262,34.907 c-0.281,0-0.511-0.229-0.511-0.51s0.229-0.509,0.511-0.509c0.278,0,0.504,0.228,0.504,0.509S8.541,34.907,8.262,34.907z M8.262,28.077c-0.281,0-0.511-0.229-0.511-0.509c0-0.281,0.229-0.507,0.511-0.507c0.278,0,0.504,0.226,0.504,0.507 C8.766,27.849,8.541,28.077,8.262,28.077z M11.764,41.991c-0.422,0-0.762-0.342-0.762-0.762c0-0.422,0.34-0.765,0.762-0.765 c0.421,0,0.762,0.343,0.762,0.765C12.526,41.649,12.186,41.991,11.764,41.991z M11.764,35.158c-0.422,0-0.762-0.339-0.762-0.761 c0-0.42,0.34-0.761,0.762-0.761c0.421,0,0.762,0.341,0.762,0.761C12.526,34.819,12.186,35.158,11.764,35.158z M11.764,28.33 c-0.422,0-0.762-0.341-0.762-0.762c0-0.422,0.34-0.763,0.762-0.763c0.421,0,0.762,0.341,0.762,0.763 C12.526,27.989,12.186,28.33,11.764,28.33z M15.867,42.246c-0.562,0-1.019-0.455-1.019-1.017c0-0.561,0.457-1.018,1.019-1.018 c0.558,0,1.016,0.457,1.016,1.018C16.882,41.791,16.424,42.246,15.867,42.246z M15.867,35.412c-0.562,0-1.019-0.453-1.019-1.015 c0-0.562,0.457-1.016,1.019-1.016c0.558,0,1.016,0.453,1.016,1.016C16.882,34.959,16.424,35.412,15.867,35.412z M15.867,28.583 c-0.562,0-1.019-0.451-1.019-1.015c0-0.562,0.457-1.016,1.019-1.016c0.558,0,1.016,0.453,1.016,1.016 C16.882,28.132,16.424,28.583,15.867,28.583z M20.18,42.497c-0.702,0-1.27-0.567-1.27-1.268c0-0.705,0.568-1.27,1.27-1.27 c0.704,0,1.27,0.564,1.27,1.27C21.45,41.93,20.884,42.497,20.18,42.497z M20.18,35.669c-0.702,0-1.27-0.568-1.27-1.271 s0.568-1.269,1.27-1.269c0.704,0,1.27,0.565,1.27,1.269S20.884,35.669,20.18,35.669z M20.18,28.84c-0.702,0-1.27-0.568-1.27-1.271 s0.568-1.271,1.27-1.271c0.704,0,1.27,0.567,1.27,1.271S20.884,28.84,20.18,28.84z M25.234,42.752c-0.842,0-1.523-0.681-1.523-1.522 c0-0.845,0.682-1.523,1.523-1.523c0.84,0,1.522,0.679,1.522,1.523C26.756,42.071,26.074,42.752,25.234,42.752z M25.234,35.922 c-0.842,0-1.523-0.684-1.523-1.524c0-0.842,0.682-1.523,1.523-1.523c0.84,0,1.522,0.682,1.522,1.523 C26.756,35.238,26.074,35.922,25.234,35.922z M25.234,29.093c-0.842,0-1.523-0.683-1.523-1.524s0.682-1.525,1.523-1.525 c0.84,0,1.522,0.684,1.522,1.525S26.074,29.093,25.234,29.093z M30.523,43.005c-0.983,0-1.778-0.792-1.778-1.775 c0-0.982,0.795-1.78,1.778-1.78c0.985,0,1.779,0.798,1.779,1.78C32.302,42.213,31.508,43.005,30.523,43.005z M30.523,36.176 c-0.983,0-1.778-0.796-1.778-1.778s0.795-1.776,1.778-1.776c0.985,0,1.779,0.794,1.779,1.776S31.508,36.176,30.523,36.176z M30.523,29.346c-0.983,0-1.778-0.796-1.778-1.777s0.795-1.776,1.778-1.776c0.985,0,1.779,0.795,1.779,1.776 S31.508,29.346,30.523,29.346z M36.812,56.922c-1.121,0-2.027-0.911-2.027-2.034c0-1.119,0.906-2.027,2.027-2.027 c1.125,0,2.035,0.908,2.035,2.027C38.847,56.011,37.938,56.922,36.812,56.922z M36.812,50.091c-1.121,0-2.027-0.91-2.027-2.03 c0-1.122,0.906-2.036,2.027-2.036c1.125,0,2.035,0.914,2.035,2.036C38.847,49.181,37.938,50.091,36.812,50.091z M36.812,43.26 c-1.121,0-2.027-0.909-2.027-2.03c0-1.123,0.906-2.033,2.027-2.033c1.125,0,2.035,0.91,2.035,2.033 C38.847,42.351,37.938,43.26,36.812,43.26z M36.812,36.43c-1.121,0-2.027-0.91-2.027-2.032c0-1.124,0.906-2.03,2.027-2.03 c1.125,0,2.035,0.906,2.035,2.03C38.847,35.52,37.938,36.43,36.812,36.43z M36.812,29.6c-1.121,0-2.027-0.908-2.027-2.031 c0-1.122,0.906-2.031,2.027-2.031c1.125,0,2.035,0.909,2.035,2.031C38.847,28.691,37.938,29.6,36.812,29.6z M36.812,22.77 c-1.121,0-2.027-0.912-2.027-2.032c0-1.123,0.906-2.03,2.027-2.03c1.125,0,2.035,0.907,2.035,2.03 C38.847,21.857,37.938,22.77,36.812,22.77z M36.812,15.938c-1.121,0-2.027-0.91-2.027-2.029c0-1.123,0.906-2.033,2.027-2.033 c1.125,0,2.035,0.91,2.035,2.033C38.847,15.027,37.938,15.938,36.812,15.938z M43.342,50.3c-1.233,0-2.238-1.002-2.238-2.239 c0-1.239,1.004-2.242,2.238-2.242c1.24,0,2.243,1.003,2.243,2.242C45.585,49.298,44.582,50.3,43.342,50.3z M43.342,43.469 c-1.233,0-2.238-1.003-2.238-2.239c0-1.239,1.004-2.242,2.238-2.242c1.24,0,2.243,1.003,2.243,2.242 C45.585,42.466,44.582,43.469,43.342,43.469z M43.342,36.64c-1.233,0-2.238-1.004-2.238-2.242c0-1.237,1.004-2.238,2.238-2.238 c1.24,0,2.243,1.001,2.243,2.238C45.585,35.636,44.582,36.64,43.342,36.64z M43.342,29.807c-1.233,0-2.238-1.002-2.238-2.238 c0-1.238,1.004-2.24,2.238-2.24c1.24,0,2.243,1.002,2.243,2.24C45.585,28.805,44.582,29.807,43.342,29.807z M43.342,22.977 c-1.233,0-2.238-1.003-2.238-2.239c0-1.239,1.004-2.242,2.238-2.242c1.24,0,2.243,1.003,2.243,2.242 C45.585,21.974,44.582,22.977,43.342,22.977z M50.351,43.765c-1.393,0-2.517-1.126-2.517-2.517c0-1.389,1.124-2.516,2.517-2.516 c1.391,0,2.513,1.127,2.513,2.516C52.863,42.639,51.742,43.765,50.351,43.765z M50.351,36.933c-1.393,0-2.517-1.123-2.517-2.515 c0-1.386,1.124-2.517,2.517-2.517c1.391,0,2.513,1.131,2.513,2.517C52.863,35.81,51.742,36.933,50.351,36.933z M50.351,30.104 c-1.393,0-2.517-1.125-2.517-2.515c0-1.393,1.124-2.517,2.517-2.517c1.391,0,2.513,1.124,2.513,2.517 C52.863,28.979,51.742,30.104,50.351,30.104z M57.49,37.219c-1.519,0-2.756-1.234-2.756-2.754c0-1.523,1.238-2.757,2.756-2.757 c1.521,0,2.754,1.233,2.754,2.757C60.244,35.984,59.012,37.219,57.49,37.219z"
          ></path>
        </svg>
      </Column>
      <Column width="content">
        <MenuRenderer
          offsetSpace="small"
          align="right"
          reserveIconSpace
          trigger={(triggerProps, { open }) => (
            <Box userSelect="none" cursor="pointer" {...triggerProps}>
              <Text>
                Playroom{" "}
                <IconChevron
                  direction={open ? "up" : "down"}
                  alignY="lowercase"
                />
              </Text>
            </Box>
          )}
        >
          <MenuItem icon={<IconProfile />}>Account</MenuItem>
          <MenuItem icon={<IconSettings />}>Settings</MenuItem>
          <MenuItem tone="critical">Sign out</MenuItem>
        </MenuRenderer>
      </Column>
    </Columns>
  </PageBlock>
</Box>
\`\`\`

\`\`\`jsx
### Page footer example (Footer)
<Box paddingBottom="xxlarge">
  <Stack space="large">
    <Divider />
    <PageBlock width="medium">
      <Stack space="large">
        <Inline space="medium" collapseBelow="tablet">
          <Text size="small" tone="secondary">
            <TextLink weight="weak">Security & Privacy</TextLink>
          </Text>
          <Text size="small" tone="secondary">
            <TextLink weight="weak">Terms & Conditions</TextLink>
          </Text>
          <Text size="small" tone="secondary">
            <TextLink weight="weak">Protect yourself online</TextLink>
          </Text>
          <Text size="small" tone="secondary">
            <TextLink weight="weak">Contact</TextLink>
          </Text>
        </Inline>
        <Stack space="medium">
          <Text size="small" tone="secondary" paddingBottom="small">
            This is placeholder email footer for Playroom. Product teams
            should install the correct Candidate or Hirer specific version
            relevant to the email audience.
          </Text>

          <Text size="small" tone="secondary">
            © SEEK Limited, 60 Cremorne St, Cremorne VIC 3121 Australia
          </Text>
        </Stack>
      </Stack>
    </PageBlock>
  </Stack>
</Box>
\`\`\`

\`\`\`jsx
### Vertically stacked page blocks (Layout: Basic page)
<Page
  footer={
    <Box paddingBottom="xxlarge">
      <Stack space="large">
        <Divider />
        <PageBlock width="medium">
          <Stack space="large">
            <Inline space="medium" collapseBelow="tablet">
              <Text size="small" tone="secondary">
                <TextLink weight="weak">Security & Privacy</TextLink>
              </Text>
              <Text size="small" tone="secondary">
                <TextLink weight="weak">Terms & Conditions</TextLink>
              </Text>
              <Text size="small" tone="secondary">
                <TextLink weight="weak">Protect yourself online</TextLink>
              </Text>
              <Text size="small" tone="secondary">
                <TextLink weight="weak">Contact</TextLink>
              </Text>
            </Inline>
            <Stack space="medium">
              <Text size="small" tone="secondary" paddingBottom="small">
                This is placeholder email footer for Playroom. Product teams
                should install the correct Candidate or Hirer specific version
                relevant to the email audience.
              </Text>

              <Text size="small" tone="secondary">
                © SEEK Limited, 60 Cremorne St, Cremorne VIC 3121 Australia
              </Text>
            </Stack>
          </Stack>
        </PageBlock>
      </Stack>
    </Box>
  }
  footerPosition="belowFold"
>
  <Stack space="large">
    <Box paddingY="small" background="surface">
      <PageBlock width="medium">
        <Columns space="small" alignY="center">
          <Column>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 170.079 68.031"
              y="0px"
              x="0px"
              display="block"
              height="40px"
            >
              <g fill="#000">
                <path d="M86.641,45.601c-3.697,0-7.037-0.408-10.012-3.385l3.834-3.833c1.942,1.938,4.467,2.208,6.269,2.208 c2.031,0,4.148-0.675,4.148-2.434c0-1.174-0.629-1.985-2.479-2.167l-3.699-0.36c-4.24-0.404-6.854-2.253-6.854-6.586 c0-4.869,4.282-7.485,9.064-7.485c3.653,0,6.72,0.632,8.976,2.75l-3.607,3.653c-1.354-1.217-3.43-1.576-5.459-1.576 c-2.344,0-3.336,1.082-3.336,2.254c0,0.857,0.361,1.85,2.436,2.03l3.7,0.361c4.643,0.45,6.992,2.932,6.992,6.9 C96.612,43.118,92.19,45.601,86.641,45.601z"></path>
                <path d="M104.548,35.405c0,3.022,1.85,5.232,5.143,5.232c2.568,0,3.832-0.722,5.32-2.21l3.564,3.472 c-2.391,2.392-4.691,3.701-8.932,3.701c-5.547,0-10.867-2.526-10.867-12.045c0-7.668,4.148-11.997,10.236-11.997 c6.539,0,10.238,4.783,10.238,11.232v2.614H104.548z M112.938,28.863c-0.635-1.396-1.943-2.434-3.926-2.434 c-1.986,0-3.293,1.038-3.924,2.434c-0.361,0.859-0.494,1.491-0.541,2.529h8.932C113.433,30.354,113.298,29.723,112.938,28.863z"></path>
                <path d="M127.685,35.405c0,3.022,1.852,5.232,5.141,5.232c2.572,0,3.836-0.722,5.324-2.21l3.562,3.472 c-2.391,2.392-4.691,3.701-8.93,3.701c-5.549,0-10.871-2.526-10.871-12.045c0-7.668,4.15-11.997,10.24-11.997 c6.539,0,10.238,4.783,10.238,11.232v2.614H127.685z M136.075,28.863c-0.633-1.396-1.941-2.434-3.924-2.434 c-1.986,0-3.295,1.038-3.926,2.434c-0.361,0.859-0.496,1.491-0.541,2.529h8.932C136.571,30.354,136.435,29.723,136.075,28.863z"></path>
                <path d="M160.339,45.331l-5.77-9.792l-2.486,2.802v6.99h-5.861V13.214h5.861v18.224l7.805-9.608h7.084l-8.391,9.473l9.02,14.029 H160.339z"></path>
              </g>
              <path
                fill="#0D3880"
                d="M34.015,1.51c-17.952,0-32.506,14.552-32.506,32.507c0,17.952,14.554,32.505,32.506,32.505 c17.958,0,32.508-14.553,32.508-32.505C66.523,16.062,51.972,1.51,34.015,1.51z M8.262,41.733c-0.281,0-0.511-0.226-0.511-0.504 c0-0.281,0.229-0.511,0.511-0.511c0.278,0,0.504,0.229,0.504,0.511C8.766,41.508,8.541,41.733,8.262,41.733z M8.262,34.907 c-0.281,0-0.511-0.229-0.511-0.51s0.229-0.509,0.511-0.509c0.278,0,0.504,0.228,0.504,0.509S8.541,34.907,8.262,34.907z M8.262,28.077c-0.281,0-0.511-0.229-0.511-0.509c0-0.281,0.229-0.507,0.511-0.507c0.278,0,0.504,0.226,0.504,0.507 C8.766,27.849,8.541,28.077,8.262,28.077z M11.764,41.991c-0.422,0-0.762-0.342-0.762-0.762c0-0.422,0.34-0.765,0.762-0.765 c0.421,0,0.762,0.343,0.762,0.765C12.526,41.649,12.186,41.991,11.764,41.991z M11.764,35.158c-0.422,0-0.762-0.339-0.762-0.761 c0-0.42,0.34-0.761,0.762-0.761c0.421,0,0.762,0.341,0.762,0.761C12.526,34.819,12.186,35.158,11.764,35.158z M11.764,28.33 c-0.422,0-0.762-0.341-0.762-0.762c0-0.422,0.34-0.763,0.762-0.763c0.421,0,0.762,0.341,0.762,0.763 C12.526,27.989,12.186,28.33,11.764,28.33z M15.867,42.246c-0.562,0-1.019-0.455-1.019-1.017c0-0.561,0.457-1.018,1.019-1.018 c0.558,0,1.016,0.457,1.016,1.018C16.882,41.791,16.424,42.246,15.867,42.246z M15.867,35.412c-0.562,0-1.019-0.453-1.019-1.015 c0-0.562,0.457-1.016,1.019-1.016c0.558,0,1.016,0.453,1.016,1.016C16.882,34.959,16.424,35.412,15.867,35.412z M15.867,28.583 c-0.562,0-1.019-0.451-1.019-1.015c0-0.562,0.457-1.016,1.019-1.016c0.558,0,1.016,0.453,1.016,1.016 C16.882,28.132,16.424,28.583,15.867,28.583z M20.18,42.497c-0.702,0-1.27-0.567-1.27-1.268c0-0.705,0.568-1.27,1.27-1.27 c0.704,0,1.27,0.564,1.27,1.27C21.45,41.93,20.884,42.497,20.18,42.497z M20.18,35.669c-0.702,0-1.27-0.568-1.27-1.271 s0.568-1.269,1.27-1.269c0.704,0,1.27,0.565,1.27,1.269S20.884,35.669,20.18,35.669z M20.18,28.84c-0.702,0-1.27-0.568-1.27-1.271 s0.568-1.271,1.27-1.271c0.704,0,1.27,0.567,1.27,1.271S20.884,28.84,20.18,28.84z M25.234,42.752c-0.842,0-1.523-0.681-1.523-1.522 c0-0.845,0.682-1.523,1.523-1.523c0.84,0,1.522,0.679,1.522,1.523C26.756,42.071,26.074,42.752,25.234,42.752z M25.234,35.922 c-0.842,0-1.523-0.684-1.523-1.524c0-0.842,0.682-1.523,1.523-1.523c0.84,0,1.522,0.682,1.522,1.523 C26.756,35.238,26.074,35.922,25.234,35.922z M25.234,29.093c-0.842,0-1.523-0.683-1.523-1.524s0.682-1.525,1.523-1.525 c0.84,0,1.522,0.684,1.522,1.525S26.074,29.093,25.234,29.093z M30.523,43.005c-0.983,0-1.778-0.792-1.778-1.775 c0-0.982,0.795-1.78,1.778-1.78c0.985,0,1.779,0.798,1.779,1.78C32.302,42.213,31.508,43.005,30.523,43.005z M30.523,36.176 c-0.983,0-1.778-0.796-1.778-1.778s0.795-1.776,1.778-1.776c0.985,0,1.779,0.794,1.779,1.776S31.508,36.176,30.523,36.176z M30.523,29.346c-0.983,0-1.778-0.796-1.778-1.777s0.795-1.776,1.778-1.776c0.985,0,1.779,0.795,1.779,1.776 S31.508,29.346,30.523,29.346z M36.812,56.922c-1.121,0-2.027-0.911-2.027-2.034c0-1.119,0.906-2.027,2.027-2.027 c1.125,0,2.035,0.908,2.035,2.027C38.847,56.011,37.938,56.922,36.812,56.922z M36.812,50.091c-1.121,0-2.027-0.91-2.027-2.03 c0-1.122,0.906-2.036,2.027-2.036c1.125,0,2.035,0.914,2.035,2.036C38.847,49.181,37.938,50.091,36.812,50.091z M36.812,43.26 c-1.121,0-2.027-0.909-2.027-2.03c0-1.123,0.906-2.033,2.027-2.033c1.125,0,2.035,0.91,2.035,2.033 C38.847,42.351,37.938,43.26,36.812,43.26z M36.812,36.43c-1.121,0-2.027-0.91-2.027-2.032c0-1.124,0.906-2.03,2.027-2.03 c1.125,0,2.035,0.906,2.035,2.03C38.847,35.52,37.938,36.43,36.812,36.43z M36.812,29.6c-1.121,0-2.027-0.908-2.027-2.031 c0-1.122,0.906-2.031,2.027-2.031c1.125,0,2.035,0.909,2.035,2.031C38.847,28.691,37.938,29.6,36.812,29.6z M36.812,22.77 c-1.121,0-2.027-0.912-2.027-2.032c0-1.123,0.906-2.03,2.027-2.03c1.125,0,2.035,0.907,2.035,2.03 C38.847,21.857,37.938,22.77,36.812,22.77z M36.812,15.938c-1.121,0-2.027-0.91-2.027-2.029c0-1.123,0.906-2.033,2.027-2.033 c1.125,0,2.035,0.91,2.035,2.033C38.847,15.027,37.938,15.938,36.812,15.938z M43.342,50.3c-1.233,0-2.238-1.002-2.238-2.239 c0-1.239,1.004-2.242,2.238-2.242c1.24,0,2.243,1.003,2.243,2.242C45.585,49.298,44.582,50.3,43.342,50.3z M43.342,43.469 c-1.233,0-2.238-1.003-2.238-2.239c0-1.239,1.004-2.242,2.238-2.242c1.24,0,2.243,1.003,2.243,2.242 C45.585,42.466,44.582,43.469,43.342,43.469z M43.342,36.64c-1.233,0-2.238-1.004-2.238-2.242c0-1.237,1.004-2.238,2.238-2.238 c1.24,0,2.243,1.001,2.243,2.238C45.585,35.636,44.582,36.64,43.342,36.64z M43.342,29.807c-1.233,0-2.238-1.002-2.238-2.238 c0-1.238,1.004-2.24,2.238-2.24c1.24,0,2.243,1.002,2.243,2.24C45.585,28.805,44.582,29.807,43.342,29.807z M43.342,22.977 c-1.233,0-2.238-1.003-2.238-2.239c0-1.239,1.004-2.242,2.238-2.242c1.24,0,2.243,1.003,2.243,2.242 C45.585,21.974,44.582,22.977,43.342,22.977z M50.351,43.765c-1.393,0-2.517-1.126-2.517-2.517c0-1.389,1.124-2.516,2.517-2.516 c1.391,0,2.513,1.127,2.513,2.516C52.863,42.639,51.742,43.765,50.351,43.765z M50.351,36.933c-1.393,0-2.517-1.123-2.517-2.515 c0-1.386,1.124-2.517,2.517-2.517c1.391,0,2.513,1.131,2.513,2.517C52.863,35.81,51.742,36.933,50.351,36.933z M50.351,30.104 c-1.393,0-2.517-1.125-2.517-2.515c0-1.393,1.124-2.517,2.517-2.517c1.391,0,2.513,1.124,2.513,2.517 C52.863,28.979,51.742,30.104,50.351,30.104z M57.49,37.219c-1.519,0-2.756-1.234-2.756-2.754c0-1.523,1.238-2.757,2.756-2.757 c1.521,0,2.754,1.233,2.754,2.757C60.244,35.984,59.012,37.219,57.49,37.219z"
              ></path>
            </svg>
          </Column>
          <Column width="content">
            <MenuRenderer
              offsetSpace="small"
              align="right"
              reserveIconSpace
              trigger={(triggerProps, { open }) => (
                <Box userSelect="none" cursor="pointer" {...triggerProps}>
                  <Text>
                    Playroom{" "}
                    <IconChevron
                      direction={open ? "up" : "down"}
                      alignY="lowercase"
                    />
                  </Text>
                </Box>
              )}
            >
              <MenuItem icon={<IconProfile />}>Account</MenuItem>
              <MenuItem icon={<IconSettings />}>Settings</MenuItem>
              <MenuItem tone="critical">Sign out</MenuItem>
            </MenuRenderer>
          </Column>
        </Columns>
      </PageBlock>
    </Box>

    <Stack space="xxlarge">
      <PageBlock width="medium">
        <Stack space="large">
          <Heading level="2">Page Layout</Heading>

          <Text>
            Combines a <Strong>Heading level 2</Strong> with{" "}
            <Strong>xxlarge Stack</Strong> spacing between sections, where
            each section uses a <Strong>medium PageBlock</Strong> to establish
            content max width and consistent screen gutters.
          </Text>

          <Text>
            If providing text immediately below the Heading, consider using{" "}
            <Strong>standard Text</Strong> and grouping with a{" "}
            <Strong>large Stack</Strong>.
          </Text>
        </Stack>
      </PageBlock>

      <PageBlock width="medium">
        <Placeholder label="Section" height={500} />
      </PageBlock>

      <PageBlock width="medium">
        <Placeholder label="Section" height={300} />
      </PageBlock>

      <PageBlock width="medium">
        <Placeholder label="Section" height={400} />
      </PageBlock>
    </Stack>
  </Stack>
</Page>
\`\`\`

\`\`\`jsx
### Page block of vertically stacked cards (Pattern: Card list)
<PageBlock width="medium">
  <Stack space="large">
    <Stack space="small">
      <Heading level="3">Section Heading</Heading>

      <Text>
        Optional subtitle. Extends on the “Section Spacing” guidance (
        <Strong>large space</Strong>), and uses a <Strong>small Stack</Strong>{" "}
        for the Card list.
      </Text>
    </Stack>

    <Stack component="ul" space="small">
      <Card>
        <Stack space="medium">
          <Stack space="small">
            <Heading level="4">Heading</Heading>
            <Text>Subtitle</Text>
          </Stack>
          <Stack space="small">
            <Text>Text</Text>
            <Text>Text</Text>
          </Stack>
          <Text tone="secondary" size="small">Date</Text>
        </Stack>
      </Card>

      <Card>
        <Stack space="medium">
          <Stack space="small">
            <Heading level="4">Heading</Heading>
            <Text>Subtitle</Text>
          </Stack>
          <Stack space="small">
            <Text>Text item</Text>
            <Text>Text item</Text>
          </Stack>
          <Text tone="secondary" size="small">Date</Text>
        </Stack>
      </Card>

      <Card>
        <Stack space="medium">
          <Stack space="small">
            <Heading level="4">Heading</Heading>
            <Text>Subtitle</Text>
          </Stack>
          <Stack space="small">
            <Text>Text item</Text>
            <Text>Text item</Text>
          </Stack>
          <Text tone="secondary" size="small">Date</Text>
        </Stack>
      </Card>
    </Stack>

    <Actions>
      <Button>Action (optional)</Button>
    </Actions>
  </Stack>
</PageBlock>
\`\`\`

\`\`\`jsx
### A visually prominent section with responsive rounding (Pattern: Branded container)
<Box paddingX={{ tablet: "gutter" }}>
  <ContentBlock width="large">
    <Box
      background="brand"
      paddingY="xlarge"
      borderRadius={{ tablet: "xlarge" }}
    >
      <PageBlock width="medium">
        <Stack space="large">
          <Heading level="1">Title</Heading>

          <Stack space="small">
            <Text icon={<IconLocation tone="secondary" />}>Item 1</Text>
            <Text icon={<IconMail tone="secondary" />}>Item 2</Text>
          </Stack>
        </Stack>
      </PageBlock>
    </Box>
  </ContentBlock>
</Box>
\`\`\`

\`\`\`jsx
### Page block of horizontal list of cards (Pattern: Card list)
<PageBlock width="medium">
  <Stack space="large">
    <Stack space="small">
      <Heading level="3">Section Heading</Heading>

      <Text>
        Optional subtitle. Extends on the “Section Spacing” guidance (
        <Strong>large space</Strong>), and uses a <Strong>small Stack</Strong>{" "}
        for the Card list.
      </Text>
    </Stack>

    <Columns space="small">
      <Column>
        <Card>
          <Stack space="medium">
            <Stack space="small">
              <Heading level="4">Heading</Heading>
              <Text>Subtitle</Text>
            </Stack>
            <Stack space="small">
              <Text>Text</Text>
              <Text>Text</Text>
            </Stack>
            <Text tone="secondary" size="small">Date</Text>
          </Stack>
        </Card>
      </Column>
      <Column>
        <Card>
          <Stack space="medium">
            <Stack space="small">
              <Heading level="4">Heading</Heading>
              <Text>Subtitle</Text>
            </Stack>
            <Stack space="small">
              <Text>Text</Text>
              <Text>Text</Text>
            </Stack>
            <Text tone="secondary" size="small">Date</Text>
          </Stack>
        </Card>
      </Column>
      <Column>
        <Card>
          <Stack space="medium">
            <Stack space="small">
              <Heading level="4">Heading</Heading>
              <Text>Subtitle</Text>
            </Stack>
            <Stack space="small">
              <Text>Text</Text>
              <Text>Text</Text>
            </Stack>
            <Text tone="secondary" size="small">Date</Text>
          </Stack>
        </Card>
      </Column>
    </Columns>

    <Actions>
      <Button>Action (optional)</Button>
    </Actions>
  </Stack>
</PageBlock>
\`\`\`

\`\`\`jsx
### Job Summary (Card)
<Card>
  <Stack space="medium">
    <Spread space="small">
      <Stack space="small">
        <Badge tone="positive">
          New
        </Badge>
        <Heading level="4">
          Product Designer
        </Heading>
        <Inline alignY="center" space="small">
          <Text>
            Braid Design Pty Ltd
          </Text>
          <Rating rating={4.5} />
        </Inline>
      </Stack>
      <ButtonIcon
        icon={<IconBookmark />}
        label="Save job"
        size="large"
        variant="transparent"
      />
    </Spread>
    <Stack space="small">
      <Text icon={<IconLocation />} tone="secondary">
        Melbourne
      </Text>
      <Text icon={<IconTag />} tone="secondary">
        Information Technology
      </Text>
      <Text icon={<IconMoney />} tone="secondary">
        150k+
      </Text>
    </Stack>
    <Text>
      Long description of card details providing more information.
    </Text>
    <Text size="small" tone="secondary">
      2d ago
    </Text>
  </Stack>
</Card>
\`\`\`


\`\`\`jsx
<Stack space="medium">
  <Checkbox label="Checkbox" stateName="myCheckbox" />

  {getState("myCheckbox") && (
    <Notice tone="positive">
      <Text>Good job! You checked the checkbox!</Text>
    </Notice>
  )}
</Stack>
\`\`\`

\`\`\`jsx
<Stack space="medium">
  <Checkbox label="Checkbox" stateName="myCheckbox" />

  {getState("myCheckbox") ? (
    <Notice tone="positive">
      <Text>Good job! You checked the checkbox!</Text>
    </Notice>
  ) : (
    <Notice tone="critical">
      <Text>Oops! You haven’t checked the checkbox!</Text>
    </Notice>
  )}
</Stack>
\`\`\`

\`\`\`jsx
{setDefaultState("myCheckbox", true)}

<Stack space="medium">
  <Checkbox label="Checkbox" stateName="myCheckbox" />

  {getState("myCheckbox") ? (
    <Notice tone="positive">
      <Text>Good job! You checked the checkbox!</Text>
    </Notice>
  ) : (
    <Notice tone="critical">
      <Text>Oops! You haven’t checked the checkbox!</Text>
    </Notice>
  )}
</Stack>
\`\`\`

\`\`\`jsx
<Card>
  <Stack space="large">
    <TextField label="First name" stateName="firstName" />
    <TextField label="Last name" stateName="lastName" />

    {getState("firstName") && getState("lastName") ? (
      <Heading level="4">
        👋 Hello {getState("firstName")} {getState("lastName")}!
      </Heading>
    ) : null}
  </Stack>
</Card>
\`\`\`

\`\`\`jsx
{setDefaultState("screen", "Home")}

{getState("screen") === "Home" && (
  <Card>
    <Stack space="large">
      <Heading level="3">Home</Heading>
      <Actions>
        <Button onClick={() => setState("screen", "Welcome")}>Sign in</Button>
      </Actions>
    </Stack>
  </Card>
)}

{getState("screen") === "Welcome" && (
  <Card>
    <Stack space="large">
      <Heading level="3">👋 Welcome!</Heading>
      <Placeholder height={100} />
      <Actions>
        <Button onClick={() => resetState("screen")}>Sign out</Button>
      </Actions>
    </Stack>
  </Card>
)}
\`\`\`

## Instructions

1. Create concise, elegant layouts using ONLY the components listed above.
2. Generate valid JSX with proper nesting and indentation.
3. Use props as shown in the component definitions.
4. When modifying existing code, preserve the structure while making requested changes.
5. If the user asks for a component you don't have, use the closest available alternative.
6. MUST follow snippets examples and syntax. For example, if a component is nested in a provider, you must always add the provider.

## Response Format (VERY IMPORTANT)

Return a JSON object in the following format:

{
  "1": "<JSX code>",
  "2": "<JSX code>",
  "3": "<JSX code>",
  "4": "<JSX code>",
  "5": "<JSX code>",
  "6": "<JSX code>",
  "7": "<JSX code>",
  "8": "<JSX code>",
  "9": "<JSX code>",
  "message": "<message>"
}

1 must contain valid JSX. No explanations, no markdown, no code blocks (.e.g \`\`\`JSX). The code will be directly rendered in the UI. Ensure all opening tags have matching closing tags.
2 to 9 are optional and can be used to provide alternative suggestions. If you have multiple suggestions, return them in the order of preference.
message must contain the follow-up message to the end user.

Generate and return only 1 unless specifically asked to generate multiple versions, options, or variants.
`;
  const preprompt: Message[] = [
    {
      id: 'system-1',
      role: 'system',
      content: systemPrompt,
    },

    ...(state.code
      ? [
          {
            id: 'initial-code',
            role: 'system' as const,
            content: `Current code to modify if requested:\n\n${state.code}`,
          },
        ]
      : []),

    {
      id: 'welcome',
      role: 'assistant',
      content: state.code
        ? 'What changes would you like to make?'
        : "Describe what you'd like to build!",
    },
  ];

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    status,
    setInput,
    setMessages,
    error: chatError,
  } = useChat({
    api: 'http://localhost:15387/api/chat',
    // api: 'https://braid-ai.ssod.skinfra.xyz/_s2s/api/chat',
    headers: { 'X-Request-Via': 'SSOD' },
    initialMessages: preprompt,
    streamProtocol: 'text',
    onFinish: (message) => {
      const parsedMessage = parseResponse(message.content);
      if (message.role === 'assistant' && parsedMessage) {
        setActiveSuggestion({
          messageId: message.id,
          variantIndex: 0,
        });
        dispatch({
          type: 'previewSuggestion',
          payload: {
            code: parsedMessage['1'],
          },
        });
      }
    },
    onError: (err) => {
      setError(err.message || 'An error occurred while generating UI');
    },
  });

  const errorMessage = error || chatError?.message;
  const loading =
    !errorMessage && (status === 'streaming' || status === 'submitted');
  const displayMessages = messages
    .filter(
      (msg, index) =>
        msg.role !== 'system' &&
        !(
          loading &&
          index === messages.length - 1 &&
          (!msg.content || isMessageStructuredResponse(msg.content))
        )
    )
    .map((message) => {
      const { message: messageContent, ...variants } =
        parseResponse(message.content) ?? {};

      return {
        id: message.id,
        role: message.role,
        message: messageContent || message.content,
        attachments: message.experimental_attachments,
        variants: Object.values(variants).map((variant, variantIndex) => ({
          variant,
          active:
            message.id === activeSuggestion?.messageId &&
            variantIndex === activeSuggestion.variantIndex,
        })),
      };
    });

  const reset = () => {
    setMessages(preprompt);
    setImageDataUrl(null);
  };

  const applyVariant: AssistantContextValue['applyVariant'] = (variant) => {
    setActiveSuggestion(null);
    dispatch({
      type: 'updateCode',
      payload: {
        code: variant,
      },
    });
  };

  const previewVariant: AssistantContextValue['previewVariant'] = ({
    variant,
    id,
    variantIndex,
  }) => {
    setActiveSuggestion({
      messageId: id,
      variantIndex,
    });
    dispatch({
      type: 'previewSuggestion',
      payload: {
        code: variant,
      },
    });
  };

  const resetPreviewVariant = () => {
    setActiveSuggestion(null);
  };

  return (
    <AssistantContext.Provider
      value={{
        messages: displayMessages,
        input,
        handleInputChange,
        handleSubmit: (e) => {
          setError('');
          setActiveSuggestion(null);
          handleSubmit(
            e,
            imageDataUrl
              ? {
                  experimental_attachments: [
                    {
                      url: imageDataUrl,
                      contentType: 'image/*',
                    },
                  ],
                }
              : undefined
          );
        },
        status,
        setInput,
        errorMessage,
        reset,
        loading,
        imageDataUrl,
        setImageDataUrl,
        applyVariant,
        previewVariant,
        resetPreviewVariant,
      }}
    >
      {children}
    </AssistantContext.Provider>
  );
};

type Chat = ReturnType<typeof useChat>;
type Variant = { variant: string; active: boolean };
type PlayroomAssistantMessage = {
  id: Message['id'];
  role: Message['role'];
  message: string;
  attachments: Message['experimental_attachments'];
  variants: Variant[];
};
export type AssistantContextValue = Pick<
  Chat,
  'input' | 'handleInputChange' | 'status' | 'setInput'
> & {
  messages: PlayroomAssistantMessage[];
  reset: () => void;
  errorMessage?: string;
  handleSubmit: Chat['handleSubmit'];
  loading: boolean;
  imageDataUrl: string | null;
  setImageDataUrl: Dispatch<SetStateAction<string | null>>;
  applyVariant: (variant: Variant['variant']) => void;
  previewVariant: (params: {
    variant: string;
    id: string;
    variantIndex: number;
  }) => void;
  resetPreviewVariant: () => void;
};

export const AssistantContext = createContext<AssistantContextValue | null>(
  null
);

export const useAssistant = () => {
  const context = useContext(AssistantContext);

  if (!context) {
    throw new Error('Must be used inside of a Assistant Context');
  }

  return context;
};
