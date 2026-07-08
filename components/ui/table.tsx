import type { ReactNode, TdHTMLAttributes, ThHTMLAttributes } from "react";

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">{children}</table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return <thead>{children}</thead>;
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-line">{children}</tbody>;
}

export function TR({ children }: { children: ReactNode }) {
  return <tr className="group">{children}</tr>;
}

export function TH({
  className = "",
  children,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement> & { children?: ReactNode }) {
  return (
    <th
      className={`whitespace-nowrap border-b border-line px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-neutral-500 ${className}`}
      {...props}
    >
      {children}
    </th>
  );
}

export function TD({
  className = "",
  children,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement> & { children?: ReactNode }) {
  return (
    <td className={`px-4 py-3 align-middle text-neutral-700 ${className}`} {...props}>
      {children}
    </td>
  );
}
