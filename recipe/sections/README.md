# Section Catalogue

The building blocks the AI may place in `sections[]`. Field definitions live in
`site.schema.json` (authoritative); this file explains **meaning, when to use, copy
limits, and variant choice** — the things a schema can't express.

General rules:
- Every section supports `id` (anchor), `heading`, `subheading`, `eyebrow`,
  `background`, `visible`. Only `hero`'s and `cta`'s headings are structurally
  required; others read better with one.
- Alternate `background` for rhythm. Never stack two `dark` or two `primary`.
- Pick 5–8 sections total. Each section must map to content the customer can supply.

---

## hero  ·  *required, always first*
The above-the-fold promise. One job: say what you do + why it matters + one action.
- **Fields:** `variant` (split | centered | image-bg), `heading` (≤9 words),
  `subheading` (1–2 sentences), `bullets` (≤4 proof points), `primaryCta`,
  `secondaryCta`, `media`.
- **Variant:** `split` = copy left, image right (default, safest). `centered` = no
  image, big type (good when no photo). `image-bg` = full-bleed photo (needs a strong
  `unsplash`/real image).
- **Media:** if no real asset, use `placeholder` for split/centered, `unsplash` for
  image-bg.

## logos  ·  *social proof, optional*
A strip of client/partner logos. Use **only** if they have recognizable ones.
- **Fields:** `heading` (e.g. "Trusted by"), `logos[]` each `{name, media}`.
- Logos are real assets — if the customer can't provide them, **omit this section**.

## features  ·  *what you offer, abstractly*
Icon-led grid of capabilities/benefits. The workhorse section.
- **Fields:** `variant` (grid | list | alternating), `columns` (2–4), `items[]`
  `{icon, title, body, link?}`. 3 or 6 items look best in a grid.
- **Copy:** title 2–4 words; body ≤20 words. Always use `icon`, never photos.

## services  ·  *what you sell, concretely*
Like features but heavier: each item can carry a price, image, and its own CTA.
- **Fields:** `items[]` `{icon|media, title, body, price?, cta?}`.
- Use `features` for "why us", `services` for "here's the menu". Rarely need both.

## about  ·  *story / credibility*
A text + media block telling who you are.
- **Fields:** `variant` (text-media | media-text | centered), `body` (supports simple
  markdown: paragraphs, **bold**, lists), `media`.
- **Copy:** 2–3 short paragraphs max. Use `centered` (no media) if no good photo.

## stats  ·  *quantified credibility, optional*
2–4 big numbers. **Only with real figures** the customer states.
- **Fields:** `items[]` `{value, suffix?, label}` (e.g. value "500" suffix "+"
  label "Projects delivered").
- If they have no numbers, omit — never fabricate.

## gallery  ·  *show the work*
Image-first grid/carousel for portfolios, products, venues, food.
- **Fields:** `variant` (grid | masonry | carousel), `items[]` `{media, caption?}`.
- Needs real photos to shine. With none, use several `unsplash` items with good
  `query` terms, or omit.

## pricing  ·  *plans, optional*
1–4 plan cards. Use **only if prices are public**.
- **Fields:** `plans[]` `{name, price, period?, description?, features[], cta,
  featured?}`. Mark one `featured:true`.
- **Copy:** 3–6 features per plan, each a short phrase.

## testimonials  ·  *voice of customer*
Quotes that build trust.
- **Fields:** `variant` (grid | carousel | single), `items[]` `{quote, author, role?,
  avatar?, rating?}`.
- **Copy:** quote 1–3 sentences, specific not generic. Avatar optional (`placeholder`
  if none). Don't invent quotes — ask the customer or omit.

## team  ·  *the people, optional*
Member cards with photo, role, bio, socials.
- **Fields:** `members[]` `{name, role, bio?, photo?, socials?}`.
- Photos are real assets; use `placeholder` portraits if missing but flag to customer.

## faq  ·  *objection handling*
Accordion of common questions. Cheap trust + great for SEO.
- **Fields:** `items[]` `{q, a}`. 4–8 items ideal.
- **Copy:** answer in 1–3 sentences. Write real questions a buyer would ask.

## cta  ·  *conversion push, often near end*
A focused band with a heading and the main action.
- **Fields:** `heading` (required), `subheading?`, `primaryCta` (required),
  `secondaryCta?`. Defaults to `background:"primary"`.

## contact  ·  *required-ish, usually last*
Form + details. Pulls email/phone/address from top-level `contact{}`.
- **Fields:** `showForm`, `formFields[]` (name|email|phone|company|message|subject),
  `showDetails`.
- Keep forms short: name + email + message converts best.
