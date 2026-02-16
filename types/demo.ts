export interface DemoProps {
  src: string;
  alt?: string; // image if present
  github?: string;
  writeup?: string; // slug, e.g. "radiant" → /projects/radiant
}