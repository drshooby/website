import { Plaque } from "@/components/Plaque";
import { collection } from "@/text/collection";

// Temporary: every plaque in a column so the label can be checked by eye.
// Task 5 replaces this with the piazza.
export default function Home() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "5rem",
        padding: "4rem 1rem",
      }}
    >
      {collection.map((e) => (
        <Plaque key={e.id} entry={e} />
      ))}
    </div>
  );
}
