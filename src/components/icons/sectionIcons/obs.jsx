import { SvgIcon } from "@mui/material";

export default function Obs(props) {
  return (
    <SvgIcon
      {...props}
      sx={{
        color: "white",
        display: "block", // 👈 removes inline baseline offset
        margin: "auto", // 👈 centers inside parent
        ...props.sx,
      }}
      viewBox="0 0 72 72"
    >
      <g id="Obs">
        <rect
          x="32.5"
          y="14"
          width="28"
          height="44"
          stroke="black"
          strokeWidth="4"
        />
        <path
          d="M53 20V34H39V20H53ZM53 18H39C37.9 18 37 18.9 37 20V34C37 35.1 37.9 36 39 36H53C54.1 36 55 35.1 55 34V20C55 18.9 54.1 18 53 18ZM48.14 26.86L45.14 30.73L43 28.14L40 32H52L48.14 26.86Z"
          fill="black"
        />
        <line x1="36" y1="42" x2="57" y2="42" stroke="black" strokeWidth="4" />
        <line x1="36" y1="49" x2="49" y2="49" stroke="black" strokeWidth="4" />
      </g>
      <defs>
        <clipPath id="clip0_1567_23057">
          <rect x="30.5" y="12" width="32" height="48" rx="2" fill="white" />
        </clipPath>
      </defs>
    </SvgIcon>
  );
}
