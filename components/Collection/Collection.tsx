// The Collection: every plaque, about first, hung one after another. Server
// rendered so search engines and screen readers always get the full content;
// in play mode the page-level copy is hidden and it is shown in the Overlay.

import styles from "./Collection.module.css";
import { Plaque } from "@/components/Plaque";
import { collection } from "@/text/collection";

export function Collection({ id = "collection" }: { id?: string }) {
  const headingId = `${id}-heading`;
  return (
    // Always a cream sheet ([data-sheet]): on the page (phones, fallback) it
    // is one continuous catalogue page under the painting, and inside the
    // desktop Overlay it simply sits on that overlay's sheet.
    <section
      id={id}
      className={styles.collection}
      aria-labelledby={headingId}
      data-sheet
    >
      <h2 id={headingId} className={styles.heading}>
        The Collection
      </h2>
      <div className={styles.works}>
        {collection.map((entry) => (
          <Plaque key={entry.id} entry={entry} headingLevel={3} />
        ))}
      </div>
    </section>
  );
}
