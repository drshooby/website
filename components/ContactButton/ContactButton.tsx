import React from "react";
import styles from "./ContactButton.module.css";

interface ContactButtonProps {
  href: string;
  children: React.ReactNode;
  external?: boolean;
  style?: React.CSSProperties;
}

export function ContactButton({ href, children, external = false, style }: ContactButtonProps) {
  return (
    <a
      href={href}
      className={styles.contactBtn}
      style={style}
      {...(external
        ? { target: "_blank", rel: "noopener noreferrer" }
        : {})}
    >
      {children}
    </a>
  );
}
