// Generates preview/standalone.html — a single, self-contained file you can
// just double-click (no server, no fetch). It inlines the current CSS + content
// so it renders exactly what Framer will. Re-run after editing content or styles:
//   node build-preview.mjs   (or: npm run preview)

import { readFileSync, writeFileSync } from "node:fs"
import { buildHtml } from "./lib/render.js"

const data = JSON.parse(readFileSync(new URL("./content/roadmap.json", import.meta.url), "utf8"))
const css = readFileSync(new URL("./styles/roadmap.css", import.meta.url), "utf8")
const body = buildHtml(data)

const out = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex,nofollow,noarchive,nosnippet" />
  <title>Autonomi Roadmap — standalone preview</title>
  <style>${css}</style>
  <style>body{margin:0;padding:40px 0;background:#fff}</style>
</head>
<body>
${body}
</body>
</html>
`

writeFileSync(new URL("./preview/standalone.html", import.meta.url), out)
console.log("Wrote preview/standalone.html (" + out.length + " bytes)")
