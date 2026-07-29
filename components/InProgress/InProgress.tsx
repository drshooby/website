import styles from "./InProgress.module.css";

const LABEL = "Building";

export function InProgress() {
  return (
    <span className={styles.progressText} aria-label={LABEL}>
      {LABEL.split("").map((char, idx) => (
        <span
          key={idx}
          className={styles.char}
          /* Stagger each glyph so the accent travels through the word
             letter by letter rather than lighting it all at once.
             The stagger has to stay wide relative to the keyframes' lit
             window: too tight and every glyph is lit at once, which reads
             as the whole word pulsing instead of a wave crossing it.
             Tuned against this label's length — a shorter word needs a
             wider stagger to cross at the same pace. */
          style={{ animationDelay: `${idx * 0.34}s` }}
          aria-hidden="true"
        >
          {char === " " ? " " : char}
        </span>
      ))}
    </span>
  );
}
