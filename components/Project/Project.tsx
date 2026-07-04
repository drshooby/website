"use client";

import styles from "./Project.module.css";
import { Contributor } from "@/components/Contributor";
import { Demo } from "@/components/Demo";
import { ProjectProps } from "@/types/project";
import { InProgress } from "../InProgress";
import Markdown from "react-markdown";
import { Link } from "next-view-transitions";
import { FaGithub } from "react-icons/fa";

export function Project({
  title,
  date,
  description,
  techTags,
  demo,
  github,
  writeup,
  contributors,
  inProgress,
}: ProjectProps) {
  return (
    <article className={styles.project}>
      <h3 className={styles.projectTitle}>{title}</h3>
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
      <p className={styles.techList}>{techTags.join(" · ")}</p>
      {(github || writeup) && (
        <div className={styles.links}>
          {github && (
            <a
              href={github}
              className={styles.projectLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
              <FaGithub size={16} />
            </a>
          )}
          {writeup && (
            <Link href={`/projects/${writeup}`} className={styles.projectLink}>
              Writeup →
            </Link>
          )}
        </div>
      )}
      {contributors && contributors.length > 0 && (
        <div className={styles.contributors}>
          {contributors.map((c, idx) => (
            <Contributor {...c} key={idx} />
          ))}
        </div>
      )}
      {demo && <Demo {...demo} />}
    </article>
  );
}
