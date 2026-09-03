"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const childProcess = require("node:child_process");

const root = __dirname;
const required = [
  "index.html", "styles.css", "core.js", "app.js", "manifest.json", "service-worker.js",
  "favicon.png", "icon-192.png", "icon-512.png", "README.md", "CHANGELOG.md", "INSTALL.txt"
];
for (const file of required) assert.ok(fs.existsSync(path.join(root, file)), `${file} missing`);

for (const file of ["core.js", "app.js", "service-worker.js"]) {
  childProcess.execFileSync(process.execPath, ["--check", path.join(root, file)], { stdio: "pipe" });
}

const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
for (const ref of ["styles.css", "core.js", "app.js", "manifest.json"]) assert.ok(html.includes(ref), `${ref} not linked`);
assert.ok(html.includes("Version 3.7.0"), "index version label is stale");

const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
for (const phrase of [
  "Pause shift", "Resume shift", "Finish & show money plan", "Edit money plan",
  "Bitcoin", "Solana", "SCHG", "AAVE", "There is no savings allocation",
  "Uber gross", "Lyft gross", "Overall gross", "Earnings by app", "uberGross", "lyftGross"
]) assert.ok(app.includes(phrase), `${phrase} not found`);

const core = fs.readFileSync(path.join(root, "core.js"), "utf8");
for (const phrase of ['APP_VERSION = "3.7.0"', 'basis: "gross"', "investmentPct: 20", "schg: 20"]) {
  assert.ok(core.includes(phrase), `${phrase} not found in core.js`);
}

const sw = fs.readFileSync(path.join(root, "service-worker.js"), "utf8");
assert.ok(sw.includes("driver-command-3.7.0-v1"), "service-worker cache version is stale");

const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));
assert.equal(manifest.name, "Driver Command");
assert.ok(Array.isArray(manifest.icons) && manifest.icons.length >= 2, "manifest icons missing");

const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");
assert.ok(readme.includes("# Driver Command 3.7.0"));
assert.ok(readme.includes("Vehicle fund:** 5% of gross earnings"));
assert.ok(readme.includes("Investments:** 20% of gross earnings"));
assert.ok(readme.includes("Savings:** 0%"));
assert.ok(readme.includes("Separate Uber and Lyft earnings"));
assert.ok(readme.includes("Older unassigned gross"));

console.log("static.test.js: all assertions passed");
