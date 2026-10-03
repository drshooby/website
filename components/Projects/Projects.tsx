"use client";

import { useRef, useState } from "react";
import { Project } from "../Project";
import styles from "./Projects.module.css";

import { projects } from "@/text/ProjectList";

export function Projects() {
  // Game-menu cursor: a ▸ that springs to whichever entry is hovered and
  // stays on it until another is hovered or the pointer leaves the list.
  const [active, setActive] = useState<number | null>(null);
  const [cursorY, setCursorY] = useState(0);
  const cursorRef = useRef<HTMLSpanElement>(null);

  function activate(index: number, article: HTMLElement) {
    const title = article.querySelector("h3");
    if (!title) return;
    // offsetTop is layout position, so the title's hover nudge (a transform)
    // can't skew where the cursor lands.
    const cursorHeight = cursorRef.current?.offsetHeight ?? 0;
    setCursorY(
      article.offsetTop +
        title.offsetTop +
        title.offsetHeight / 2 -
        cursorHeight / 2,
    );
    setActive(index);
  }

  return (
    <section id="projects" className={styles.container}>
      <h2 className={styles.heading}>Projects</h2>
      <div
        className={styles.projectContainer}
        onMouseLeave={() => setActive(null)}
      >
        <span
          ref={cursorRef}
          className={`${styles.cursor} ${active !== null ? styles.cursorOn : ""}`}
          style={{ transform: `translateY(${cursorY}px)` }}
          aria-hidden="true"
        >
          <span className={styles.bob}>▸</span>
        </span>
        {projects.map((project, index) => (
          <Project
            key={index}
            title={project.title}
            date={project.date}
            description={project.description}
            techTags={project.techTags}
            demo={project.demo}
            github={project.github}
            writeup={project.writeup}
            contributors={project.awesomePeople}
            inProgress={project.inProgress}
            active={active === index}
            onActivate={(article) => activate(index, article)}
          />
        ))}
      </div>
    </section>
  );
}
