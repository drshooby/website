"use client";

import { useState } from "react";

import styles from "./Navbar.module.css";

import { About } from "@/components/About";
import { Projects } from "@/components/Projects";
import { Contact } from "@/components/Contact/Contact";
import { Footer } from "@/components/Footer";
import { Work } from "@/components/Work";

export function Navbar() {
  const [activePage, setActivePage] = useState<
    "about" | "projects" | "work" | "contact"
  >("about");

  const pageTypes = ["about", "projects", "work", "contact"];

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <h1 className={styles.name}>David Shubov</h1>
        <nav className={styles.navbar}>
          <div className={styles.navLinksWrapper}>
            <ul className={styles.navLinks}>
              {pageTypes.map((page) => (
                <li key={page}>
                  <a
                    href="#"
                    className={activePage === page ? styles.activeLink : ""}
                    onClick={(e) => {
                      e.preventDefault();
                      setActivePage(
                        page as "about" | "projects" | "work" | "contact"
                      );
                    }}
                  >
                    {page.charAt(0).toUpperCase() + page.slice(1)}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </header>

      <main className={styles.mainContent}>
        {activePage === "about" && <About />}
        {activePage === "projects" && <Projects />}
        {activePage === "work" && <Work />}
        {activePage === "contact" && <Contact />}
      </main>
      <Footer />
    </div>
  );
}
