import styles from "./InProgress.module.css";

export function InProgress() {
  return (
    <div className={styles.mainContainer}>
      <div className={styles.textContainer}>
        <span className={styles.progressText}>In Progress</span>
      </div>
    </div>
  );
}
