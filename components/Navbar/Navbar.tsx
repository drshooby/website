"use client";

import React, { useState } from "react";

import styles from "./Navbar.module.css";

import About from "../About/About"
import Projects from "../Projects/Projects";
import Contact from "../Contact/Contact";
import Footer from "../Footer/Footer"

export default function Navbar() {
  const [activePage, setActivePage] = useState<"about" | "projects" | "contact">("about");

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <h1 className={styles.neonName}>David Shubov</h1>
        <nav className={styles.navbar}>
          <div className={styles.navLinksWrapper}>
            <ul className={styles.navLinks}>
              {["about", "projects", "contact"].map((page) => (
                <li key={page}>
                  <a
                    href="#"
                    className={activePage === page ? styles.activeLink : ""}
                    onClick={(e) => {
                      e.preventDefault();
                      setActivePage(page as "about" | "projects" | "contact");
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
        {activePage === "contact" && <Contact />}
      </main>
      <Footer />
    </div>
  );
}