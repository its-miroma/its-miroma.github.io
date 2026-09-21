import type { Fabric } from "../types.d.ts";

export const PLAYERS_SIDEBAR: Fabric.SidebarItem[] = [
  {
    base: "/players/",
    link: "/",
    items: [
      { link: "installing-java/" },
      { link: "installing-fabric/" },
      { link: "updating-fabric/" },
      { link: "finding-mods" },
      { link: "installing-mods" },
      {
        base: "/players/troubleshooting/",
        items: [
          { link: "uploading-logs" },
          { link: "crash-reports" },
          { link: "dependency-overrides" },
        ],
      },
      { link: "faq" },
    ],
  },
];
