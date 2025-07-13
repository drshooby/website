import { Project } from "../Project";
import styles from "./Projects.module.css";

import { projects } from "./ProjectList";

export function Projects() {
  return (
    <div className={styles.container}>
      <div className={styles.projectContainer}>
        <h1 className={styles.title}>Projects</h1>
        {projects.map((project, index) => (
          <Project
            key={index}
            title={project.title}
            date={project.date}
            bullets={project.description}
            techTags={project.techTags}
            style={{ animationDelay: `${index * 0.1}s` }}
          />
        ))}
      </div>
    </div>
  );
}
