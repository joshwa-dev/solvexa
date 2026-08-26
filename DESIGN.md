# DESIGN.md — Solvexa Design System

> **SOURCE OF TRUTH**: Extracted directly from Stitch project ID `14465645273595186570` ("Solvexa: Signal Flow"). All values take precedence over guesswork.

---

## 1. Brand Identity

- **Product**: Solvexa
- **Tagline**: YOUR WORLD. YOUR SIGNAL.
- **Design Theme**: SIGNAL FLOW (V3)
- **Color Mode**: Dark (primary), Light (optional)
- **Aesthetic**: Cinematic Glassmorphism x Corporate Modern
- **Philosophy**: "Human-first Technical" — UI is a silent gallery for content

---

## 2. Colors

### 2.1 Brand Override Colors
| Role | Hex | Usage |
|------|-----|-------|
| Primary Accent | `#8b5cf6` | Electric Violet — high-intent actions |
| Secondary Accent | `#3b82f6` | Electric Blue — supporting actions |
| Tertiary Accent | `#06b6d4` | Cyan — metadata, status |
| Neutral Base | `#0a0a0b` | Deepest background |

### 2.2 Material Color Tokens
| Token | Hex |
|-------|-----|
| primary | #d0bcff |
| on-primary | #3c0091 |
| primary-container | #a078ff |
| on-primary-container | #340080 |
| primary-fixed | #e9ddff |
| primary-fixed-dim | #d0bcff |
| on-primary-fixed | #23005c |
| on-primary-fixed-variant | #5516be |
| inverse-primary | #6d3bd7 |
| secondary | #adc6ff |
| on-secondary | #002e6a |
| secondary-container | #0566d9 |
| on-secondary-container | #e6ecff |
| secondary-fixed | #d8e2ff |
| secondary-fixed-dim | #adc6ff |
| on-secondary-fixed | #001a42 |
| on-secondary-fixed-variant | #004395 |
| tertiary | #4cd7f6 |
| on-tertiary | #003640 |
| tertiary-container | #009eb9 |
| on-tertiary-container | #002f38 |
| tertiary-fixed | #acedff |
| tertiary-fixed-dim | #4cd7f6 |
| on-tertiary-fixed | #001f26 |
| on-tertiary-fixed-variant | #004e5c |
| error | #ffb4ab |
| on-error | #690005 |
| error-container | #93000a |
| on-error-container | #ffdad6 |
| surface | #131314 |
| surface-dim | #131314 |
| surface-bright | #3a393a |
| surface-container-lowest | #0e0e0f |
| surface-container-low | #1c1b1c |
| surface-container | #201f20 |
| surface-container-high | #2a2a2b |
| surface-container-highest | #353436 |
| on-surface | #e5e2e3 |
| on-surface-variant | #cbc3d7 |
| inverse-surface | #e5e2e3 |
| inverse-on-surface | #313031 |
| outline | #958ea0 |
| outline-variant | #494454 |
| surface-tint | #d0bcff |
| surface-variant | #353436 |
| background | #131314 |
| on-background | #e5e2e3 |

### 2.3 Base Layers
- **Body bg**: `#0A0A0B` (slightly deeper than token)
- **Card bg**: `#141416`
- **Surface**: `#131314`

### 2.4 Gradients
| Name | Value | Usage |
|------|-------|-------|
| Primary CTA | `linear-gradient(to right, #7a00ff, #0066ff)` | Create button |
| Primary CTA Alt | `from-[#a078ff] to-[#0566d9]` | Nav CTA |
| Brand Wordmark | `from-primary-container to-secondary-container` | "Solvexa" logo |
| Story Ring Active | `from-tertiary to-primary-container` (tr) | Active Orbit rings |

---

## 3. Typography

**Font**: Inter (all weights 400-800, Google Fonts)

| Token | Size | Line-H | Weight | Letter-Spacing | Usage |
|-------|------|--------|--------|----------------|-------|
| display-lg | 48px | 56px | 800 | -0.04em | Desktop hero |
| display-lg-mobile | 32px | 38px | 800 | -0.02em | Mobile hero |
| headline-md | 24px | 32px | 700 | -0.01em | Section headers |
| creator-name | 18px | 24px | 600 | — | Usernames |
| body-md | 16px | 26px | 400 | — | Post content |
| metadata-sm | 13px | 18px | 500 | +0.02em | Timestamps, counts |
| label-caps | 11px | 16px | 700 | +0.1em | Uppercase chips |

---

## 4. Spacing

Base unit: 4px
| Token | Value |
|-------|-------|
| xs | 4px |
| sm | 8px |
| md | 16px |
| lg | 24px |
| xl | 40px |
| gutter | 20px |
| margin-mobile | 16px |
| margin-desktop | 64px |

---

## 5. Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| DEFAULT | 4px (0.25rem) | Tight elements |
| lg | 8px (0.5rem) | Standard cards |
| xl | 12px (0.75rem) | Media containers |
| 2xl | 16px (inline) | Large cinematic cards |
| full | 9999px | Buttons, avatars, pills |

---

## 6. Borders

| Type | Value |
|------|-------|
| Ghost Outline | `1px solid rgba(255,255,255,0.08)` |
| Ghost Hover | `1px solid rgba(255,255,255,0.15)` |
| Nav Sidebar | `border-r border-white/10` |
| Header | `border-b border-white/[0.08]` |
| Active Nav Item | `border-r-2 border-primary-container` |
| Input Inactive | `border-b-2 border-transparent` |
| Input Focus | `border-b-2 border-tertiary` |

---

## 7. Shadows & Glows

| Name | Value | Usage |
|------|-------|-------|
| Signal Glow animated | `0 0 15px rgba(160,120,255,0.3)` ? `0 0 25px rgba(160,120,255,0.6)` | Pulsing elements |
| Signal Glow static | `0 0 15px 0 rgba(160,120,255,0.3)` | Always-on glow |
| Nav Shadow | `shadow-[0_0_15px_rgba(160,120,255,0.15)]` | Sidebar |
| CTA Shadow | `shadow-[0_4px_20px_rgba(160,120,255,0.4)]` | Primary buttons |

---

## 8. Custom CSS Classes (from Stitch)

```css
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 15px rgba(160,120,255,0.3); }
  50%       { box-shadow: 0 0 25px rgba(160,120,255,0.6); }
}
.signal-glow { animation: pulse-glow 2s infinite; }

.glass-panel {
  background-color: rgba(20,20,22,0.6);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.08);
}

.cinematic-card {
  background-color: #141416;
  border: 1px solid transparent;
  transition: all 0.3s ease;
}
.cinematic-card:hover {
  border-color: rgba(255,255,255,0.15);
  transform: scale(1.02);
}

.ghost-outline { border: 1px solid rgba(255,255,255,0.08); }

.hide-scrollbar::-webkit-scrollbar { display: none; }
.hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

body { background-color: #0A0A0B; color: #e5e2e3; }
```

---

## 9. Motion

| Pattern | Value |
|---------|-------|
| Standard transition | `transition-all duration-300` |
| Hover scale | `hover:scale-105` |
| Active press | `active:scale-95` |
| Icon hover | `group-hover:scale-110` |
| Moment image zoom | `duration-500` |
| Signal pulse | 2s infinite pulse-glow keyframe |

---

## 10. Icons

Library: Material Symbols Outlined (Google Fonts)

### Navigation Icons
| Destination | Icon |
|-------------|------|
| Pulse | sensors (filled active) |
| Explore | explore |
| Create | add_circle |
| Messages | mail |
| Nexus | person_pin |

### Action Icons
| Action | Icon |
|--------|------|
| Signal | sensors (filled) |
| Comment | chat_bubble / chat_bubble_outline |
| Share | share |
| Save | bookmark / bookmark_border |
| Search | search |
| Notifications | notifications |
| Settings | settings |
| More | more_horiz |
| Location | location_on |
| Music | music_note |
| Trending | trending_up |
| Follow | add |
| Feed | dynamic_feed |

---

## 11. Components

### 11.1 Primary CTA Button
```
bg-gradient-to-r from-[#7a00ff] to-[#0066ff]
text-white font-semibold
py-3 px-4 rounded-full
hover:scale-105 transition-transform
shadow-[0_4px_20px_rgba(160,120,255,0.4)]
```

### 11.2 Signal Chip
```
px-3 py-1 rounded-full
bg-black/40 backdrop-blur-md
border border-tertiary/50
font-label-caps text-tertiary
```
Contains: `w-2 h-2 bg-tertiary rounded-full signal-glow`

### 11.3 Topic Pill
```
px-md py-xs rounded-full
bg-surface/30 backdrop-blur-md
ghost-outline
font-metadata-sm text-primary
hover:bg-white/10
```

### 11.4 Input
```
border-b-2 border-transparent (inactive)
border-b-2 border-tertiary (focus)
bg-surface-container-high
rounded-t-DEFAULT
pl-10 pr-4 py-2
outline-none
```

### 11.5 Cinematic Post Card
- bg: #141416, border: transparent ? white/15 on hover, scale(1.02) on hover
- rounded-2xl overflow-hidden

### 11.6 Avatars
| Size | Diameter |
|------|----------|
| XS | 24px |
| SM | 40px |
| MD | 48px |
| LG | 50px |
| XL | 64px |

Active ring: `bg-gradient-to-tr from-tertiary to-primary-container p-[2px] rounded-full signal-glow`

### 11.7 Moment Tiles
- Size: `w-32 h-48 rounded-xl`
- "Your Moment": glass panel with `+` icon
- Others: gradient overlay bottom-fade

### 11.8 Desktop Sidebar
```
w-64 h-screen fixed left-0 top-0
bg-surface/80 backdrop-blur-2xl
border-r border-white/[0.08]
shadow-[0_0_15px_rgba(160,120,255,0.15)]
py-xl px-md z-50
```

### 11.9 Top App Bar
```
h-16 px-margin-desktop
fixed top-0 w-[calc(100%-16rem)]
bg-surface/60 backdrop-blur-2xl
border-b border-white/[0.08]
```

---

## 12. Layout

### Desktop
- Sidebar: 256px fixed left
- Top bar: 64px fixed top, calc(100% - 256px)
- Content: ml-64 mt-16
- Max width: 1600px centered
- Grid: 1fr + 350px right sidebar (lg+)
- External margins: 64px

### Mobile
- No sidebar
- Bottom tab bar (fixed)
- Page margins: 16px
- Media: edge-to-edge

---

## 13. Screens from Stitch

| Screen | Key Layout |
|--------|-----------|
| Pulse Feed | Sidebar + Top Bar + Feed Column + Right Column |
| Signals Video | Full-screen immersive, right action panel, bottom creator info |
| Nexus Profile | Cover + Avatar + Stats + Identity Cards + Content Tabs |
| Explore | Search + Trending chips + Masonry grid + Spaces |

---

## 14. Solvexa Vocabulary

| Term | Meaning |
|------|---------|
| Pulse | Main social feed |
| Signal | Primary interaction (typed like) |
| Moments | 24-hour ephemeral content |
| Signals (video) | Short-form vertical video |
| Explore | Discovery hub |
| Spaces | Communities |
| Nexus | User profile |
| Orbit | Connections visualization |
| Signal Map | Trending visualization |
| Context Share | Contextualized sharing with message |
| Identity Cards | Profile badges/roles |
| Nodes | Space/topic suggestions |

---
*Extracted from Stitch project 14465645273595186570 on 2026-08-17*
