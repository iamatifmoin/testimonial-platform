const { spawnSync } = require("node:child_process");

let viteBin;

try {
  viteBin = require.resolve("vite/bin/vite.js");
} catch (error) {
  console.error(
    "Unable to resolve the Vite CLI from the widget workspace or the repo root."
  );
  console.error(error.message);
  process.exit(1);
}

const result = spawnSync(process.execPath, [viteBin, ...process.argv.slice(2)], {
  stdio: "inherit",
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 0);
