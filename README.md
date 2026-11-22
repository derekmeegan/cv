My virtual resume and personal website :)

## Gallery

`/gallery` hangs pieces I like on a wall, arranged after the ensembles at the
Barnes Foundation. Click a piece to look closer and read about it.

### Adding a piece

1. Copy the piece's page URL from the museum's site and add it to
   `src/data/gallery/links.json`.
2. Run `pnpm gallery:sync`.
3. Commit `links.json`, `pieces.json` and the new file(s) in
   `public/images/gallery/pieces/`.

A bare URL is enough for the Met, the Barnes, the Philadelphia Museum of Art
and the Getty. To say more, use an object:

```json
{
  "url": "https://www.getty.edu/art/collection/object/103JNH",
  "about": "Why I like it. Shown in the close-up instead of the museum's text.",
  "frame": "louis"
}
```

| Key                       | What it does                                                                                                                                                                              |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `about`                   | Your own note. Blank lines start new paragraphs.                                                                                                                                          |
| `frame`                   | `louis`, `rocaille`, `salon`, `dutch`, `cassetta`, `reeded` or `plain`. Left out, one is picked from the work's date and school.                                                          |
| `title`, `artist`, `date` | Your wording instead of the museum's.                                                                                                                                                     |
| `realFrame`               | When a museum publishes a photo of the work in its actual frame (the Getty often does), that photo is used. `false` uses a rendered frame instead; `"mask"` is for carved, wavy outlines. |

The de Young and the Legion of Honor sit behind a bot check, so the script
cannot read famsf.org. For those (or any other museum) give the facts yourself
in a `piece` object with an `imageUrl` — the existing San Francisco entries in
`links.json` show the shape.

To remove a piece, delete its entry and run the sync again. The wall re-hangs
itself around whatever is in the list.

Downloaded originals are cached in `.cache/gallery/` (git-ignored). Museum
image hosts rate-limit; if one answers with a "try again later" page the
script waits and retries, and a second run picks up anything it missed.

### Frames

The mouldings are rendered by `scripts/gallery/frames.py` (Python 3 with numpy
and Pillow): `pnpm gallery:frames` rebuilds all of them, or pass style names
to rebuild some.
