"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./Project.module.css";
import { Contributor } from "@/components/Contributor";
import { Demo } from "@/components/Demo";
import { ProjectProps } from "@/types/project";
import { InProgress } from "../InProgress";
import Markdown from "react-markdown";
import Link from "next/link";

type ProjectEntryProps = ProjectProps & {
  // Driven by Projects, which owns the game-menu cursor.
  active?: boolean;
  onActivate?: (article: HTMLElement) => void;
};

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
  active = false,
  onActivate,
}: ProjectEntryProps) {
  // When this entry stops being the active one, play the one-shot settle
  // bounce on its title; the animation clears itself when it ends.
  const [settling, setSettling] = useState(false);
  const wasActive = useRef(active);
  useEffect(() => {
    if (wasActive.current && !active) setSettling(true);
    if (active) setSettling(false);
    wasActive.current = active;
  }, [active]);


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
    <article
      className={[
        styles.project,
        active && styles.active,
        settling && styles.settling,
      ]
        .filter(Boolean)
        .join(" ")}
      onMouseEnter={(e) => onActivate?.(e.currentTarget)}
    >
      <h3
        className={styles.projectTitle}
        onAnimationEnd={() => setSettling(false)}
      >
        {title}
      </h3>
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
      <p className={styles.techList}>{techTags.join(", ")}</p>
      {contributors && contributors.length > 0 && (
        <p className={styles.withList}>
          {contributors.map((c, idx) => (
            <span key={idx}>
              {idx > 0 && ", "}
              <Contributor {...c} />
            </span>
          ))}
        </p>
      )}
      {demo && <Demo {...demo} />}
    </article>
  );
}
