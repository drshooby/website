import styles from "./Work.module.css";

import { Job } from "../Job";
import { jobs } from "./JobList";

export function Work() {
  return (
    <div className={styles.container}>
      <div className={styles.jobContainer}>
        <h1 className={styles.title}>Work Experience</h1>
        {jobs.map((project, index) => (
          <Job
            key={index}
            info={project.info}
            title={project.title}
            date={project.date}
            bullets={project.description}
            style={{ animationDelay: `${index * 0.1}s` }}
          />
        ))}
      </div>
    </div>
  );
}
