import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, join, dirname, basename } from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";
import process from "node:process";

const manifest = JSON.parse(
  (await import("node:fs")).readFileSync("package.json", "utf8"),
);
const tarball = resolve(`${manifest.name}-${manifest.version}.tgz`);
const consumer = mkdtempSync(join(tmpdir(), "vue-popup-package-"));
function run(executable, args) {
  const result = spawnSync(executable, args, {
    cwd: consumer,
    stdio: "inherit",
  });
  assert.equal(result.status, 0, `consumer command failed: ${args[0]}`);
}
try {
  writeFileSync(
    join(consumer, "package.json"),
    JSON.stringify({
      name: "component-consumer-smoke",
      private: true,
      type: "module",
      dependencies: {
        [manifest.name]: pathToFileURL(tarball).href,
        vue: manifest.devDependencies.vue,
      },
    }),
  );
  run(process.execPath, [
    process.env.npm_execpath,
    "install",
    "--ignore-scripts",
    "--prefer-offline",
    "--no-audit",
    "--no-fund",
  ]);
  writeFileSync(
    join(consumer, "smoke.mjs"),
    `import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import Default, {DraggablePopup,DraggableModal,DraggableDrawer} from 'vue-draggable-popup';
assert.equal(Default,DraggablePopup);
const commonjs=createRequire(import.meta.url)('vue-draggable-popup');
for(const name of ['DraggablePopup','DraggableModal','DraggableDrawer'])assert.ok(commonjs[name]);
assert.ok(DraggableModal);assert.ok(DraggableDrawer);
`,
  );
  run(process.execPath, ["smoke.mjs"]);
  writeFileSync(
    join(consumer, "consumer.ts"),
    `import {h} from 'vue';
import {DraggablePopup,DraggableModal,DraggableDrawer} from 'vue-draggable-popup';
import type {PopupProps,PopupExpose,DraggableDrawerProps,DraggableModalProps} from 'vue-draggable-popup';
const base:PopupProps={open:true,height:320,showHeader:false,dragHandle:'.toolbar'};
const drawer:DraggableDrawerProps={open:true,height:'320px',showHeader:false,dragHandle:()=>document.querySelector<HTMLElement>('.toolbar'),onClose:(e:MouseEvent)=>{void e.type}};
const modal:DraggableModalProps={open:true,confirmLoading:false,onCancel:(e:MouseEvent)=>{void e.type}};
h(DraggablePopup,base);h(DraggableDrawer,drawer);h(DraggableModal,modal);
function exposed(panel:PopupExpose){panel.maximize();panel.restore();return panel.getRect()}
void exposed;
`,
  );
  writeFileSync(
    join(consumer, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {
        target: "ES2022",
        module: "ESNext",
        moduleResolution: "Bundler",
        lib: ["ES2022", "DOM", "DOM.Iterable"],
        strict: true,
        noEmit: true,
        noUncheckedSideEffectImports: true,
        skipLibCheck: false,
      },
      include: ["consumer.ts"],
    }),
  );
  run(process.execPath, [
    resolve("node_modules/typescript/bin/tsc"),
    "-p",
    "tsconfig.json",
  ]);
  console.log(
    "Packed package installed and verified in an isolated consumer (ESM, CJS, strict TypeScript, no Antdv).",
  );
} finally {
  // Check the exact temporary target before recursively removing this test fixture.
  assert.equal(dirname(resolve(consumer)), resolve(tmpdir()));
  assert.ok(basename(consumer).startsWith("vue-popup-package-"));
  rmSync(consumer, { recursive: true, force: true });
}
