"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Header.module.css";

export function Header() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  return (
    <header className={styles.header}>
      <div className={styles.breadcrumb}>
        {segments.length > 0 ? (
          <Link href="/" className={styles.nameLink}>
            David Shubov
          </Link>
        ) : (
          <span className={styles.nameCurrent}>David Shubov</span>
        )}
        <div className={styles.segments}>
          {segments.map((segment, i) => {
            const isLast = i === segments.length - 1;
            const href = "/" + segments.slice(0, i + 1).join("/");

            return isLast ? (
              <span key={href} className={styles.segmentCurrent}>
                <span className={styles.slash}>/</span>
                <span className={styles.typeIn}>{segment}</span>
              </span>
            ) : (
              <Link key={href} href={href} className={styles.segmentLink}>
                <span className={styles.slash}>/</span>
                <span>{segment}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
