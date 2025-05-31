"use client";

import { FaGithub, FaLinkedin } from "react-icons/fa";
import { FaSquareXTwitter } from "react-icons/fa6";

import styles from "./Footer.module.css"

export default function Footer() {
  return (
    <footer className="footer">
      <div className={styles.footerContent}>
        <a href="https://github.com/drshooby" target="_blank" rel="noopener noreferrer">
            <FaGithub size={32} />
        </a>
        <a href="https://linkedin.com/in/david-shubov" target="_blank" rel="noopener noreferrer">
            <FaLinkedin size={32} />
        </a>
        <a href="https://x.com/in/david-shubov" target="_blank" rel="noopener noreferrer">
            <FaSquareXTwitter size={32} />
        </a>
      </div>
      <p className={styles.copyright}>
        &copy; {new Date().getFullYear()} David Shubov. All rights reserved.
      </p>
    </footer>
  );
}