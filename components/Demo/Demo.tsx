import styles from "./Demo.module.css";

import { VideoPlayer } from "@/components/VideoPlayer";
import Image from "next/image";

import { DemoProps } from "@/types/demo";

export function Demo({ src, alt }: DemoProps) {
  return (
    <div className={styles.demo}>
      {alt ? (
        <Image src={`/${src}`} alt={alt} fill />
      ) : (
        <VideoPlayer videoName={src} />
      )}
    </div>
  );
}
