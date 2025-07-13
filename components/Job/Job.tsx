"use client";

import styles from "./Job.module.css";

type JobProps = {
  info: string;
  title: string;
  date: string;
  bullets: string[];
};

export function Job({
  info,
  title,
  date,
  bullets,
  style,
}: JobProps & { style?: React.CSSProperties }) {
  return (
    <div className={styles.job} style={style}>
      <h2 className={styles.jobInfo}>{info}</h2>
      <h3 className={styles.jobTitle}>{title}</h3>
      {date && <p className={styles.jobDate}>{date}</p>}
      <ul className={styles.jobDescription}>
        {bullets.map((bullet, idx) => (
          <li key={idx}>{bullet}</li>
        ))}
      </ul>
    </div>
  );
}
