"use client";

import styles from "./VideoPlayer.module.css";

import { useEffect, useRef, useState } from "react";
import { CiPause1, CiPlay1 } from "react-icons/ci";

export function VideoPlayer({ videoName }: { videoName: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isVideoPlaying, setVideoPlaying] = useState(false);
  const [isLoaded, setLoaded] = useState(false);
  const [showPausedOverlay, setShowPausedOverlay] = useState(false);
  const [overlayClass, setOverlayClass] = useState("");

  // fade the video in once its first frame is available
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // HAVE_CURRENT_DATA — already decoded (e.g. cached), skip the wait
    if (video.readyState >= 2) {
      setLoaded(true);
      return;
    }

    const handleLoaded = () => setLoaded(true);
    video.addEventListener("loadeddata", handleLoaded);
    return () => video.removeEventListener("loadeddata", handleLoaded);
  }, []);

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

  // A playing <video> is a composited layer, and Chrome mobile is unreliable
  // about rasterizing one into ::view-transition-old(root) — it can snapshot a
  // blank frame, which reads as a flicker rather than a fade. Pausing before
  // the snapshot is taken leaves a static frame to capture.
  // Client-side navigations never unload the document, so pagehide/unload are
  // no help — but every same-document transition starts by mutating the DOM,
  // and the link click always precedes it. Pausing on capture-phase click of
  // any internal link gets us in before the snapshot.
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement | null)?.closest?.("a");
      if (!link) return;

      const href = link.getAttribute("href");
      // Internal navigations only — external links open elsewhere and leave
      // this page (and its video) exactly as it was.
      if (!href?.startsWith("/")) return;

      videoRef.current?.pause();
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

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

    const video = videoRef.current;
    if (video) {
      observer.observe(video);
    }

    return () => {
      if (video) {
        observer.unobserve(video);
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
          className={`${styles.video} ${isLoaded ? styles.videoLoaded : ""}`}
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
