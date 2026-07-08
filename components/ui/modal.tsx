import Link from "next/link";
import { X } from "lucide-react";

export function Modal({
  title,
  description,
  closeHref,
  children
}: {
  title: string;
  description?: string;
  closeHref: string;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="presentation">
      <Link
        className="absolute inset-0 bg-neutral-900/40 backdrop-blur-[2px]"
        href={closeHref}
        aria-label="Close dialog"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="relative w-full max-w-lg rounded-card border border-line bg-surface shadow-pop"
      >
        <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 id="modal-title" className="text-base font-semibold text-neutral-900">
              {title}
            </h2>
            {description ? <p className="mt-0.5 text-13 text-neutral-500">{description}</p> : null}
          </div>
          <Link
            href={closeHref}
            aria-label="Close dialog"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-neutral-700 transition-colors hover:bg-subtle"
          >
            <X size={15} aria-hidden="true" />
          </Link>
        </header>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
      </section>
    </div>
  );
}
