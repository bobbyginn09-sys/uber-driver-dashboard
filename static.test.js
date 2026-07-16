"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const requiredFiles = [
  "index.html", "styles.css", "core.js", "app.js", "manifest.json", "service-worker.js",
  "favicon.png", "icon-192.png", "icon-512.png"
];

for (const file of requiredFiles) {
  const target = path.join(root, file);
  assert(fs.existsSync(target), `${file} should exist`);
  assert(fs.statSync(target).size > 0, `${file} should not be empty`);
}

const index = read("index.html");
const styles = read("styles.css");
const core = read("core.js");
const app = read("app.js");
const worker = read("service-worker.js");
const manifest = JSON.parse(read("manifest.json"));

// Compile scripts without executing browser-only code.
new vm.Script(core, { filename: "core.js" });
new vm.Script(app, { filename: "app.js" });
new vm.Script(worker, { filename: "service-worker.js" });

for (const fragment of [
  '<meta name="viewport"', '<meta name="description"', 'rel="manifest"',
  'id="mainContent"', 'id="modalRoot"', 'id="toastRoot"',
  'src="core.js"', 'src="app.js"', 'href="styles.css"'
]) {
  assert(index.includes(fragment), `index.html should include ${fragment}`);
}

const ids = [...index.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
assert.equal(new Set(ids).size, ids.length, "static HTML IDs should be unique");
assert(!/\son[a-z]+\s*=/i.test(index), "index.html should not use inline event handlers");
assert(!/javascript:/i.test(index), "index.html should not use javascript: URLs");

const localRefs = [...index.matchAll(/\b(?:src|href)="([^"]+)"/g)]
  .map((match) => match[1])
  .filter((value) => value && !value.startsWith("#") && !/^(?:https?:|data:|mailto:|tel:)/.test(value));
for (const reference of localRefs) {
  const file = reference.split("#", 1)[0];
  assert(fs.existsSync(path.join(root, file)), `referenced asset ${reference} should exist`);
}

assert.equal(manifest.display, "standalone");
assert(Array.isArray(manifest.icons) && manifest.icons.length >= 2, "manifest should include install icons");
for (const icon of manifest.icons) {
  assert(fs.existsSync(path.join(root, icon.src)), `manifest icon ${icon.src} should exist`);
}

function pngDimensions(filename) {
  const buffer = fs.readFileSync(path.join(root, filename));
  assert.equal(buffer.toString("ascii", 1, 4), "PNG", `${filename} should be a PNG`);
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}
assert.deepEqual(pngDimensions("favicon.png"), { width: 32, height: 32 });
assert.deepEqual(pngDimensions("icon-192.png"), { width: 192, height: 192 });
assert.deepEqual(pngDimensions("icon-512.png"), { width: 512, height: 512 });

const cacheEntries = [...worker.matchAll(/"\.\/([^"]*)"/g)].map((match) => match[1] || "index.html");
for (const file of ["index.html", "styles.css", "core.js", "app.js", "manifest.json", "favicon.png", "icon-192.png", "icon-512.png"]) {
  assert(cacheEntries.includes(file), `${file} should be in the offline app shell`);
}

const malformedInterpolatedAttributes = app.split(/\r?\n/).filter((line) =>
  /class=".*\$\{.*\}\s+(?:type|data-|id|x|y|width|height|role|aria-|href|value|name|title)=/.test(line)
);
assert.deepEqual(malformedInterpolatedAttributes, [], "interpolated class attributes should close before the next attribute");

assert.equal(styles.split("{").length, styles.split("}").length, "CSS braces should balance");
assert.equal(styles.split("(").length, styles.split(")").length, "CSS parentheses should balance");
assert(!/@import\s+url|https?:\/\//i.test(styles), "styles should not depend on remote assets");
assert(!/<script[^>]+src="https?:/i.test(index), "app should not depend on remote scripts");

console.log("static.test.js: all tests passed");
