import styles from "./Contributor.module.css";
import { FaLinkedin, FaHome } from "react-icons/fa";
import Link from "next/link";
import { ContributorProps } from "@/types/contributor";

const iconMap = {
  personal: FaHome,
  linkedin: FaLinkedin,
};

export function Contributor({ name, type, href }: ContributorProps) {
  const Icon = iconMap[type];
  return (
    <div className={styles.mainContainer}>
      <Link href={href} className={styles.link} prefetch target="_blank">
        <div className={styles.linkContainer}>
          <span className={styles.name}>{name}</span>
          <Icon size={16} className={styles.svg} />
        </div>
      </Link>
    </div>
  );
}
