import { Project } from "../Project";
import styles from "./Projects.module.css";

import { projects } from "@/text/ProjectList";

import { DemoProps } from "@/types/demo";
import { ContributorProps } from "@/types/contributor";

export function Projects() {
  return (
    <div className={styles.container}>
      <div className={styles.projectContainer}>
        {projects.map((project, index) => (
          <Project
            key={index}
            title={project.title}
            date={project.date}
            description={project.description}
            techTags={project.techTags}
            style={{ animationDelay: `${index * 0.1}s` }}
            demo={project.demo as DemoProps}
            contributors={project.awesomePeople as ContributorProps[]}
            inProgress={project.inProgress}
          />
        ))}
      </div>
    </div>
  );
}
