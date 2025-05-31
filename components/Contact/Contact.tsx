"use client";

import styles from "./Contact.module.css";
import { ContactButton } from "../ContactButton/ContactButton";

import { contacts } from "./ContactList"

export default function Contact() {
  return (
    <div className={styles.contactWrapper}>
      <h1 className={styles.heading}>Let’s Connect</h1>
      <p className={styles.description}>
        If you wanna chat or collaborate, here’s how to reach me!
      </p>
      <div className={styles.links}>
        {contacts.map(({ label, href, external }) => (
          <ContactButton key={label} href={href} external={external}>
            {label}
          </ContactButton>
        ))}
      </div>
    </div>
  );
}
