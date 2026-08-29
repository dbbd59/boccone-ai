import emblemUrl from "../assets/boccone-ai-emblem.png";

export function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <img
      src={emblemUrl}
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      className="admin-brand-mark"
    />
  );
}
