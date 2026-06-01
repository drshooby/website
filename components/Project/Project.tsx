"use client";

import styles from "./Project.module.css";
import { Contributor } from "@/components/Contributor";
import { Demo } from "@/components/Demo";
import { ProjectProps } from "@/types/project";
import { InProgress } from "../InProgress";
import Markdown from "react-markdown";
import { Link } from "next-view-transitions";

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
