import { Collection } from "@/components/Collection";
import { Identity } from "@/components/Identity";
import { Piazza } from "@/components/Piazza";
import { MODE_SCRIPT } from "@/lib/piazza/mode";

// The piazza page. #stage is the painting area: a static image in fallback
// and painting modes (Task 9 mounts the live scene there on phones), the
// full-viewport playable scene in play mode, which Piazza mounts inside it.
// Layout per mode lives in app/globals.css, keyed on html[data-mode].
// MODE_SCRIPT is rendered first, here and not in the root layout, so it
// runs before the rest of the page is parsed (no flash of the wrong
// layout) and other routes never get a data-mode. No JS: data-mode stays
// absent, which CSS treats as fallback.
export default function Home() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: MODE_SCRIPT }} />
      <Identity />
      <div id="stage">
        <Piazza />
      </div>
      <Collection />
    </>
  );
}
