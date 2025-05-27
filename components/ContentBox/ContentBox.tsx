import styles from './ContentBox.module.css';

export default function ContentBox({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.contentBox}>{ children }</div>
  );
}