import Link from "next/link"
import styles from "./Navbar.module.css"

export default function Navbar() {
    return (
        <div className={styles.navContainer}>
            <ul className={styles.navList}>
                <li className={styles.navItem}>
                    <Link href={"https://www.linkedin.com/in/david-shubov/"}>LinkedIn</Link>
                </li>
                <li className={styles.navItem}>
                    <Link href={"https://github.com/drshooby"}>GitHub</Link>
                </li>
                <li className={styles.navItem}>
                    <Link href={"https://x.com/drshooby_"}>X/Twitter</Link>
                </li>
            </ul>
        </div>
    )
}