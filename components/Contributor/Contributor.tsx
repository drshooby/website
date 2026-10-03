import styles from "./Contributor.module.css";
import { ContributorProps } from "@/types/contributor";

// A collaborator's name, linking to their own site when they have one and
// LinkedIn otherwise. Rendered inline on a project's "with:" line.
export function Contributor({ name, links }: ContributorProps) {
  const href = links.personal ?? links.linkedin;
  if (!href) return <span>{name}</span>;
  return (
    <a
      href={href}
      className={styles.link}
      target="_blank"
      rel="noopener noreferrer"
    >
      {name}
    </a>
  );
}
