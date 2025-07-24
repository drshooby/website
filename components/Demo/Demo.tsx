import styles from "./Demo.module.css";

import { VideoPlayer } from "@/components/VideoPlayer";
import Image from "next/image";

import { DemoProps } from "@/types/demo";

export function Demo(demo: DemoProps) {
  return (
    <div className={styles.demo}>
      {demo.type === "video" ? (
        <VideoPlayer videoName={demo.src} />
      ) : (
        <Image src={`/${demo.src}`} alt={demo.alt} fill />
      )}
    </div>
  );
}
