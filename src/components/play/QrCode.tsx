import { encode } from 'uqr';

/** The modules of a QR code as one path, on a quiet zone of four modules. */
export function QrCode({ value }: { value: string }) {
  const { data, size } = encode(value, { ecc: 'M', border: 4 });
  const modules = data.flatMap((row, y) => row.flatMap((dark, x) => (dark ? [`M${x} ${y}h1v1h-1z`] : [])));
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-48 h-48 rounded-control" role="img" aria-label="QR code of the link" shapeRendering="crispEdges">
      <rect width={size} height={size} fill="var(--surface)" />
      <path d={modules.join('')} fill="var(--foreground)" />
    </svg>
  );
}
