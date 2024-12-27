import Link from "next/link"
import styles from "./Navbar.module.css"

export default function Navbar() {
    return (
        <div className={styles.navContainer}>
            <Link href={"#"}>LinkedIn</Link>
            <Link href={"#"}>Github</Link>
            <Link href={"#"}>Contact</Link>
        </div>
    )
}