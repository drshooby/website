"use client";

// A museum object: the work in a dark wooden frame with a thin gilt line,
// and a cream label beneath it. One component for every view: the plaque
// that opens in the piazza, the desktop Collection and the phone Collection.
// All copy comes from the collection entry (text/), never from here.

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Markdown from "react-markdown";
import styles from "./Plaque.module.css";
import { Contributor } from "@/components/Contributor";
import { VideoPlayer } from "@/components/VideoPlayer";
import type { CollectionEntry } from "@/text/collection";

type PlaqueProps = {
  entry: CollectionEntry;
  headingLevel?: 2 | 3;
  onClose?: () => void;
};

// Markdown paragraphs with the site's link handling: internal links route
// through next/link, external ones open in a new tab.
function Prose({ paragraphs }: { paragraphs: string[] }) {
  return (
    <div className={styles.prose}>
      {paragraphs.map((paragraph, idx) => (
        <Markdown
          key={idx}
          components={{
            p: ({ children }) => <p>{children}</p>,
            a: ({ href, children }) =>
              href?.startsWith("/") ? (
                <Link href={href}>{children}</Link>
              ) : (
                <a href={href} target="_blank" rel="noopener noreferrer">
                  {children}
                </a>
              ),
          }}
        >
          {paragraph}
        </Markdown>
      ))}
    </div>
  );
}

// A still inside the frame. If the file is missing, the image hides itself
// and the frame's dark fill shows through — never a broken-image icon. The
// mount check covers an error that fired before hydration attached onError.
function Still({
  src,
  alt,
  portrait,
}: {
  src: string;
  alt: string;
  portrait?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement | null>(null);
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, []);
  if (failed) return null;
  return (
    <Image
      ref={ref}
      src={src}
      alt={alt}
      fill
      sizes={portrait ? "240px" : "(max-width: 720px) 100vw, 640px"}
      className={styles.still}
      onError={() => setFailed(true)}
    />
  );
}

export function Plaque({ entry, headingLevel = 2, onClose }: PlaqueProps) {
  const Heading = `h${headingLevel}` as const;
  // useId, not the entry id: the same work can be on the page twice (the
  // page-level Collection and an overlay), and ids must stay unique.
  const headingId = useId();

  const closeButton = onClose && (
    <button
      type="button"
      className={styles.close}
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      close <span aria-hidden="true">×</span>
    </button>
  );

  const footer = onClose && (
    <p className={styles.footer}>click anywhere to step back</p>
  );

  if (entry.kind === "about") {
    return (
      <article
        className={`${styles.plaque} ${styles.about}`}
        aria-labelledby={headingId}
      >
        {closeButton}
        <div className={`${styles.frame} ${styles.portrait}`}>
          <div className={styles.media}>
            <Still src={entry.image} alt={`Portrait of ${entry.title}`} portrait />
          </div>
        </div>
        <div className={styles.label}>
          <p className={styles.meta}>About the artist</p>
          <Heading id={headingId} className={styles.title}>
            {entry.title}
          </Heading>
          <p className={styles.role}>{entry.role}</p>
          <Prose paragraphs={entry.paragraphs} />
        </div>
        {footer}
      </article>
    );
  }

  const {
    title,
    date,
    description,
    techTags,
    demo,
    still,
    github,
    writeup,
    contributors,
    inProgress,
  } = entry.project;

  let media = null;
  if (demo && !demo.alt) media = <VideoPlayer videoName={demo.src} />;
  else if (demo?.alt) media = <Still src={`/${demo.src}`} alt={demo.alt} />;
  else if (still)
    media = <Still src={`/still-${still}.png`} alt={`A still for ${title}`} />;

  return (
    <article className={styles.plaque} aria-labelledby={headingId}>
      {closeButton}
      <div className={styles.frame}>
        <div className={styles.media}>{media}</div>
      </div>
      <div className={styles.label}>
        <p className={styles.meta}>
          {inProgress && (
            <>
              <span className={styles.building}>Building</span>
              <span className={styles.sep} aria-hidden="true">
                ·
              </span>
            </>
          )}
          {date}
        </p>
        <Heading id={headingId} className={styles.title}>
          {title}
        </Heading>
        <Prose paragraphs={description} />
        {techTags.length > 0 && (
          <p className={styles.tech}>{techTags.join(" · ")}</p>
        )}
        {contributors && contributors.length > 0 && (
          <p className={styles.with}>
            <span className={styles.withLabel}>with:</span>{" "}
            {contributors.map((c, idx) => (
              <span key={c.name}>
                {idx > 0 && ", "}
                <Contributor {...c} />
              </span>
            ))}
          </p>
        )}
        {(github || writeup) && (
          <p className={styles.links}>
            {github && (
              <a href={github} target="_blank" rel="noopener noreferrer">
                GitHub ↗
              </a>
            )}
            {writeup && (
              <Link href={`/projects/${writeup}`}>Read the writeup →</Link>
            )}
          </p>
        )}
      </div>
      {footer}
    </article>
  );
}
