const sizes = {
  sm: "h-8 w-8 text-2xs",
  md: "h-10 w-10 text-13"
} as const;

export function Avatar({ name, size = "md" }: { name: string; size?: keyof typeof sizes }) {
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 select-none items-center justify-center rounded-full border border-line bg-subtle font-semibold text-neutral-700 ${sizes[size]}`}
    >
      {initials(name)}
    </span>
  );
}

function initials(name: string) {
  const parts = name
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return "ST";
  }

  return `${parts[0][0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
}
