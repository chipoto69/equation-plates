---
name: mobile-plate
description: Cut an equation plate for a phone, not a desktop window. Use when a register is desktop-only, hover-only, or missing a cold plate URL.
replaces: vellum-cut
note: vellum-cut is not a layout skill in this workspace. This is the related cut.
---

# Mobile plate

The plate is the screen. The ledger is the thumb.

1. Viewport fit cover. Safe-area insets on the bar and the colophon.
2. Under 720px the stage is one column. Plate is full-bleed. Ledger sits under it, 44px rows.
3. No hover-only state. Pointer, focus-visible, and active all reveal the gilt.
4. Body type at least 16px on small screens so iOS does not zoom the field.
5. Cold address `/p/:id` and `/archive` rewrite to index.html. Assets are not rewritten.
6. `prefers-reduced-motion` skips the draw-in. Touch does not require a pointer trail.
7. New plates append to plates.json. The layout does not change.
