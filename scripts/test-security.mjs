import assert from "node:assert/strict"
import { buildHtml } from "../lib/render.js"

const baseData = {
  pills: [
    { label: "Safe", href: "https://example.com/path?x=1&y=2", style: "is-live" },
    { label: "Bad", href: "javascript:alert(1)", style: "is-next" },
  ],
  sections: [
    {
      id: "live",
      label: "Live",
      title: "Running today",
      icon: "live",
      tiers: [
        {
          layout: "products",
          cards: [
            {
              title: "Markdown links",
              body: "[ok](https://example.com/a?b=1&c=2) [inject](https://example.com/\"onmouseover=alert(1)) [star](https://example.com/*path*) [js](javascript:alert(1)) [data](data:text/html,evil)",
            },
          ],
        },
      ],
    },
  ],
  footer: "Footer",
}

const html = buildHtml(baseData)

assert.match(html, /href="https:\/\/example\.com\/path\?x=1&amp;y=2"/)
assert.match(html, /href="https:\/\/example\.com\/a\?b=1&amp;c=2"/)
assert.match(html, /href="https:\/\/example\.com\/\*path\*"/)
assert.doesNotMatch(html, /\sonclick="/)
assert.doesNotMatch(html, /\sonmouseover=/)
assert.doesNotMatch(html, /href="[^"]*<em>/)
assert.doesNotMatch(html, /javascript:/)
assert.doesNotMatch(html, /data:text\/html/)
assert.equal((html.match(/target="_blank"/g) || []).length, 2)
assert.match(html, /<a class="rm-pill is-next">Bad<\/a>/)

console.log("security renderer tests passed")
