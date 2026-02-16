import type { DemoProps } from "./demo";
import type { ContributorProps } from "./contributor";

export type ProjectProps = {
  title: string;
  date: string;
  description: string[];
  techTags: string[];
  demo?: DemoProps;
  contributors?: ContributorProps[];
  inProgress?: boolean;
};