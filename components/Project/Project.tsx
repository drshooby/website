"use client";

import styles from "./Project.module.css";
import { Contributor } from "@/components/Contributor";
import { Demo } from "@/components/Demo";
import { ProjectProps } from "@/types/project";
import { InProgress } from "../InProgress";
import { parseLinks } from "@/lib/parseLinks";

export function Project({
  title,
  date,
  description,
  techTags,
  style,
  demo,
  contributors,
  inProgress,
}: ProjectProps & { style?: React.CSSProperties }) {
  return (
    <div className={styles.project} style={style}>
      {demo && <Demo {...demo} />}
      <div className={styles.projectInfoContainer}>
        <h2 className={styles.projectTitle}>{title}</h2>
        {inProgress ? (
          <div className={styles.inProgresContainer}>
            <InProgress />
          </div>
        ) : (
          <p className={styles.projectDate}>{date}</p>
        )}
        <div className={styles.projectDescription}>
          {description.map((paragraph, idx) => (
            <p key={idx}>{parseLinks(paragraph)}</p>
          ))}
        </div>
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
