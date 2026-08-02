export function Logo({ size = 32 }: { size?: number }) {
  return (
    <img
      src="/logo.jpeg"
      alt="Logo"
      width={size}
      height={size}
      className="shrink-0 object-contain rounded-md"
    />
  )
}
