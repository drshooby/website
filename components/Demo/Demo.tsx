import styles from "./Demo.module.css";

import { VideoPlayer } from "@/components/VideoPlayer";
import Image from "next/image";
import Link from "next/link";
import { CiLocationArrow1 } from "react-icons/ci";

import { DemoProps } from "@/types/demo";

export function Demo({ src, alt, github }: DemoProps) {
  return (
    <div className={styles.demo}>
      {github && (
        <div className={styles.linkOverlay}>
          <Link
            href={github}
            className={styles.linkPill}
            target="_blank"
          >
            <p>Source</p>
            <CiLocationArrow1 size={16} />
          </Link>
        </div>
      )}
      {alt ? (
        <Image src={`/${src}`} alt={alt as string} fill />
      ) : (
        <VideoPlayer videoName={src} />
      )}
    </div>
  );
}
