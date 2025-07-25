"use client";

import styles from "./About.module.css";
import { pageText } from "@/text/AboutText";

export function About() {
  return (
    <div className={styles.homeWrapper}>
      <div className={styles.textContent}>
        <h1 className={styles.title}>Welcome</h1>
        <p className={styles.intro}>{pageText}</p>
      </div>
    </div>
  );
}
