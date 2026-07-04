import { Project } from "../Project";
import styles from "./Projects.module.css";

import { projects } from "@/text/ProjectList";

export function Projects() {
  return (
    <section id="projects" className={styles.container}>
      <h2 className={styles.heading}>Projects</h2>
      <div className={styles.projectContainer}>
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
          />
        ))}
      </div>
    </section>
  );
}
