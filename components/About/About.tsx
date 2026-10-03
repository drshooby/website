"use client";

import styles from "./About.module.css";
import { aboutText, name, role } from "@/text/AboutText";
import Markdown from "react-markdown";
import Link from "next/link";

export function About() {
  return (
    <div className={styles.homeWrapper}>
      <div className={styles.textContent}>
        <header className={styles.header}>
          <h1 className={styles.title}>
            {name.first} <span className={styles.lastName}>{name.last}</span>
          </h1>
          <p className={styles.role}>{role}</p>
        </header>
        <div className={styles.intro}>
          {aboutText.map((paragraph, idx) => (
            <Markdown
              key={idx}
              components={{
                p: ({ children }) => <p>{children}</p>,
                a: ({ href, children }) =>
                  href?.startsWith("#") ? (
                    <a href={href}>{children}</a>
                  ) : href?.startsWith("/") ? (
                    <Link href={href}>{children}</Link>
                  ) : (
                    <a href={href} target="_blank" rel="noopener noreferrer">
                      {children}
                    </a>
                  ),
              }}
            >
              {paragraph}
            </Markdown>
          ))}
        </div>
      </div>
    </div>
  );
}
