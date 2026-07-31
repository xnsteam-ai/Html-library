export function Logo({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="shrink-0"
    >
      <path
        d="M18 1 L20.2 13.5 L29.7 6.3 L22.5 15.8 L35 18 L22.5 20.2 L29.7 29.7 L20.2 22.5 L18 35 L15.8 22.5 L6.3 29.7 L13.5 20.2 L1 18 L13.5 15.8 L6.3 6.3 L15.8 13.5 Z"
        fill="var(--brand)"
      />
    </svg>
  )
}
