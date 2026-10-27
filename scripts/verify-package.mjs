import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import * as esm from "../lib/index.js";
const require = createRequire(import.meta.url);
const cjs = require("../lib/index.cjs");
for (const name of ["DraggablePopup", "DraggableModal", "DraggableDrawer"]) {
  assert.ok(esm[name], `missing ESM export ${name}`);
  assert.ok(cjs[name], `missing CJS export ${name}`);
}
assert.ok(existsSync("lib/style.css"), "missing stylesheet");
assert.ok(existsSync("lib/types/index.d.ts"), "missing declarations");
const manifest = JSON.parse(readFileSync("package.json", "utf8"));
assert.ok(
  !manifest.dependencies["ant-design-vue"],
  "Antdv must remain demo-only",
);
assert.ok(manifest.peerDependencies.vue, "Vue must be a peer dependency");
assert.ok(
  !readFileSync("lib/index.js", "utf8").includes("ant-design-vue"),
  "Antdv leaked into the library",
);
console.log(
  "Library exports, CSS, declarations and dependency isolation verified.",
);
