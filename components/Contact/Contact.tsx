"use client";

import styles from "./Contact.module.css";
import { ContactButton } from "@/components/ContactButton";

import { contacts } from "@/text/ContactList";

export function Contact() {
  return (
    <div className={styles.pageWrapper}>
      <div className={styles.contactWrapper}>
        <h1 className={styles.heading}>Let’s Connect</h1>
        <p className={styles.description}>
          If you wanna chat or collaborate, here’s how to reach me!
        </p>
        <div className={styles.links}>
          {contacts.map(({ label, href, external }, index) => (
            <ContactButton
              key={label}
              href={href}
              external={external}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {label}
            </ContactButton>
          ))}
        </div>
      </div>
    </div>
  );
}
