"use client";

import styles from "./VideoPlayer.module.css";

import { useEffect, useRef } from "react";

export function VideoPlayer({ videoName }: { videoName: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleEnd = () => {
      video.classList.add(styles.fadeOut);
      setTimeout(() => {
        video.classList.remove(styles.fadeOut);
        video.currentTime = 0;
        video.play();
      }, 1000);
    };

    video.addEventListener("ended", handleEnd);
    return () => video.removeEventListener("ended", handleEnd);
  }, []);

  return (
    <div className={styles.mainVideoContainer}>
      <div className={styles.videoWrapper}>
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          preload="auto"
          className={styles.video}
        >
          <source src={"/" + videoName} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
    </div>
  );
}
