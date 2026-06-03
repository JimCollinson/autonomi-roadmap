// Shared renderer: turns roadmap.json into the roadmap HTML string.
// Used by the local preview (preview/index.html) and mirrored inside the
// Framer component (framer/RoadmapBody.tsx). Pure, no DOM dependency, so it
// also runs under Node for tests.

const ICONS = {
  live: '<svg viewBox="0 0 120 120" fill="none"><circle cx="60" cy="60" r="10" stroke="#26264C" stroke-width="3"/><circle cx="60" cy="60" r="4" fill="#E91337"/><path d="M44 44A22 22 0 0176 44" stroke="#26264C" stroke-width="2.5" stroke-linecap="round"/><path d="M76 76A22 22 0 0144 76" stroke="#26264C" stroke-width="2.5" stroke-linecap="round"/><path d="M38 38A31 31 0 0182 38" stroke="#26264C" stroke-width="2" stroke-linecap="round" opacity="0.4"/><path d="M82 82A31 31 0 0138 82" stroke="#26264C" stroke-width="2" stroke-linecap="round" opacity="0.4"/></svg>',
  next: '<svg viewBox="0 0 120 120" fill="none"><path d="M42 60H72" stroke="#26264C" stroke-width="3.5" stroke-linecap="round"/><path d="M64 50L74 60L64 70" stroke="#26264C" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M42 48L42 42L48 42" stroke="#E91337" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M78 72L78 78L72 78" stroke="#E91337" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  sandbox: '<svg viewBox="0 0 120 120" fill="none"><circle cx="48" cy="48" r="4" fill="#26264C" opacity="0.6"/><circle cx="72" cy="48" r="4" fill="#26264C" opacity="0.6"/><circle cx="60" cy="72" r="4" fill="#26264C" opacity="0.6"/><circle cx="42" cy="66" r="3.5" fill="#E91337" opacity="0.7"/><circle cx="78" cy="66" r="3.5" fill="#E91337" opacity="0.7"/><circle cx="60" cy="42" r="3.5" fill="#E91337" opacity="0.7"/><line x1="48" y1="48" x2="72" y2="48" stroke="#26264C" stroke-width="1.5" opacity="0.3" stroke-dasharray="4 4"/><line x1="72" y1="48" x2="60" y2="72" stroke="#26264C" stroke-width="1.5" opacity="0.3" stroke-dasharray="4 4"/><line x1="60" y1="72" x2="48" y2="48" stroke="#26264C" stroke-width="1.5" opacity="0.3" stroke-dasharray="4 4"/></svg>',
}

const TAGS = {
  protocol: ["Protocol", "rm-tag-protocol"],
  app: ["Application", "rm-tag-app"],
  infra: ["Infrastructure", "rm-tag-infra"],
  tools: ["Tools", "rm-tag-tools"],
}

const LAYOUTS = {
  platforms: ["rm-platforms", "rm-platform"],
  products: ["rm-products", "rm-product"],
  infra: ["rm-infra", "rm-infra-card"],
  sandbox: ["rm-sandbox", "rm-sandbox-card"],
  herocards: [null, "rm-hero-card"],
}

// Escape first, so author markup can never inject raw HTML/scripts.
function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

function attr(s) {
  return esc(s).replace(/"/g, "&quot;").replace(/'/g, "&#39;")
}

function sanitizeHttpUrl(value) {
  const url = String(value == null ? "" : value).trim()
  if (!url || /[\u0000-\u0020"'<>`]/.test(url)) return null
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null
    if (!parsed.hostname) return null
    return parsed.href
  } catch {
    return null
  }
}

// Tiny, safe inline-Markdown: **bold**, *italic*, `code`, [text](https://url)
function inlineText(s) {
  let out = esc(s)
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
  out = out.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>")
  out = out.replace(/`([^`]+)`/g, "<code>$1</code>")
  return out
}

function md(s) {
  const input = String(s == null ? "" : s)
  let out = ""
  let index = 0
  input.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (match, text, url, offset) => {
    out += inlineText(input.slice(index, offset))
    const safeUrl = sanitizeHttpUrl(url)
    out += safeUrl ? `<a href="${attr(safeUrl)}" target="_blank" rel="noopener">${inlineText(text)}</a>` : inlineText(text)
    index = offset + match.length
    return match
  })
  out += inlineText(input.slice(index))
  return out
}

function card(c, cardClass) {
  const t = c.tag && TAGS[c.tag]
  const tag = t ? `<span class="rm-tag ${t[1]}">${esc(t[0])}</span>` : ""
  const sub = c.sub ? `<div class="rm-card-sub">${esc(c.sub)}</div>` : ""
  return `<div class="${cardClass}">${tag}<h3>${esc(c.title)}</h3>${sub}<p>${md(c.body)}</p></div>`
}

function tier(t) {
  const [grid, cardClass] = LAYOUTS[t.layout] || LAYOUTS.products
  const label = t.label ? `<div class="rm-tier">${esc(t.label)}</div>` : ""
  const cards = (t.cards || []).map((c) => card(c, cardClass)).join("")
  return grid ? `${label}<div class="${grid}">${cards}</div>` : `${label}${cards}`
}

function section(s) {
  const icon = ICONS[s.icon] || ""
  const tiers = (s.tiers || []).map(tier).join("")
  return (
    `<div class="rm-section" id="${attr(s.id)}">` +
    `<div class="rm-section-hdr"><div class="rm-label">${esc(s.label)}</div>` +
    `<div class="rm-section-title">${icon}${esc(s.title)}</div></div>` +
    `${tiers}</div>`
  )
}

export function buildHtml(data) {
  const pills = `<div class="rm-pills">${(data.pills || [])
    .map((p) => {
      const href = sanitizeHttpUrl(p.href)
      const hrefAttr = href ? ` href="${attr(href)}"` : ""
      return `<a${hrefAttr} class="rm-pill ${attr(p.style)}">${esc(p.label)}</a>`
    })
    .join("")}</div>`
  const sections = (data.sections || []).map(section).join('<hr class="rm-divider">')
  return `<div class="rm">${pills}${sections}</div>`
}
