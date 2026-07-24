const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const sourcePath = path.join(rootDir, "src", "widget.js");
const distDir = path.join(rootDir, "dist");
const outputPath = path.join(distDir, "widget.js");

fs.mkdirSync(distDir, { recursive: true });
fs.copyFileSync(sourcePath, outputPath);

console.log(`Built widget bundle at ${outputPath}`);
