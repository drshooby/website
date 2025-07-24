"use client";

import styles from "./Project.module.css";
import { VideoPlayer } from "@/components/VideoPlayer";
import Image from "next/image";

type Demo =
  | {
      type: "video";
      src: string;
    }
  | {
      type: "image";
      src: string;
      alt: string;
    };

type ProjectProps = {
  title: string;
  date: string;
  bullets: string[];
  techTags: string[];
  demo?: Demo;
};

const renderDemo = (demo: Demo) => {
  return (
    <div className={styles.demo}>
      {demo.type === "video" ? (
        <VideoPlayer videoName={demo.src} />
      ) : (
        <Image src={`/${demo.src}`} alt={demo.alt} fill />
      )}
    </div>
  );
};

export function Project({
  title,
  date,
  bullets,
  techTags,
  style,
  demo = undefined,
}: ProjectProps & { style?: React.CSSProperties }) {
  return (
    <div className={styles.project} style={style}>
      {demo && renderDemo(demo)}
      <div className={styles.projectInfoContainer}>
        <h2 className={styles.projectTitle}>{title}</h2>
        <p className={styles.projectDate}>{date}</p>
        <ul className={styles.projectDescription}>
          {bullets.map((bullet, idx) => (
            <li key={idx}>{bullet}</li>
          ))}
        </ul>
        <div className={styles.techTags}>
          {techTags.map((tag, idx) => (
            <span key={idx} className={styles.techTag}>
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
