"use client";

import { useState } from "react";

import styles from "./Navbar.module.css";

import { About } from "@/components/About";
import { Projects } from "@/components/Projects";
import { Contact } from "@/components/Contact/Contact";
import { Footer } from "@/components/Footer";

const PAGES = {
  about: { label: "About", component: About },
  projects: { label: "Projects", component: Projects },
  contact: { label: "Contact", component: Contact },
} as const;

type PageOption = keyof typeof PAGES;

export function Navbar() {
  const [activePage, setActivePage] = useState<PageOption>("about");

  const ActiveComponent = PAGES[activePage].component;

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <h1 className={styles.name}>David Shubov</h1>
        <nav className={styles.navbar}>
          <div className={styles.navLinksWrapper}>
            <ul className={styles.navLinks}>
              {Object.entries(PAGES).map(([key, { label }]) => (
                <li key={key}>
                  <a
                    href="#"
                    className={activePage === key ? styles.activeLink : ""}
                    onClick={(e) => {
                      e.preventDefault();
                      setActivePage(key as PageOption);
                    }}
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </header>

      <main className={styles.mainContent}>
        <ActiveComponent />
      </main>
      <Footer />
    </div>
  );
}
