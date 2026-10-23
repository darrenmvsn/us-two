/** A four-point sparkle, butter yellow with an ink outline. */
export function Sparkle({ x, y, size = 1 }: { x: number; y: number; size?: number }) {
  return (
    <path
      transform={`translate(${x} ${y}) scale(${size})`}
      d="M0-14C2-4 4-2 14 0 4 2 2 4 0 14-2 4-4 2-14 0-4-2-2-4 0-14z"
      fill="var(--tint-butter)"
      stroke="var(--foreground)"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  );
}
