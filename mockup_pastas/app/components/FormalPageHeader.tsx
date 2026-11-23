import type { ReactNode } from "react";

export default function FormalPageHeader({ children, className }: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <header className={className ? `formal-page-header ${className}` : "formal-page-header"}>
      {children}
    </header>
  );
}
