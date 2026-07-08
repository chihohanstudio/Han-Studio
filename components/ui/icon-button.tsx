import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type IconButtonVariant = "default" | "primary" | "danger";

const base =
  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:border-line disabled:bg-subtle disabled:text-neutral-300";

const variants: Record<IconButtonVariant, string> = {
  default: "border-line bg-surface text-neutral-700 hover:bg-subtle hover:text-neutral-900",
  primary: "border-ink bg-ink text-white hover:bg-ink-black hover:text-white",
  danger: "border-red-200 bg-surface text-red-700 hover:bg-red-50"
};

export function iconButtonClasses(variant: IconButtonVariant = "default") {
  return `${base} ${variants[variant]}`;
}

export function IconButton({
  variant = "default",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: IconButtonVariant }) {
  return <button className={`${iconButtonClasses(variant)} ${className}`} {...props} />;
}

export function IconButtonLink({
  href,
  variant = "default",
  className = "",
  "aria-label": ariaLabel,
  title,
  children
}: {
  href: string;
  variant?: IconButtonVariant;
  className?: string;
  "aria-label"?: string;
  title?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      title={title}
      className={`${iconButtonClasses(variant)} ${className}`}
    >
      {children}
    </Link>
  );
}
