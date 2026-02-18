import styles from "./Contributor.module.css";
import Link from "next/link";
import { ContributorProps, LinkType } from "@/types/contributor";

import { FaLinkedin, FaLink } from "react-icons/fa";

const iconMap: Record<LinkType, typeof FaLink> = {
  personal: FaLink,
  linkedin: FaLinkedin,
};

export function Contributor({ name, links }: ContributorProps) {
  const entries = Object.entries(links) as [LinkType, string][];
  return (
    <div className={styles.mainContainer}>
      {entries.map(([type, href]) => {
        const Icon = iconMap[type];
        return (
          <Link key={type} href={href} className={styles.link} prefetch target="_blank">
            <div className={styles.linkContainer}>
              <span className={styles.name}>{name}</span>
              <Icon size={16} className={styles.svg} />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
