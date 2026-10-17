import { BackButton } from "@/components/BackButton";
import styles from "./Writeup.module.css";

interface WriteupProps {
  title: string;
  date: string;
  children: React.ReactNode;
}

// A long-form writeup, set like a museum catalogue entry: the plaque's cream
// card stock and ink, serif prose, mono labels.
//
// The site's document is the dark piazza (globals.css: dark color-scheme,
// --sky-top background). DOCUMENT_LIGHT turns the whole document light while
// a writeup is on the page (:root, to match globals.css's specificity; this
// later <style> wins the tie), so scrollbars, overscroll and native controls
// match the cream page; it unmounts with the writeup on client navigation.
const DOCUMENT_LIGHT = ":root,body{background-color:var(--plaque);color:var(--ink);color-scheme:light}";
export function Writeup({ title, date, children }: WriteupProps) {
  return (
    <div className={styles.page}>
      <style>{DOCUMENT_LIGHT}</style>
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
