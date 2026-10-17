import { describe, expect, test } from "bun:test";
import { World } from "@/lib/piazza/world";
import { aboutText } from "./AboutText";
import { projects } from "./ProjectList";
import { collection, entryForLandmark } from "./collection";

describe("collection", () => {
  test("about entry first", () => {
    const first = collection[0];
    expect(first.kind).toBe("about");
    if (first.kind !== "about") throw new Error("unreachable");
    expect(first.id).toBe("about");
    expect(first.title).toBe("David Shubov");
    expect(first.role).toBe("Cloud and infrastructure engineer");
    expect(first.paragraphs).toEqual(aboutText);
    expect(first.image).toBe("/avatar.webp");
  });

  test("projects follow in ProjectList order", () => {
    const titles = collection
      .slice(1)
      .map((e) => (e.kind === "project" ? e.project.title : e.title));
    expect(titles).toEqual(projects.map((p) => p.title));
  });

  test("every landmark has an entry", () => {
    for (const l of new World().landmarks) {
      expect(entryForLandmark(l.title)).toBeDefined();
    }
    expect(entryForLandmark("David Shubov")?.kind).toBe("about");
    expect(entryForLandmark("Nowhere")).toBeUndefined();
  });

  test("ids are unique slugs", () => {
    const ids = collection.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  test("credit survives", () => {
    for (const p of projects) {
      if (!p.awesomePeople) continue;
      const entry = entryForLandmark(p.title);
      expect(entry?.kind).toBe("project");
      if (entry?.kind !== "project") throw new Error("unreachable");
      expect(entry.project.contributors).toEqual(p.awesomePeople);
    }
  });

  test("every project has media or a still", () => {
    for (const e of collection) {
      if (e.kind !== "project") continue;
      expect(Boolean(e.project.demo || e.project.still)).toBe(true);
    }
  });
});
