export type DemoProps =
  | {
      type: "video";
      src: string;
    }
  | {
      type: "image";
      src: string;
      alt: string;
    };