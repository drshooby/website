"use client";

import styles from "./Footer.module.css"

export default function Footer() {
  return (
    <footer className="footer">
      <p className={styles.copyright}>
        &copy; {new Date().getFullYear()} David Shubov. All rights reserved.
      </p>
    </footer>
  );
}