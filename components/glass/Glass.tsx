import styles from "./Glass.module.css"

export default function Glass({ children }: { children: React.ReactNode }) {
    return (
        <div className={styles.glass}>
            {children}
        </div>
    )
}