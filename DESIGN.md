# Design System Specification: Technical Precision & Neon Depth

## 1. Overview & Creative North Star
### The Creative North Star: "The Digital Obsidian Lab"
This design system moves beyond the standard "Dark Mode" template to create a high-end, technical sanctuary for scientific exploration. It is rooted in the concept of **Technical Obsidian**—a deep, slate-black environment where data doesn't just sit on a screen, but glows with vital information. 

By utilizing intentional asymmetry, high-contrast typography, and layered surfaces, we break the "boxed-in" feel of traditional dashboards. The UI is designed to feel like a high-precision instrument—cool, calculated, and responsive—where neon accents (Primary Green and Secondary Blue) act as signals of life and activity within a static, data-rich void.

---

## 2. Colors: Tonal Depth & Radiant Accents
The palette is engineered for maximum readability in low-light environments while maintaining a "premium-scientific" aesthetic.

### Core Palette
- **Deep Void (Background):** `#0a0e14` – The absolute base, providing the canvas for luminescence.
- **Neon Primary:** `#9effc8` – Used for "Live" states, success markers, and primary actions.
- **Data Secondary:** `#7c98ff` – Used for molecular bonds, interactive links, and technical data points.
- **Warning Tertiary:** `#ff7350` – Reserved for specific chemical alerts or high-importance variances.

### The "No-Line" & Surface Rule
*   **Prohibit 1px solid borders for sectioning.** Instead, define boundaries through background color shifts. Use `surface-container-low` for sections resting on the `background`.
*   **Surface Hierarchy:** Depth is created through nesting. 
    *   *Lowest:* `surface-container-lowest` (#000000) for deep-set, recessed areas like 3D viewports.
    *   *Mid:* `surface-container` (#151a21) for standard cards.
    *   *Highest:* `surface-container-highest` (#20262f) for floating menus or active state highlights.
*   **The Glass & Gradient Rule:** For main CTAs or "Active" headers, use a subtle linear gradient from `primary` (#9effc8) to `primary-container` (#1dfba5). For floating overlays, apply a `backdrop-blur` of 12px with a 60% opacity `surface-variant`.

---

## 3. Typography: Monospace Intelligence
We pair the geometric rationality of **Space Grotesk** with the functional clarity of **Inter**.

| Level | Font Family | Size | Character |
| :--- | :--- | :--- | :--- |
| **Display** | Space Grotesk | 3.5rem | High-impact, technical brutalism. |
| **Headline** | Space Grotesk | 1.5rem - 2rem | Section entry points; uppercase for technical sub-headers. |
| **Title** | Inter | 1rem - 1.375rem | Information architecture and card titles. |
| **Body** | Inter | 0.875rem | High-readability data strings. |
| **Label** | Space Grotesk | 0.75rem | Monospace-influenced metadata, labels, and small badges. |

**Editorial Note:** Use wide letter-spacing (0.05em) for `label-sm` and `label-md` when used in uppercase to enhance the "instrumentation" feel.

---

## 4. Elevation & Depth: Tonal Layering
In this system, light doesn't hit the UI; the UI emits light.

*   **The Layering Principle:** Avoid drop shadows for structural elements. Use `surface-container-low` (#0f141a) as a base and place `surface-container-high` (#1b2028) cards on top. This creates a "milled" look, as if the UI was carved from a single block of obsidian.
*   **Ambient Glow:** For "floating" elements like Tooltips or Modals, use an ambient glow rather than a black shadow. The shadow should be a 5% opacity version of `primary` or `on-surface`, with a blur radius of at least 30px.
*   **The Ghost Border Fallback:** If a container requires a boundary (e.g., in high-density data tables), use a **Ghost Border**: `outline-variant` (#44484f) at 15% opacity. Never use 100% opaque borders.

---

## 5. Components: Precision Primitives

### Buttons & Inputs
*   **Primary Button:** Solid `primary` (#9effc8) background with `on-primary` (#00643e) text. Corner radius: `md` (0.375rem). No shadow; use a 2px inner glow on hover.
*   **Secondary/Ghost Button:** `outline` token at 20% opacity. Text in `secondary`.
*   **Input Fields:** Recessed appearance using `surface-container-lowest`. Labels use `label-md` in uppercase.

### Chips & Status Badges
*   **"LIVE" Badge:** Use `primary-container` background with a pulsed 4px "dot" of `primary`.
*   **Selection Chips:** For scientific toggles (e.g., "Ball-and-Stick"), use `surface-bright` with `sm` (0.125rem) radius for a sharp, machined look.

### Cards & Layouts
*   **Constraint:** Forbid the use of divider lines.
*   **Separation:** Use 24px of vertical whitespace (from the spacing scale) or a slight shift from `surface-container` to `surface-container-low` to distinguish between "Molecule Identity" and "Calculators."

### Specialized Components
*   **The Viewport:** 3D model containers must use `surface-container-lowest` to provide a "deep space" effect, making the molecular bonds (Secondary/Blue) pop.
*   **The Data Key-Value Pair:** Key in `on-surface-variant` (Label-md); Value in `primary_dim` or `on-surface` (Title-sm), right-aligned for numerical scanning.

---

## 6. Do's and Don'ts

### Do
*   **Do** use asymmetrical layouts. A heavy left-hand sidebar paired with a sprawling right-hand viewport creates a sense of professional workstation scale.
*   **Do** use `primary` sparingly. It is a "signal" color, not a decorative one.
*   **Do** use monospace-influenced fonts (Space Grotesk) for all numerical data to ensure column alignment.

### Don't
*   **Don't** use pure white (#FFFFFF). All "white" text should be `on-surface` (#f1f3fc) to prevent eye strain against the dark background.
*   **Don't** use standard `lg` or `xl` border radii for cards. Keep corners tight (`DEFAULT` or `md`) to maintain a serious, technical tone.
*   **Don't** use traditional "Drop Shadows" on cards. Rely on color value shifts between surfaces to communicate hierarchy.