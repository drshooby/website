"use client";

import React, { useState } from "react";
import ContentBox from "../ContentBox/ContentBox";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const [activePage, setActivePage] = useState<"home" | "about" | "contact">("home");

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <h1 className={styles.neonName}>Your Name</h1>
        <nav className={styles.navbar}>
          <div className={styles.navLinksWrapper}>
            <ul className={styles.navLinks}>
              {["home", "about", "contact"].map((page) => (
                <li key={page}>
                  <a
                    href="#"
                    className={activePage === page ? styles.activeLink : ""}
                    onClick={(e) => {
                      e.preventDefault();
                      setActivePage(page as "home" | "about" | "contact");
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

      <ContentBox>
        {activePage === "home" && <p>Welcome to the home page! tessssssssssssssssssssssssssssssssssssssssssssssst</p>}
        {activePage === "about" && <p>Learn more about us on the about page.</p>}
        {activePage === "contact" && <p>Get in touch with us on the contact page.</p>}
      </ContentBox>
    </div>
  );
}