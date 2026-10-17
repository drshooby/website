// The collection: every plaque the site can show, in display order. The about
// entry comes first, then the projects in ProjectList order. Landmarks in the
// piazza find their plaque by title (entryForLandmark), so no copy lives in
// the engine.

import type { ProjectProps } from "@/types/project";
import { aboutText, name } from "./AboutText";
import { projects } from "./ProjectList";

export type CollectionEntry =
  | {
      kind: "about";
      id: "about";
      title: string;
      paragraphs: string[];
    }
  | { kind: "project"; id: string; project: ProjectProps };

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const aboutTitle = `${name.first} ${name.last}`;

export const collection: CollectionEntry[] = [
  {
    kind: "about",
    id: "about",
    title: aboutTitle,
    paragraphs: aboutText,
  },
  ...projects.map(({ awesomePeople, ...rest }): CollectionEntry => ({
    kind: "project",
    id: slug(rest.title),
    project: { ...rest, contributors: awesomePeople },
  })),
];

export function entryForLandmark(title: string): CollectionEntry | undefined {
  return collection.find((e) =>
    e.kind === "about" ? e.title === title : e.project.title === title,
  );
}
