interface Props {
  size?: number | string;
}

export default ({ size = 24 }: Props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    width={size}
    height={size}
  >
    <path d="M18,11H13V6a1,1,0,0,0-2,0v5H6a1,1,0,0,0,0,2h5v5a1,1,0,0,0,2,0V13h5a1,1,0,0,0,0-2Z" />
  </svg>
);
