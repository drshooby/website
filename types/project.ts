import type { DemoProps } from "./demo";
import type { ContributorProps } from "./contributor";

export type ProjectProps = {
  title: string;
  date: string;
  description: string[];
  techTags: string[];
  demo?: DemoProps;
  github?: string;
  writeup?: string; // slug, e.g. "radiant" → /projects/radiant
  contributors?: ContributorProps[];
  inProgress?: boolean;
};
