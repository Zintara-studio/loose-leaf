// A loose leaf of paper with a strip of tape across the corner - the same
// signature device the cards and the hero use, drawn small.
export default function Logo({ size = 34 }) {
  return (
    <svg
      className="logo"
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <g transform="rotate(-7 16 16)">
        <rect x="8.2" y="5.4" width="15.6" height="21.4" rx="1.6"
          fill="#fffdf7" stroke="currentColor" strokeWidth="1.7" />
        <path d="M11.6 13.2h8.8M11.6 17h8.8M11.6 20.8h5.6"
          stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" opacity=".38" />
      </g>
      <g transform="rotate(-38 10.4 7.2)">
        <rect x="4.6" y="4.6" width="11.6" height="5.2" rx=".5"
          fill="var(--rose, #f6ccd2)" stroke="currentColor" strokeWidth="1.3" />
      </g>
    </svg>
  );
}
