"use client";

import styles from "./About.module.css";
import { aboutText } from "@/text/AboutText";
import { parseLinks } from "@/lib/parseLinks";

export function About() {
  return (
    <div className={styles.homeWrapper}>
      <div className={styles.textContent}>
        <h1 className={styles.title}>Hi, I&apos;m <span className={styles.name}>David</span></h1>
        <div className={styles.intro}>
          {aboutText.map((paragraph, idx) => (
            <p key={idx}>{parseLinks(paragraph)}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
