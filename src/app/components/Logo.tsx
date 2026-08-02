export function Logo({ size = 32 }: { size?: number }) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}logo.jpeg`}
      alt="Logo"
      width={size}
      height={size}
      className="shrink-0 object-contain rounded-md"
    />
  )
}
