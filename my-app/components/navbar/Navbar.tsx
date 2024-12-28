import Link from "next/link"
import styles from "./Navbar.module.css"

export default function Navbar() {
    return (
        <div className={styles.navContainer}>
            <ul className={styles.navList}>
                <li className={styles.navItem}>
                    <Link href={"#"}>LinkedIn</Link>
                </li>
                <li className={styles.navItem}>
                    <Link href={"#"}>Github</Link>
                </li>
            </ul>
        </div>
    )
}