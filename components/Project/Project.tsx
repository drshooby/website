"use client";

import styles from "./Project.module.css";
import { Contributor } from "@/components/Contributor";
import { Demo } from "@/components/Demo";
import { ProjectProps } from "@/types/project";

export function Project({
  title,
  date,
  bullets,
  techTags,
  style,
  demo,
  contributors,
}: ProjectProps & { style?: React.CSSProperties }) {
  return (
    <div className={styles.project} style={style}>
      {demo && <Demo {...demo} />}
      <div className={styles.projectInfoContainer}>
        <h2 className={styles.projectTitle}>{title}</h2>
        <p className={styles.projectDate}>{date}</p>
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
        {contributors && contributors.length > 0 && (
          <div className={styles.contributors}>
            {contributors.map((c, idx) => (
              <Contributor {...c} key={idx} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
