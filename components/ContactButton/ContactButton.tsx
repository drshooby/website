import React from "react";
import styles from "./ContactButton.module.css";

interface ContactButtonProps {
  href: string;
  children: React.ReactNode;
  external?: boolean;
}

export function ContactButton({ href, children, external = false }: ContactButtonProps) {
  return (
    <a
      href={href}
      className={styles.contactBtn}
      {...(external
        ? { target: "_blank", rel: "noopener noreferrer" }
        : {})}
    >
      {children}
    </a>
  );
}
