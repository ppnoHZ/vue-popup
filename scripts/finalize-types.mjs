import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
// Vite extracts source CSS into lib/style.css. Its source-only import must not
// leak into declarations consumed by projects without Vite's CSS ambient types.
for (const file of readdirSync("lib/types", { recursive: true })) {
  if (!file.endsWith(".d.ts")) continue;
  const path = join("lib/types", file),
    text = readFileSync(path, "utf8");
  writeFileSync(
    path,
    text.replace(/^import ["']\.\/styles\.css["'];?\r?\n/m, ""),
  );
}
