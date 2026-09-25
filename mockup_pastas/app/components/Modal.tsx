import { type ReactNode } from "react";

type ModalProps = {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
};

export default function Modal({
  title,
  subtitle,
  onClose,
  children,
  wide = false,
}: ModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="flex min-h-full items-start justify-center p-4 sm:p-6">
        <div
          className={`relative w-full ${
            wide ? "max-w-4xl" : "max-w-2xl"
          } rounded-xl bg-white shadow-xl`}
        >
          <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-6 py-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{title}</h2>
              {subtitle && (
                <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="inline-flex rounded-md p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
          <div className="px-6 py-5">{children}</div>
        </div>
      </div>
    </div>
  );
}