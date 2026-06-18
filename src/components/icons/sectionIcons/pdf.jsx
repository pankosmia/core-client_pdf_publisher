import { SvgIcon } from "@mui/material";

export default function Pdf(props) {
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
      <g clipPath="url(#clip0_4850_14413)">
        <rect
          x="32.5"
          y="14"
          width="28"
          height="44"
          stroke="black"
          strokeOpacity="0.87"
          strokeWidth="4"
        />
        <g clipPath="url(#clip1_4850_14413)">
          <path
            d="M54.5 30H46.5L44.5 28H38.5C37.4 28 36.51 28.9 36.51 30L36.5 42C36.5 43.1 37.4 44 38.5 44H54.5C55.6 44 56.5 43.1 56.5 42V32C56.5 30.9 55.6 30 54.5 30ZM54.5 42H38.5V30H43.67L45.67 32H54.5V42ZM43.91 38.42L45.5 36.84V41H47.5V36.84L49.09 38.43L50.5 37.01L46.51 33L42.5 37.01L43.91 38.42Z"
            fill="black"
            fillOpacity="0.87"
          />
        </g>
        <mask
          id="mask0_4850_14413"
          style={{ maskType: "alpha" }}
          maskUnits="userSpaceOnUse"
          x="41"
          y="19"
          width="12"
          height="8"
        >
          <rect x="41" y="19" width="12" height="8" fill="#D9D9D9" />
        </mask>
        <g mask="url(#mask0_4850_14413)">
          <path
            d="M42 25.5H43V23.5H44C44.2833 23.5 44.5208 23.4042 44.7125 23.2125C44.9042 23.0208 45 22.7833 45 22.5V21.5C45 21.2167 44.9042 20.9792 44.7125 20.7875C44.5208 20.5958 44.2833 20.5 44 20.5H42V25.5ZM43 22.5V21.5H44V22.5H43ZM46 25.5H48C48.2833 25.5 48.5208 25.4042 48.7125 25.2125C48.9042 25.0208 49 24.7833 49 24.5V21.5C49 21.2167 48.9042 20.9792 48.7125 20.7875C48.5208 20.5958 48.2833 20.5 48 20.5H46V25.5ZM47 24.5V21.5H48V24.5H47ZM50 25.5H51V23.5H52V22.5H51V21.5H52V20.5H50V25.5ZM41 31C40.45 31 39.9792 30.8042 39.5875 30.4125C39.1958 30.0208 39 29.55 39 29V17C39 16.45 39.1958 15.9792 39.5875 15.5875C39.9792 15.1958 40.45 15 41 15H53C53.55 15 54.0208 15.1958 54.4125 15.5875C54.8042 15.9792 55 16.45 55 17V29C55 29.55 54.8042 30.0208 54.4125 30.4125C54.0208 30.8042 53.55 31 53 31H41ZM41 29H53V17H41V29ZM37 35C36.45 35 35.9792 34.8042 35.5875 34.4125C35.1958 34.0208 35 33.55 35 33V19H37V33H51V35H37Z"
            fill="black"
            fillOpacity="0.87"
          />
        </g>
      </g>
      <defs>
        <clipPath id="clip0_4850_14413">
          <rect x="30.5" y="12" width="32" height="48" rx="2" fill="white" />
        </clipPath>
        <clipPath id="clip1_4850_14413">
          <rect
            width="24"
            height="24"
            fill="white"
            transform="translate(34.5 24)"
          />
        </clipPath>
      </defs>
    </SvgIcon>
  );
}
