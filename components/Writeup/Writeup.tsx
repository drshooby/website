import { BackButton } from "@/components/BackButton";
import styles from "./Writeup.module.css";

interface WriteupProps {
  title: string;
  date: string;
  children: React.ReactNode;
}

export function Writeup({ title, date, children }: WriteupProps) {
  return (
    <article className={styles.writeup}>
      <header className={styles.header}>
        <h1 className={styles.title}>{title}</h1>
        <div className={styles.metaRow}>
          <p className={styles.date}>{date}</p>
        </div>
      </header>
      <div className={styles.content}>{children}</div>
      <BackButton text="home" />
    </article>
  );
}
