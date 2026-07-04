import { Link } from "next-view-transitions";
import styles from "./BackButton.module.css";

export function BackButton({ text }: { text: string }) {
  return (
    <Link className={styles.backLink} href="/">
      Back to {text}
    </Link>
  );
}
