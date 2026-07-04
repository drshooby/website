"use client";

import styles from "./ThemeToggle.module.css";

export function ThemeToggle() {
  const toggle = () => {
    const root = document.documentElement;
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    const apply = () => {
      root.dataset.theme = next;
      localStorage.setItem("theme", next);
    };
    if (document.startViewTransition) {
      document.startViewTransition(apply);
    } else {
      apply();
    }
  };

  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={toggle}
      aria-label="Toggle dark mode"
    >
      <span className={styles.lightsOff}>View in dark mode</span>
      <span className={styles.lightsOn}>View in light mode</span>
    </button>
  );
}
