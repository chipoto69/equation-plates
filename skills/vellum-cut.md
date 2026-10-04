# vellum-cut

No `vellum-cut` skill exists in chipoto69 or Ydefix. This is the stand-in used for the plate register: cut the sheet to the phone, do not scale the desktop page down.

## Law

- The plate is the sheet. On a phone it is one square, edge to edge inside the safe area, not a thumbnail beside a rail.
- Touch is the primary pointer. Hover gilt is a bonus, never the only reaction.
- Targets are at least 44px. Body type stays 16px so iOS does not zoom the field.
- Canvas backing store is capped on narrow screens (640 to 900px) so the ink still settles without blowing memory.
- Iterate count drops under 760px. `prefers-reduced-motion` still wins.
- Ledger moves under the plate. Archive rows stack. No horizontal scroll.
- Safe-area insets on the sticky bar and the colophon.
- New plates still append to `public/plates.json`. The cut does not change the ledger shape.

Holding-surface tokens stay: ground `#0C0B09`, ink `#E9E5DC`, gilt `#C8A24B` on the equation only.
