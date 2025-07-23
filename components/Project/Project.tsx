"use client";

import styles from "./Project.module.css";
import { VideoPlayer } from "../VideoPlayer";
import Image from "next/image";
import React from "react";

type ProjectProps = {
  title: string;
  date: string;
  bullets: string[];
  techTags: string[];
  demo?: Demo;
};

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

const renderDemo = (demo: Demo) => {
  switch (demo.type) {
    case "video":
      return (
        <div className={styles.demoVid}>
          <VideoPlayer videoName={demo.src} />
        </div>
      );
    case "image":
      return (
        <div className={styles.demo}>
          <Image src={demo.src} alt={demo.alt} width={800} height={450} />
        </div>
      );
  }
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
        {date && <p className={styles.projectDate}>{date}</p>}
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
