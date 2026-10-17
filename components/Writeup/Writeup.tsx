import { BackButton } from "@/components/BackButton";
import styles from "./Writeup.module.css";

interface WriteupProps {
  title: string;
  date: string;
  children: React.ReactNode;
}

// A long-form writeup, set like a museum catalogue entry: the plaque's cream
// card stock and ink, serif prose, mono labels. The page wrapper also
// switches the document to the light plaque palette (see the CSS).
export function Writeup({ title, date, children }: WriteupProps) {
  return (
    <div className={styles.page}>
      <article className={styles.writeup}>
        <header className={styles.header}>
          <p className={styles.date}>{date}</p>
          <h1 className={styles.title}>{title}</h1>
        </header>
        <div className={styles.content}>{children}</div>
        <BackButton text="the piazza" />
      </article>
    </div>
  );
}
