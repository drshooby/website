"use client";

import styles from "./VideoPlayer.module.css";

import { useEffect, useRef, useState } from "react";
import { CiPause1, CiPlay1 } from "react-icons/ci";

export function VideoPlayer({ videoName }: { videoName: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isVideoPlaying, setVideoPlaying] = useState(false);
  const [showPausedOverlay, setShowPausedOverlay] = useState(false);
  const [overlayClass, setOverlayClass] = useState("");

  // video play handler
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleEnd = () => {
      video.classList.add(styles.fadeOutVid);
      setTimeout(() => {
        video.classList.remove(styles.fadeOutVid);
        video.currentTime = 0;
        video.play();
      }, 1000);
    };

    video.addEventListener("ended", handleEnd);
    return () => video.removeEventListener("ended", handleEnd);
  }, []);

  // pause/play overlay handler
  useEffect(() => {
    if (!isVideoPlaying) {
      setShowPausedOverlay(true);
      setOverlayClass(styles.fadeIn);
    } else {
      setOverlayClass(styles.fadeOut);
      setTimeout(() => setShowPausedOverlay(false), 300);
    }
  }, [isVideoPlaying]);

  // pause/play handler
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = videoRef.current;
          if (!video) return;
          if (entry.isIntersecting) {
            if (video.paused) {
              video.play();
              setVideoPlaying(true);
            }
          } else {
            if (!video.paused) {
              video.pause();
              setVideoPlaying(false);
            }
          }
        });
      },
      {
        threshold: 0.6,
      }
    );

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => {
      if (videoRef.current) {
        observer.unobserve(videoRef.current);
      }
      observer.disconnect();
    };
  }, []);

  return (
    <div className={styles.mainVideoContainer}>
      <div className={styles.videoWrapper}>
        <video
          ref={videoRef}
          muted
          playsInline
          preload="auto"
          className={styles.video}
        >
          <source src={"/" + videoName} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        {showPausedOverlay && (
          <div className={`${styles.pausedOverlay} ${overlayClass}`}>
            {isVideoPlaying ? (
              <CiPlay1 size={64} className={styles.play} />
            ) : (
              <CiPause1 size={64} className={styles.pause} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
