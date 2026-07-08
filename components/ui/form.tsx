import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes
} from "react";

const control =
  "w-full rounded-field border border-line bg-surface px-3 text-sm text-neutral-900 placeholder:text-neutral-300 transition-colors focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10 disabled:cursor-not-allowed disabled:bg-subtle disabled:text-neutral-500";

export function Field({
  label,
  htmlFor,
  helper,
  error,
  children
}: {
  label: string;
  htmlFor?: string;
  helper?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className={`text-xs font-medium ${error ? "text-red-700" : "text-neutral-900"}`}>
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-2xs text-red-700">{error}</p>
      ) : helper ? (
        <p className="text-2xs text-neutral-500">{helper}</p>
      ) : null}
    </div>
  );
}

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`h-9 ${control} ${className}`} {...props} />;
}

export function Select({
  className = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={`h-9 appearance-none ${control} ${className}`} {...props}>
      {children}
    </select>
  );
}

export function Textarea({
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`min-h-20 py-2 ${control} ${className}`} {...props} />;
}
