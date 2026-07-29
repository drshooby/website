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
  demo,
  github,
  writeup,
  contributors,
  inProgress,
}: ProjectProps) {
  // Metadata line: status, date, and links to the project's other homes.
  // Built as a list so the separators fall between whatever is actually
  // present — most projects have a repo, only some have a writeup.
  const meta = [
    inProgress && <InProgress key="status" />,
    date,
    github && (
      <a
        key="github"
        href={github}
        className={styles.metaLink}
        target="_blank"
        rel="noopener noreferrer"
      >
        GitHub
      </a>
    ),
    writeup && (
      <Link
        key="writeup"
        href={`/projects/${writeup}`}
        className={styles.metaLink}
      >
        Writeup
      </Link>
    ),
  ].filter(Boolean);

  return (
    <article className={styles.project}>
      <h3 className={styles.projectTitle}>{title}</h3>
      <p className={styles.projectDate}>
        {meta.map((item, idx) => (
          <span key={idx}>
            {idx > 0 && (
              <span className={styles.dateSeparator} aria-hidden="true">
                ·
              </span>
            )}
            {item}
          </span>
        ))}
      </p>
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
