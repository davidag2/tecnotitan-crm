const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const publicDir = path.join(root, "public");
const outputDir = path.join(root, ".vercel", "output");
const staticDir = path.join(outputDir, "static");

fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(staticDir, { recursive: true });

for (const entry of fs.readdirSync(publicDir)) {
  fs.cpSync(path.join(publicDir, entry), path.join(staticDir, entry), { recursive: true });
}

fs.writeFileSync(
  path.join(outputDir, "config.json"),
  JSON.stringify(
    {
      version: 3,
      routes: [{ src: "/(.*)", dest: "/index.html" }],
    },
    null,
    2
  )
);

console.log("Vercel static output generated.");
