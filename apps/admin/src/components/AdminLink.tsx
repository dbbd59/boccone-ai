import type { AnchorHTMLAttributes, ReactNode } from "react";

import { useAdminRouter } from "../lib/navigation-context";

export function AdminLink({
  to,
  children,
  onNavigate,
  ...props
}: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  to: string;
  children: ReactNode;
  onNavigate?: () => void;
}) {
  const { navigate } = useAdminRouter();

  return (
    <a
      {...props}
      href={to}
      onClick={(event) => {
        props.onClick?.(event);
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return;
        }
        event.preventDefault();
        onNavigate?.();
        navigate(to);
      }}
    >
      {children}
    </a>
  );
}
