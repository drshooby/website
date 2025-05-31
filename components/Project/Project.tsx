"use client";

import React from "react";
import styles from "./Project.module.css";

type ProjectProps = {
  title: string;
  date: string;
  bullets: string[];
  techTags: string[];
};

export default function Project({ title, date, bullets, techTags, style }: ProjectProps & { style?: React.CSSProperties }) {
  return (
    <div className={styles.project} style={style}>
      <h2 className={styles.projectTitle}>{title}</h2>
      {date && <p className={styles.projectDate}>{date}</p>}
      <ul className={styles.projectDescription}>
        {bullets.map((bullet, idx) => (
          <li key={idx}>{bullet}</li>
        ))}
      </ul>
      <div className={styles.techTags}>
        {techTags.map((tag, idx) => (
          <span key={idx} className={styles.techTag}>
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
