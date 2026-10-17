// The identity block: name, role, links. Server-rendered so it shows before
// any JS or WebGL. Its resting (settled) place is the top-left corner over
// the sky; Task 8's entrance animates it via html[data-phase]
// (title | descent | settled), with no data-phase meaning settled.

import styles from "./Identity.module.css";
import { identity, name } from "@/text/AboutText";

export function Identity() {
  return (
    <header className={styles.identity}>
      <h1 className={styles.name}>
        {name.first} {name.last}
      </h1>
      <p className={styles.role}>{identity.role}</p>
      <p className={styles.links}>
        {identity.links.map((l) => (
          <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer">
            {l.label}
          </a>
        ))}
      </p>
    </header>
  );
}
