import type { ButtonHTMLAttributes, InputHTMLAttributes, PropsWithChildren } from "react";

export function Text({ as: Element = "p", ...props }: PropsWithChildren<{ as?: "p" | "span" | "h1" | "h2" | "label" }>) {
  return <Element {...props} />;
}

export function Button({ children, ...props }: PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>>) {
  return <button className="boccone-button" {...props}>{children}</button>;
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className="boccone-input" {...props} />;
}

export function Screen({ children }: PropsWithChildren) {
  return <main className="boccone-screen">{children}</main>;
}

export function Surface({ children }: PropsWithChildren) {
  return <section className="boccone-surface">{children}</section>;
}

export function Stack({ children }: PropsWithChildren) {
  return <div className="boccone-stack">{children}</div>;
}
