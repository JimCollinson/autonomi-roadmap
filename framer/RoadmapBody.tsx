import { useEffect, useState } from "react"
import { addPropertyControls, ControlType } from "framer"
import type { CSSProperties } from "react"

// =============================================================================
// Fixed Framer loader for the Autonomi roadmap body.
// Content + styles live in GitHub; this component just fetches and renders them.
//   - jsonUrl -> content/roadmap.json   (raw GitHub or jsDelivr URL)
//   - cssUrl  -> styles/roadmap.css
// The render logic below mirrors /lib/render.js so the local preview and Framer
// produce identical output. Keep the two in sync (or import one from jsDelivr).
// =============================================================================

interface Props {
    jsonUrl?: string
    cssUrl?: string
    maxWidth?: number
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function RoadmapBody({
    jsonUrl = "https://cdn.jsdelivr.net/gh/jimcollinson/autonomi-roadmap@main/content/roadmap.json",
    cssUrl = "https://cdn.jsdelivr.net/gh/jimcollinson/autonomi-roadmap@main/styles/roadmap.css",
    maxWidth = 1200,
}: Props) {
    const [html, setHtml] = useState("")
    const [css, setCss] = useState("")

    useEffect(() => {
        let alive = true
        ;(async () => {
            try {
                const [data, cssText] = await Promise.all([
                    fetch(jsonUrl, { cache: "no-store" }).then((r) => r.json()),
                    fetch(cssUrl, { cache: "no-store" }).then((r) => r.text()),
                ])
                if (!alive) return
                setCss(cssText)
                setHtml(buildHtml(data))
            } catch (e) {
                if (alive)
                    setHtml(
                        `<div style="padding:24px;font:14px sans-serif;color:#993333">Couldn't load roadmap content from GitHub. ${String(
                            e
                        )}</div>`
                    )
            }
        })()
        return () => {
            alive = false
        }
    }, [jsonUrl, cssUrl])

    const style = { width: "100%", "--rm-maxw": maxWidth + "px" } as CSSProperties
    return (
        <div style={style}>
            <style>{css}</style>
            <div dangerouslySetInnerHTML={{ __html: html }} />
        </div>
    )
}

addPropertyControls(RoadmapBody, {
    jsonUrl: { type: ControlType.String, title: "JSON URL", defaultValue: "https://cdn.jsdelivr.net/gh/jimcollinson/autonomi-roadmap@main/content/roadmap.json" },
    cssUrl: { type: ControlType.String, title: "CSS URL", defaultValue: "https://cdn.jsdelivr.net/gh/jimcollinson/autonomi-roadmap@main/styles/roadmap.css" },
    maxWidth: { type: ControlType.Number, title: "Max width", defaultValue: 1200, min: 600, max: 1600, step: 10, unit: "px" },
})

// ---- renderer (mirror of /lib/render.js) -----------------------------------

const ICONS: Record<string, string> = {
    live: '<svg viewBox="0 0 120 120" fill="none"><circle cx="60" cy="60" r="10" stroke="#26264C" stroke-width="3"/><circle cx="60" cy="60" r="4" fill="#E91337"/><path d="M44 44A22 22 0 0176 44" stroke="#26264C" stroke-width="2.5" stroke-linecap="round"/><path d="M76 76A22 22 0 0144 76" stroke="#26264C" stroke-width="2.5" stroke-linecap="round"/><path d="M38 38A31 31 0 0182 38" stroke="#26264C" stroke-width="2" stroke-linecap="round" opacity="0.4"/><path d="M82 82A31 31 0 0138 82" stroke="#26264C" stroke-width="2" stroke-linecap="round" opacity="0.4"/></svg>',
    next: '<svg viewBox="0 0 120 120" fill="none"><path d="M42 60H72" stroke="#26264C" stroke-width="3.5" stroke-linecap="round"/><path d="M64 50L74 60L64 70" stroke="#26264C" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M42 48L42 42L48 42" stroke="#E91337" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M78 72L78 78L72 78" stroke="#E91337" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    sandbox: '<svg viewBox="0 0 120 120" fill="none"><circle cx="48" cy="48" r="4" fill="#26264C" opacity="0.6"/><circle cx="72" cy="48" r="4" fill="#26264C" opacity="0.6"/><circle cx="60" cy="72" r="4" fill="#26264C" opacity="0.6"/><circle cx="42" cy="66" r="3.5" fill="#E91337" opacity="0.7"/><circle cx="78" cy="66" r="3.5" fill="#E91337" opacity="0.7"/><circle cx="60" cy="42" r="3.5" fill="#E91337" opacity="0.7"/><line x1="48" y1="48" x2="72" y2="48" stroke="#26264C" stroke-width="1.5" opacity="0.3" stroke-dasharray="4 4"/><line x1="72" y1="48" x2="60" y2="72" stroke="#26264C" stroke-width="1.5" opacity="0.3" stroke-dasharray="4 4"/><line x1="60" y1="72" x2="48" y2="48" stroke="#26264C" stroke-width="1.5" opacity="0.3" stroke-dasharray="4 4"/></svg>',
}
const TAGS: Record<string, [string, string]> = {
    protocol: ["Protocol", "rm-tag-protocol"],
    app: ["Application", "rm-tag-app"],
    infra: ["Infrastructure", "rm-tag-infra"],
    tools: ["Tools", "rm-tag-tools"],
}
const LAYOUTS: Record<string, [string | null, string]> = {
    platforms: ["rm-platforms", "rm-platform"],
    products: ["rm-products", "rm-product"],
    infra: ["rm-infra", "rm-infra-card"],
    sandbox: ["rm-sandbox", "rm-sandbox-card"],
    herocards: [null, "rm-hero-card"],
}
function esc(s: unknown) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}
function md(s: unknown) {
    let out = esc(s)
    out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    out = out.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>")
    out = out.replace(/`([^`]+)`/g, "<code>$1</code>")
    return out
}
function card(c: any, cardClass: string) {
    const t = c.tag && TAGS[c.tag]
    const tag = t ? `<span class="rm-tag ${t[1]}">${esc(t[0])}</span>` : ""
    const sub = c.sub ? `<div class="rm-card-sub">${esc(c.sub)}</div>` : ""
    return `<div class="${cardClass}">${tag}<h3>${esc(c.title)}</h3>${sub}<p>${md(c.body)}</p></div>`
}
function tier(t: any) {
    const [grid, cardClass] = LAYOUTS[t.layout] || LAYOUTS.products
    const label = t.label ? `<div class="rm-tier">${esc(t.label)}</div>` : ""
    const cards = (t.cards || []).map((c: any) => card(c, cardClass)).join("")
    return grid ? `${label}<div class="${grid}">${cards}</div>` : `${label}${cards}`
}
function section(s: any) {
    const icon = ICONS[s.icon] || ""
    const tiers = (s.tiers || []).map(tier).join("")
    return `<div class="rm-section" id="${esc(s.id)}"><div class="rm-section-hdr"><div class="rm-label">${esc(s.label)}</div><div class="rm-section-title">${icon}${esc(s.title)}</div></div>${tiers}</div>`
}
function buildHtml(data: any) {
    const pills = `<div class="rm-pills">${(data.pills || [])
        .map((p: any) => `<a href="${esc(p.href)}" class="rm-pill ${esc(p.style)}">${esc(p.label)}</a>`)
        .join("")}</div>`
    const sections = (data.sections || []).map(section).join('<hr class="rm-divider">')
    const footer = data.footer ? `<div class="rm-footer"><p>${md(data.footer)}</p></div>` : ""
    return `<div class="rm">${pills}${sections}${footer}</div>`
}
