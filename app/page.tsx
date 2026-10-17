import { Collection } from "@/components/Collection";
import { Identity } from "@/components/Identity";
import { Piazza } from "@/components/Piazza";

// The piazza page. #stage is the painting area: a static image in fallback
// and painting modes (Task 9 mounts the live scene there on phones), the
// full-viewport playable scene in play mode, which Piazza mounts inside it.
// Layout per mode lives in app/globals.css, keyed on html[data-mode].
export default function Home() {
  return (
    <>
      <Identity />
      <div id="stage">
        <Piazza />
      </div>
      <Collection />
    </>
  );
}
