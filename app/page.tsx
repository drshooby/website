import { Collection } from "@/components/Collection";
import { Identity } from "@/components/Identity";

// The piazza page. #stage is the painting area: a static image in fallback
// and painting modes (Task 9 mounts the live scene there on phones), the
// full-viewport playable scene in play mode (Task 7). Layout per mode lives
// in app/globals.css, keyed on html[data-mode].
export default function Home() {
  return (
    <>
      <Identity />
      <div id="stage" />
      <Collection />
    </>
  );
}
