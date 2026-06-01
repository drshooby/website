"use client";

import styles from "./About.module.css";
import { aboutText } from "@/text/AboutText";
import Markdown from "react-markdown";
import Link from "next/link";

export function About() {
  return (
    <div className={styles.homeWrapper}>
      <div className={styles.textContent}>
        <h1 className={styles.title}>Hi, I&apos;m <span className={styles.name}>David</span></h1>
        <div className={styles.intro}>
          {aboutText.map((paragraph, idx) => (
            <Markdown
              key={idx}
              components={{
                p: ({ children }) => <p>{children}</p>,
                a: ({ href, children }) =>
                  href?.startsWith("/") ? (
                    <Link href={href}>{children}</Link>
                  ) : (
                    <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
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
