import type { DemoProps } from "./demo";
import type { ContributorProps } from "./contributor";

export type ProjectProps = {
  title: string;
  date: string;
  bullets: string[];
  techTags: string[];
  demo?: DemoProps;
  contributors?: ContributorProps[];
  inProgress?: boolean;
};