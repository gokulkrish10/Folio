import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Folio — Private PDF Reader",
    short_name: "Folio",
    description:
      "A private, offline-first PDF library and focused reading experience.",
    start_url: "/",
    display: "standalone",
    background_color: "#fafaf8",
    theme_color: "#2f5548",
    orientation: "any",
    categories: ["books", "education", "productivity"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
