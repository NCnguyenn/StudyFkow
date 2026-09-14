# 🎨 Pixel Art Sprite Asset Specification — Lofi Study Room

> **Purpose:** This document is the definitive art direction guide for generating all 24 pixel art sprites used in the AI StudyFlow study room scene. Every sprite MUST follow the Global Art Direction below to ensure visual consistency when composited together by the PixelRoomEngine.
>
> **Target Engine:** Multi-sprite 2.5D parallax renderer (1920×1080 virtual canvas)
>
> **Total Assets:** 24 PNG files (transparent background)

---

## Global Art Direction (MANDATORY for ALL sprites)

> [!IMPORTANT]
> Every single sprite MUST adhere to these rules. Deviating on any sprite will cause visual inconsistency in the final room composition.

### Style
| Property | Value |
|---|---|
| **Art Style** | 16-bit pixel art, hand-crafted retro aesthetic |
| **Mood** | Cozy, warm, lofi hip-hop study room |
| **Color Palette** | Warm earth tones — muted browns, soft creams, dusty pinks, sage greens, warm amber. NO neon, NO saturated primaries |
| **Pixel Density** | Medium detail (not too chunky, not too fine). Each visible pixel should be ~2-4px at native resolution |
| **Outline** | Subtle dark outlines (1px, #2a1f1a or similar dark warm brown). NOT black (#000000) |
| **Anti-aliasing** | Minimal. Pixel edges should be crisp with only subtle dithering for shading |

### Perspective & Lighting
| Property | Value |
|---|---|
| **Viewpoint** | Eye-level, seated at desk, looking slightly forward (straight-on, NOT isometric, NOT top-down) |
| **Primary Light (Right)** | Warm amber desk lamp glow from the lower-left area of the scene. Color: `#FFD59E` to `#FFAA44` |
| **Secondary Light (Left)** | Cool twilight/window light from the center-upper area. Color: `#8BAFD4` to `#A3C4E8` |
| **Shadow Direction** | Shadows fall to the lower-right (opposite of primary window light source) |
| **Shadow Color** | Deep warm purple-brown `#3D2B3A`, NOT pure black |

### File Format
| Property | Value |
|---|---|
| **Format** | PNG-32 (32-bit with alpha transparency) |
| **Background** | Fully transparent (alpha = 0) |
| **Color Space** | sRGB |
| **Max File Size** | ≤30KB per sprite (target total ≤500KB for all 24) |

### Color Palette Reference

```
WOOD & FURNITURE:
  Light wood:    #C4A46E, #D4B87A
  Medium wood:   #8B6914, #9E7B2A
  Dark wood:     #5C3D1E, #4A2F14

WALL & SURFACES:
  Warm cream:    #F5E6D0, #EDD8C0
  Dusty pink:    #D4A59A, #C99088
  Soft beige:    #E8D5C0, #DCC8B0

FABRIC & TEXTILES:
  Curtain cream: #E8DDD0, #F0E5D8
  Cushion warm:  #C07050, #D08060

PLANTS & NATURE:
  Leaf green:    #5A8C5A, #6B9E6B
  Dark foliage:  #3D6B3D, #2E5530
  Pot terracotta:#B06040, #C07050

SKY & WINDOW:
  Day sky blue:  #87CEEB, #A3D4F0
  Sunset amber:  #FF9955, #FFBB77
  Night deep:    #1A1A3E, #2D2D5E
  Moon silver:   #E0E8F0, #C8D4E0

METALS & ACCENTS:
  Lamp brass:    #C4A035, #D4B045
  Warm amber:    #FFD59E, #FFAA44
  Cool steel:    #8898A8, #7A8A9A

PAPER & STATIONERY:
  Paper white:   #F8F0E8, #FFFAF4
  Sticky yellow: #FFF3B0, #FFED8A
  Sticky pink:   #FFB8C8, #FF9DB5
  Sticky blue:   #B0D8F0, #8EC8E8
```

---

## Room Layout Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  WALL (full background, 1920×1080)                             │
│                                                                 │
│  ┌──────────┐                    ┌───────────────┐   ┌───────┐ │
│  │BOOKSHELF │  ┌──────────────┐  │  WINDOW_SCENE │   │ CLOCK │ │
│  │          │  │  CORKBOARD   │  │  WINDOW_FRAME │   └───────┘ │
│  │ BOOKS_1  │  │ STICKY_NOTES │  │ CURTAIN  CURT │  ┌────────┐│
│  │ BOOKS_2  │  └──────────────┘  └───────────────┘  │CALENDAR││
│  └──────────┘        POSTER_1        PLANT_HANGING  │POSTER_2││
│                                                      └────────┘│
│━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│  ┌─── DESK SURFACE ──────────────────────────────────────────┐ │
│  │ DESK_LAMP  LAPTOP    NOTEBOOK  COFFEE  PENCILS  PLANT_SM  │ │
│  │                                         HEADPHONES        │ │
│  └───────────────────────────────────────────────────────────┘ │
│  ════════════════ DESK_EDGE ════════════════════════════════   │
│                                                                 │
│  PLANT_LARGE (foreground, bottom-left corner)                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Sprite Specifications (24 Assets)

### LAYER 0 — Background (Depth 0.0)

---

#### #1 · `wall.png`
| Property | Value |
|---|---|
| **Name** | Room Wall & Floor Background |
| **Filename** | `wall.png` |
| **Canvas Size** | 1920 × 1080 px |
| **Position** | x: 0, y: 0 |
| **Depth** | 0.0 (farthest — almost no parallax movement) |
| **zIndex** | 0 |

**Description:**
A full-frame pixel art background showing the interior of a cozy study room. This is the foundation layer — everything else sits on top of it.

**Visual Details:**
- **Upper 60% (Wall):** Warm cream-beige wall (`#F5E6D0`) with very subtle aged texture and faint horizontal shadow line where wall meets desk level. A few very faint cracks or paint variations for character.
- **Lower 40% (Below desk line):** Darker warm wood floor visible at the very bottom, oak-toned planks (`#8B6914`) running horizontally with subtle grain lines.
- **Corner perspective:** Slight perspective convergence — the left wall edge and right wall edge hint at the room being a corner/nook. NOT flat — should feel like sitting inside a space.
- **Lighting baked in:** Gentle warm ambient glow from the left-center area (where window will be placed). Right side slightly darker/cooler.
- **NO furniture drawn** — wall is empty. All furniture is separate sprites overlaid on top.

---

### LAYER 1 — Window Area (Depth 0.08–0.18)

---

#### #2 · `window_scene_day.png`
| Property | Value |
|---|---|
| **Name** | Window View — Daytime |
| **Filename** | `window_scene_day.png` |
| **Canvas Size** | 420 × 340 px |
| **Position** | x: 720, y: 60 |
| **Depth** | 0.08 |
| **zIndex** | 1 |

**Description:**
The scenic view visible through the window during daytime hours (6:00–18:00).

**Visual Details:**
- A soft pixel art landscape: fluffy clouds in a light blue sky (`#87CEEB`), distant green treetops (`#5A8C5A`), warm golden sunlight (`#FFD59E`) filtering through.
- Horizon sits at roughly 60% height of the sprite.
- Painterly, dreamy quality — NOT photorealistic. Think lo-fi album cover background.
- Edges should be clean (this sits behind the window frame).
- Subtle warm sunset glow at the bottom edge hinting at golden hour.

---

#### #3 · `window_scene_night.png`
| Property | Value |
|---|---|
| **Name** | Window View — Nighttime |
| **Filename** | `window_scene_night.png` |
| **Canvas Size** | 420 × 340 px |
| **Position** | x: 720, y: 60 |
| **Depth** | 0.08 |
| **zIndex** | 1 |

**Description:**
The scenic view visible through the window during nighttime hours (18:00–6:00). Swapped in dynamically by the engine.

**Visual Details:**
- Deep indigo-navy sky (`#1A1A3E` to `#2D2D5E` gradient, top to bottom).
- A crescent moon (`#E0E8F0`) in the upper-left corner with a soft pixel glow.
- 8–12 twinkling stars scattered across the sky (small single-pixel or 2×2 dots in white/pale yellow).
- Distant city silhouette at the bottom (`#2A2A4A`) with a few tiny warm yellow window lights (`#FFD59E`) to indicate buildings.
- Calm, serene mood. Should feel peaceful for late-night study sessions.

---

#### #4 · `window_frame.png`
| Property | Value |
|---|---|
| **Name** | Window Frame |
| **Filename** | `window_frame.png` |
| **Canvas Size** | 460 × 380 px |
| **Position** | x: 700, y: 40 |
| **Depth** | 0.15 |
| **zIndex** | 2 |

**Description:**
A wooden window frame that overlays on top of the window scene, creating the physical window structure.

**Visual Details:**
- Classic double-pane wooden window frame in medium warm wood (`#9E7B2A`).
- 4 panes (2×2 grid) divided by thin wooden cross bars.
- Frame thickness: ~20px pixel art width.
- Subtle wood grain texture in the frame.
- Slight 3D beveling — inner edge has a 1px lighter highlight (`#C4A46E`), outer edge has a 1px darker shadow.
- The 4 glass panes should be **fully transparent** (alpha = 0) — the window_scene sprite shows through them.

---

#### #5 · `curtain_left.png`
| Property | Value |
|---|---|
| **Name** | Left Curtain |
| **Filename** | `curtain_left.png` |
| **Canvas Size** | 80 × 400 px |
| **Position** | x: 680, y: 30 |
| **Depth** | 0.18 |
| **zIndex** | 3 |

**Description:**
A fabric curtain hanging on the left side of the window. Animates with gentle `wind` swaying.

**Visual Details:**
- Soft cream/off-white fabric (`#E8DDD0`) with very subtle vertical fold lines.
- Hung from the top — gathered/bunched at the top, flowing downward.
- Gentle curve/drape shape — NOT a straight rectangle.
- Subtle warm shadow on the inner fold side (`#D4C4B0`).
- Bottom edge slightly uneven/natural-looking.
- Width tapers slightly from top (wider, bunched) to bottom (narrower, hanging).

---

#### #6 · `curtain_right.png`
| Property | Value |
|---|---|
| **Name** | Right Curtain |
| **Filename** | `curtain_right.png` |
| **Canvas Size** | 80 × 400 px |
| **Position** | x: 1100, y: 30 |
| **Depth** | 0.18 |
| **zIndex** | 3 |

**Description:**
Mirror of the left curtain, hanging on the right side of the window.

**Visual Details:**
- Same fabric, same color, same style as `curtain_left.png`.
- **Horizontally mirrored** drape direction — folds face the opposite way.
- Shadow falls on the opposite fold side to maintain consistent lighting.

---

### LAYER 2 — Wall Decorations (Depth 0.20–0.25)

---

#### #7 · `bookshelf.png`
| Property | Value |
|---|---|
| **Name** | Bookshelf |
| **Filename** | `bookshelf.png` |
| **Canvas Size** | 260 × 450 px |
| **Position** | x: 60, y: 120 |
| **Depth** | 0.22 |
| **zIndex** | 5 |
| **Interactive** | Click → `/planning` |

**Description:**
A tall standing wooden bookshelf against the left wall. Holds books, small decorative items, and a few trinkets.

**Visual Details:**
- Dark warm wood (`#5C3D1E`) with 4 horizontal shelves.
- Overall shape: slightly taller than wide, rectangular.
- Shelves have slight perspective — front edges slightly wider than back edges.
- Back panel slightly lighter (`#8B6914`) to show depth.
- A few decorative items on shelves: a small globe, a tiny framed photo, a ceramic vase.
- Empty spaces on shelves where the separate `books_group` sprites will sit (leave gaps at the positions where books_group1 and books_group2 will be placed).

---

#### #8 · `books_group1.png`
| Property | Value |
|---|---|
| **Name** | Book Stack — Upper Shelf |
| **Filename** | `books_group1.png` |
| **Canvas Size** | 100 × 120 px |
| **Position** | x: 80, y: 160 |
| **Depth** | 0.25 |
| **zIndex** | 6 |
| **Interactive** | Click → `/planning` |

**Description:**
A small cluster of books standing upright on the upper shelf of the bookshelf.

**Visual Details:**
- 5–6 books of varying heights standing upright, leaning slightly against each other.
- Book spine colors: dusty red (`#B05040`), sage green (`#6B9E6B`), muted blue (`#5A7A9A`), warm cream (`#E8D5C0`), faded gold (`#C4A035`).
- One book slightly pulled out from the row.
- Subtle title text on spines (just 1-2px horizontal lines to suggest text, not readable).
- Books have slight worn/vintage feel.

---

#### #9 · `books_group2.png`
| Property | Value |
|---|---|
| **Name** | Book Stack — Lower Shelf |
| **Filename** | `books_group2.png` |
| **Canvas Size** | 100 × 100 px |
| **Position** | x: 80, y: 320 |
| **Depth** | 0.25 |
| **zIndex** | 6 |
| **Interactive** | Click → `/planning` |

**Description:**
A messier group of books on the lower shelf — some lying flat, one open.

**Visual Details:**
- 3–4 books: two stacked horizontally, one standing, one slightly open face-down.
- Colors complementary but different from group1: navy (`#3A4A6A`), dusty orange (`#C08050`), pale lavender (`#B0A0C0`), dark green (`#3D6B3D`).
- More casual arrangement — looks like actively-used study books.
- Slightly smaller and more compact than books_group1.

---

#### #10 · `corkboard.png`
| Property | Value |
|---|---|
| **Name** | Corkboard |
| **Filename** | `corkboard.png` |
| **Canvas Size** | 260 × 200 px |
| **Position** | x: 380, y: 100 |
| **Depth** | 0.20 |
| **zIndex** | 4 |
| **Interactive** | Click → `/tasks` |

**Description:**
A rectangular corkboard mounted on the wall above the desk area, between the bookshelf and window.

**Visual Details:**
- Cork surface in warm sandy-brown (`#C4A070`) with subtle speckled texture.
- Thin dark wood frame (`#5C3D1E`), ~6px wide.
- 3–4 colorful pushpins visible (red, blue, yellow, green — small 3×3px dots).
- 1–2 small pinned papers/photos (just simple rectangular shapes in white/cream).
- A thin piece of string/ribbon pinned across one corner with a tiny photo clipped to it.
- The `sticky_notes` sprite will overlay on top of this.

---

#### #11 · `sticky_notes.png`
| Property | Value |
|---|---|
| **Name** | Sticky Notes |
| **Filename** | `sticky_notes.png` |
| **Canvas Size** | 200 × 140 px |
| **Position** | x: 400, y: 130 |
| **Depth** | 0.24 |
| **zIndex** | 7 |
| **Interactive** | Click → `/tasks` |

**Description:**
A cluster of 3–4 pastel sticky notes pinned/stuck onto the corkboard, slightly overlapping.

**Visual Details:**
- 3–4 square sticky notes in pastel colors:
  - Pale yellow (`#FFF3B0`)
  - Soft pink (`#FFB8C8`)
  - Light blue (`#B0D8F0`)
  - Optional: mint green (`#B0E8C8`)
- Each note slightly tilted at different angles (±5° to ±15°).
- Tiny scribbled text lines (1px horizontal lines in pencil gray `#888888`) suggesting handwritten to-do items.
- One note has a small heart or star doodle in the corner.
- Corner curls on 1–2 notes (classic sticky note peel).
- Subtle shadow beneath each note (`#3D2B3A` at 20% opacity).

---

#### #12 · `clock.png`
| Property | Value |
|---|---|
| **Name** | Wall Clock |
| **Filename** | `clock.png` |
| **Canvas Size** | 120 × 120 px |
| **Position** | x: 1300, y: 80 |
| **Depth** | 0.18 |
| **zIndex** | 5 |
| **Interactive** | Click → `/focus` |

**Description:**
A classic round wall clock mounted on the wall to the right of the window.

**Visual Details:**
- Circular clock face with thin dark wood frame (`#5C3D1E`).
- Clock face: warm cream (`#FFFAF4`).
- Simple hour markers: 12 small dots or short lines around the edge.
- Hour and minute hands in dark warm brown (`#2a1f1a`), showing approximately 10:10 (classic display time).
- Tiny red second hand (optional, 1px).
- Small shadow beneath the clock on the wall.
- Classic, timeless design — NOT digital, NOT modern/minimalist.

---

#### #13 · `calendar.png`
| Property | Value |
|---|---|
| **Name** | Wall Calendar |
| **Filename** | `calendar.png` |
| **Canvas Size** | 140 × 180 px |
| **Position** | x: 1480, y: 160 |
| **Depth** | 0.20 |
| **zIndex** | 5 |
| **Interactive** | Click → `/insights` |

**Description:**
A hanging wall calendar on the right side of the room.

**Visual Details:**
- Rectangular hanging calendar with a small hole/string at the top for hanging.
- Upper half: a small cute pixel art illustration (a tiny landscape, cat, or seasonal motif).
- Lower half: calendar grid with tiny squares suggesting dates. Current date circled in red.
- Paper color: warm white (`#F8F0E8`).
- Subtle page curl at the bottom-right corner.
- Thin wire binding or staple line between the image and grid sections.

---

#### #14 · `plant_hanging.png`
| Property | Value |
|---|---|
| **Name** | Hanging Plant (Ivy / Pothos) |
| **Filename** | `plant_hanging.png` |
| **Canvas Size** | 160 × 200 px |
| **Position** | x: 1200, y: 20 |
| **Depth** | 0.22 |
| **zIndex** | 4 |

**Description:**
A trailing/hanging plant (pothos or ivy) suspended from the ceiling or a high shelf near the window.

**Visual Details:**
- Small terracotta or white ceramic pot (`#B06040` or `#E8DDD0`) at the top.
- Trailing vines cascading downward with heart-shaped leaves in multiple shades of green (`#5A8C5A`, `#6B9E6B`, `#3D6B3D`).
- Vines drape naturally — some shorter, some longer, creating an organic silhouette.
- 15–20 visible leaves of varying sizes.
- Slight variation in leaf color (newer leaves lighter, older leaves darker).
- The vine tendrils create a sense of life and movement.

---

#### #15 · `poster_1.png` *(bonus — included in the 24 count)*
| Property | Value |
|---|---|
| **Name** | Wall Poster 1 — Retro Art |
| **Filename** | `poster_1.png` |
| **Canvas Size** | 120 × 160 px |
| **Position** | x: 400, y: 30 (above corkboard) |
| **Depth** | 0.20 |
| **zIndex** | 4 |

**Description:**
A small decorative poster on the wall above the corkboard area.

**Visual Details:**
- Retro anime or lofi album cover style art in a thin dark frame.
- Muted warm color palette (dusty reds, teals, golds).
- Simple geometric or character illustration (suggestion: a cozy cat reading a book, or a sunset mountain scene).
- Frame: thin dark wood (`#4A2F14`), ~3px wide.

---

#### #16 · `poster_2.png` *(bonus — included in the 24 count)*
| Property | Value |
|---|---|
| **Name** | Wall Poster 2 — Motivational |
| **Filename** | `poster_2.png` |
| **Canvas Size** | 100 × 140 px |
| **Position** | x: 1550, y: 60 (right wall) |
| **Depth** | 0.20 |
| **zIndex** | 4 |

**Description:**
A smaller poster on the right-side wall area.

**Visual Details:**
- A pixel art landscape print: misty mountains or a forest path.
- Dreamy muted blues and greens.
- Simple thin frame in light wood (`#C4A46E`).
- Slightly tilted (1–2° clockwise) for a casual, lived-in feel.

---

### LAYER 3 — Desk (Depth 0.45)

---

#### #17 · `desk.png`
| Property | Value |
|---|---|
| **Name** | Desk Surface |
| **Filename** | `desk.png` |
| **Canvas Size** | 1720 × 280 px |
| **Position** | x: 100, y: 580 |
| **Depth** | 0.45 |
| **zIndex** | 10 |

**Description:**
The main wooden desk surface spanning most of the room width. This is the primary working surface where all desk items sit.

**Visual Details:**
- Wide wooden desk surface in medium-warm wood (`#9E7B2A` to `#C4A46E`).
- Subtle horizontal wood grain lines running left to right.
- Visible front face/thickness (~40px tall) at the bottom edge, showing the desk is a 3D object with thickness.
- Front face slightly darker (`#8B6914`) to indicate shadow under the desk surface.
- 2–3 desk drawers visible on the front face (right side) with tiny brass knob handles (`#C4A035`).
- Left side may show a small open shelf section under the desk.
- Top surface has a subtle sheen/highlight line near the front edge to indicate polished wood.
- NO items drawn on the desk surface — those are separate sprites.

---

### LAYER 4 — Desk Items (Depth 0.55–0.62)

---

#### #18 · `desk_lamp.png`
| Property | Value |
|---|---|
| **Name** | Desk Lamp |
| **Filename** | `desk_lamp.png` |
| **Canvas Size** | 120 × 180 px |
| **Position** | x: 180, y: 440 |
| **Depth** | 0.55 |
| **zIndex** | 15 |

**Description:**
A classic adjustable desk lamp sitting on the left side of the desk. Primary warm light source.

**Visual Details:**
- Classic anglepoise or banker's lamp style.
- Brass/gold metal arm and base (`#C4A035`, `#D4B045`).
- Lamp shade: warm amber tone, shaped like a cone or dome.
- **Warm glow effect:** The underside of the shade emits a visible warm amber glow (`#FFD59E`) — paint 4–6 semi-transparent amber pixels below the shade to suggest light spilling out.
- Articulated arm with visible joint/hinge.
- Heavy circular or rectangular base for stability.
- The lamp is ON — it's actively casting light.

---

#### #19 · `laptop.png`
| Property | Value |
|---|---|
| **Name** | Laptop Computer |
| **Filename** | `laptop.png` |
| **Canvas Size** | 360 × 200 px |
| **Position** | x: 480, y: 480 |
| **Depth** | 0.55 |
| **zIndex** | 14 |
| **Interactive** | Click → `/notes` |

**Description:**
An open laptop computer, center of the desk. The primary study tool.

**Visual Details:**
- Modern laptop opened at ~120° angle.
- Screen displaying a soft blue-white code editor or note-taking interface (just colored rectangles to suggest UI — sidebar in dark gray, main area in light blue-white, a few colored lines suggesting text/code).
- Screen emits a subtle cool light glow (`#A3C4E8`) on the keyboard area below.
- Keyboard area: dark gray (`#4A4A5A`) with tiny lighter squares suggesting keys.
- Thin bezels around the screen in dark silver/gray.
- Small trackpad visible below the keyboard.
- Body color: space gray or silver (`#8898A8`).

---

#### #20 · `notebook.png`
| Property | Value |
|---|---|
| **Name** | Open Notebook |
| **Filename** | `notebook.png` |
| **Canvas Size** | 160 × 100 px |
| **Position** | x: 900, y: 560 |
| **Depth** | 0.58 |
| **zIndex** | 13 |
| **Interactive** | Click → `/notes` |

**Description:**
An open spiral notebook with handwritten notes, sitting to the right of the laptop.

**Visual Details:**
- Open notebook showing two pages (left and right spread).
- Paper color: warm white (`#FFFAF4`) with faint blue horizontal ruled lines.
- Spiral binding visible along the center spine (small circles in silver `#A0A8B0`).
- Left page: several lines of "handwritten" text (tiny gray/dark blue scribbles, 1px lines).
- Right page: a small diagram or mind-map sketch with circles and connecting lines.
- A pencil or pen lying diagonally across one page (yellow pencil `#FFD700` with dark tip).
- Slightly dog-eared corner on one page.

---

#### #21 · `coffee_mug.png`
| Property | Value |
|---|---|
| **Name** | Coffee Mug |
| **Filename** | `coffee_mug.png` |
| **Canvas Size** | 80 × 90 px |
| **Position** | x: 1120, y: 540 |
| **Depth** | 0.60 |
| **zIndex** | 16 |

**Description:**
A ceramic coffee mug. The steam particle system renders above this sprite.

**Visual Details:**
- Round ceramic mug in warm cream (`#E8D5C0`) or dusty rose (`#D4A59A`).
- C-shaped handle on the right side.
- Filled with dark brown coffee (`#3A2A1A`), visible from above (slight 3/4 view into the mug).
- A tiny heart or cat face design on the front of the mug (optional cute detail).
- NO steam drawn — the ParticleCanvas system handles steam rendering above this sprite.
- Small coaster or stain ring beneath (optional).

---

#### #22 · `pencils.png`
| Property | Value |
|---|---|
| **Name** | Pencil Cup / Pen Holder |
| **Filename** | `pencils.png` |
| **Canvas Size** | 60 × 120 px |
| **Position** | x: 1260, y: 520 |
| **Depth** | 0.58 |
| **zIndex** | 14 |

**Description:**
A small cup or holder with pens and pencils standing upright.

**Visual Details:**
- Cylindrical cup/holder in muted blue ceramic (`#5A7A9A`) or terracotta (`#B06040`).
- 4–5 writing instruments poking out at slightly different angles:
  - Yellow pencil (`#FFD700`) with dark tip
  - Blue pen (`#4A6A9A`)
  - Red pen (`#B05040`)
  - Black fine-liner (`#2A2A2A`)
  - Optional: a small ruler or paintbrush
- Instruments extend about 60% above the cup rim.
- Simple, compact composition.

---

#### #23 · `headphones.png`
| Property | Value |
|---|---|
| **Name** | Headphones |
| **Filename** | `headphones.png` |
| **Canvas Size** | 120 × 80 px |
| **Position** | x: 1400, y: 540 |
| **Depth** | 0.60 |
| **zIndex** | 13 |

**Description:**
A pair of over-ear headphones resting on the desk surface.

**Visual Details:**
- Classic over-ear headphones lying flat/slightly angled on the desk.
- Color: matte dark gray (`#4A4A5A`) or warm brown leather (`#8B6914`).
- Visible headband arc and two circular ear cups.
- Soft cushion padding visible on the ear cups (slightly lighter shade).
- Coiled cable trailing off to one side (thin dark line).
- Subtle highlight on the headband curve to show 3D form.

---

#### #24 · `plant_small.png`
| Property | Value |
|---|---|
| **Name** | Small Desk Plant |
| **Filename** | `plant_small.png` |
| **Canvas Size** | 100 × 130 px |
| **Position** | x: 1560, y: 490 |
| **Depth** | 0.62 |
| **zIndex** | 15 |

**Description:**
A small potted plant sitting on the right edge of the desk. Adds life and color.

**Visual Details:**
- Small terracotta pot (`#B06040`) with a subtle rim.
- Plant type: a cute succulent, small cactus, or a tiny fiddle-leaf fig.
- 3–5 visible leaves or fronds in varied greens (`#5A8C5A`, `#6B9E6B`).
- Soil visible at the base inside the pot (dark brown `#4A2F14`).
- Compact and charming — a "desk friend" plant.
- Slight asymmetry in leaf arrangement for natural look.

---

### LAYER 5 — Foreground (Depth 0.80–0.85)

---

#### #25 · `desk_edge.png`
| Property | Value |
|---|---|
| **Name** | Desk Front Edge |
| **Filename** | `desk_edge.png` |
| **Canvas Size** | 1800 × 60 px |
| **Position** | x: 60, y: 820 |
| **Depth** | 0.80 |
| **zIndex** | 20 |

**Description:**
The very front edge of the desk, closest to the viewer. This creates a strong foreground framing element.

**Visual Details:**
- A long, thin horizontal bar of warm dark wood (`#5C3D1E` to `#8B6914`).
- Subtle rounded edge profile on the top surface (1px highlight).
- Wood grain running horizontally.
- This creates the "you are sitting HERE" spatial anchor for the viewer.
- Slightly darker than the main desk surface to indicate it's in shadow (below the desk surface level).

---

#### #26 · `plant_large.png`
| Property | Value |
|---|---|
| **Name** | Large Floor Plant |
| **Filename** | `plant_large.png` |
| **Canvas Size** | 200 × 350 px |
| **Position** | x: 20, y: 650 |
| **Depth** | 0.85 (nearest — strongest parallax) |
| **zIndex** | 22 |

**Description:**
A large potted floor plant in the bottom-left foreground corner. The closest object to the viewer — moves the most during parallax.

**Visual Details:**
- Large ceramic or woven basket pot (`#B06040` or `#9E7B2A`) sitting on the floor.
- Plant type: Monstera deliciosa or large-leaf tropical plant.
- 6–8 large leaves fanning outward, some with characteristic monstera split holes.
- Multiple shades of green: young leaves lighter (`#6B9E6B`), mature leaves deeper (`#3D6B3D`), with subtle vein lines.
- Some leaves extend toward the viewer (overlapping the desk edge) for strong depth effect.
- Pot has visible soil surface with a few small pebbles or moss.
- Overall silhouette is lush, organic, and slightly asymmetric.

---

## Checklist Summary

| # | Filename | Size (px) | Layer | Depth | Interactive |
|---|---|---|---|---|---|
| 1 | `wall.png` | 1920×1080 | Background | 0.00 | — |
| 2 | `window_scene_day.png` | 420×340 | Window | 0.08 | — |
| 3 | `window_scene_night.png` | 420×340 | Window | 0.08 | — |
| 4 | `window_frame.png` | 460×380 | Window | 0.15 | — |
| 5 | `curtain_left.png` | 80×400 | Window | 0.18 | — |
| 6 | `curtain_right.png` | 80×400 | Window | 0.18 | — |
| 7 | `bookshelf.png` | 260×450 | Wall | 0.22 | `/planning` |
| 8 | `books_group1.png` | 100×120 | Wall | 0.25 | `/planning` |
| 9 | `books_group2.png` | 100×100 | Wall | 0.25 | `/planning` |
| 10 | `corkboard.png` | 260×200 | Wall | 0.20 | `/tasks` |
| 11 | `sticky_notes.png` | 200×140 | Wall | 0.24 | `/tasks` |
| 12 | `clock.png` | 120×120 | Wall | 0.18 | `/focus` |
| 13 | `calendar.png` | 140×180 | Wall | 0.20 | `/insights` |
| 14 | `plant_hanging.png` | 160×200 | Wall | 0.22 | — |
| 15 | `poster_1.png` | 120×160 | Wall | 0.20 | — |
| 16 | `poster_2.png` | 100×140 | Wall | 0.20 | — |
| 17 | `desk.png` | 1720×280 | Desk | 0.45 | — |
| 18 | `desk_lamp.png` | 120×180 | Desk Item | 0.55 | — |
| 19 | `laptop.png` | 360×200 | Desk Item | 0.55 | `/notes` |
| 20 | `notebook.png` | 160×100 | Desk Item | 0.58 | `/notes` |
| 21 | `coffee_mug.png` | 80×90 | Desk Item | 0.60 | — |
| 22 | `pencils.png` | 60×120 | Desk Item | 0.58 | — |
| 23 | `headphones.png` | 120×80 | Desk Item | 0.60 | — |
| 24 | `plant_small.png` | 100×130 | Desk Item | 0.62 | — |
| 25 | `desk_edge.png` | 1800×60 | Foreground | 0.80 | — |
| 26 | `plant_large.png` | 200×350 | Foreground | 0.85 | — |

> [!NOTE]
> The manifest in code lists 24 entries. Items #15 (`poster_1.png`) and #16 (`poster_2.png`) are bonus additions to fill wall space. If you want exactly 24 sprites, you may omit these two and add them to the `SpriteManifest.ts` later.

---

## AI Prompt Template

Use this template for each sprite when generating with AI image tools (Midjourney, DALL-E 3, Google Imagen, Leonardo.ai):

```
[OBJECT DESCRIPTION from above], 16-bit pixel art style, lofi hip hop
cozy study room aesthetic. Warm earth tone color palette (browns, creams,
sage greens, dusty pinks, warm amber). Subtle dark warm-brown outlines.
Eye-level seated perspective. Primary warm amber light from lower-left,
secondary cool twilight blue light from upper-center. Shadow color:
deep warm purple-brown. Isolated single object on a pure solid white
background. No ground shadow. No extra objects. PNG transparent
background ready.
```

> [!TIP]
> After generating each sprite on a white background, use [remove.bg](https://remove.bg) or Photoshop's "Select Subject → Delete Background" to get a clean transparent PNG.
