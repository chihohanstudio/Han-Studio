const sizes = {
  sm: "h-9 w-9 text-lg",
  lg: "h-12 w-12 text-2xl"
} as const;

export function LogoMark({ size = "sm" }: { size?: keyof typeof sizes }) {
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-field border border-ink bg-surface font-serif italic leading-none text-ink ${sizes[size]}`}
    >
      H
    </span>
  );
}
