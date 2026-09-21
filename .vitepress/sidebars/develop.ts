import type { Fabric } from "../types.d.ts";

// TODO: should we make the link start with / instead of the base ending with /? this way we don't have to replaceAll("//", "/") I'm pretty sure
// TODO: do we allow SidebarItem to be a string, which normalizes to { link: string } ?

export const DEVELOP_SIDEBAR: Fabric.SidebarItem[] = [
  {
    base: "/develop/",
    link: "/",
    items: [
      {
        collapsed: false,
        base: "/develop/getting-started/",
        items: [
          { link: "creating-a-project" },
          { link: "project-structure" },
          { link: "setting-up" },
          { link: "opening-a-project" },
          { link: "launching-the-game" },
          { link: "generating-sources" },
          { link: "building-a-mod" },
          { link: "tips-and-tricks" },
        ],
      },
      {
        base: "/develop/items/",
        items: [
          {
            link: "first-item",
            items: [
              { link: "food" },
              { link: "potions" },
              { link: "spawn-egg" },
              { link: "custom-tools" },
              { link: "custom-armor" },
            ],
          },
          { link: "item-models" },
          { link: "item-appearance" },
          { link: "custom-creative-tabs" },
          { link: "custom-item-interactions" },
          { link: "custom-enchantment-effects" },
          { link: "custom-data-components" },
        ],
      },
      {
        base: "/develop/blocks/",
        items: [
          { link: "first-block" },
          { link: "block-models" },
          { link: "blockstates" },
          {
            link: "block-entities",
            items: [
              { link: "block-entity-renderer" },
              { link: "block-containers" },
              { link: "container-menus" },
            ],
          },
          { link: "block-tinting" },
          { link: "workstations" },
        ],
      },
      {
        base: "/develop/fluids/",
        items: [
          //
          { link: "first-fluid" },
        ],
      },
      {
        base: "/develop/entities/",
        items: [
          { link: "first-entity" },
          { link: "attributes" },
          { link: "effects" },
          { link: "damage-types" },
        ],
      },
      {
        base: "/develop/sounds/",
        items: [
          //
          { link: "using-sounds" },
          { link: "custom" },
          { link: "dynamic-sounds" },
        ],
      },
      {
        base: "/develop/commands/",
        items: [
          //
          { link: "basics" },
          { link: "arguments" },
          { link: "suggestions" },
        ],
      },
      {
        base: "/develop/recipes/",
        items: [
          //
          { link: "custom-recipe-types" },
          { link: "extending-vanilla-recipes" },
        ],
      },
      {
        base: "/develop/rendering/",
        items: [
          { link: "basic-concepts" },
          { link: "gui-graphics" },
          { link: "hud" },
          { link: "world" },
          {
            base: "/develop/rendering/gui/",
            items: [
              //
              { link: "custom-screens" },
              { link: "custom-widgets" },
            ],
          },
          {
            base: "/develop/rendering/particles/",
            items: [
              //
              { link: "creating-particles" },
            ],
          },
        ],
      },
      {
        base: "/develop/data-generation/",
        items: [
          { link: "setup" },
          {
            text: "/develop/data-generation//client",
            items: [
              { link: "translations" },
              {
                text: "/develop/data-generation//models",
                items: [
                  //
                  { link: "block-models" },
                  { link: "item-models" },
                ],
              },
            ],
          },
          {
            text: "/develop/data-generation//server",
            items: [
              { link: "advancements" },
              { link: "enchantments" },
              { link: "loot-tables" },
              { link: "recipes" },
              { link: "tags" },
              {
                text: "/develop/data-generation//world-generation",
                items: [
                  //
                  { link: "features" },
                ],
              },
            ],
          },
        ],
      },
      {
        base: "/develop/serialization/",
        items: [
          //
          { link: "codecs" },
          { link: "data-attachments" },
          { link: "saved-data" },
        ],
      },
      {
        base: "/develop/loom/",
        link: "/",
        items: [
          { link: "fabric-api" },
          { link: "options" },
          { link: "production-run-tasks" },
          { link: "classpath-groups" },
          { link: "tasks" },
        ],
      },
      {
        base: "/develop/loader/",
        link: "/",
        items: [
          //
          { link: "fabric-mod-json" },
        ],
      },
      {
        text: "/develop/porting//",
        items: [
          {
            link: "porting/",
            items: [
              {
                base: "/",
                link: "/26.1/develop/porting/fabric-api",
              },
            ],
          },
          {
            link: "porting/mappings/",
            items: [
              {
                base: "/",
                link: "/1.21.11/develop/porting/mappings/loom",
              },
              {
                base: "/",
                link: "/1.21.11/develop/porting/mappings/ravel",
              },
            ],
          },
        ],
      },
      {
        base: "/develop/mixins/",
        items: [
          //
          { link: "bytecode" },
          { link: "accessors" },
        ],
      },
      {
        base: "/develop/class-tweakers/",
        link: "/",
        items: [
          { link: "access-widening" },
          { link: "interface-injection" },
          { link: "enum-extension" },
        ],
      },
      {
        text: "/develop//misc",
        items: [
          { link: "automatic-testing" },
          { link: "debugging" },
          { link: "events" },
          { link: "game-rules" },
          { link: "key-mappings" },
          { link: "networking" },
          { link: "resource-conditions" },
          { link: "statistics" },
          { link: "text-and-translations" },
        ],
      },
    ].map((i) => ({ collapsed: true, ...i })),
  },
];
