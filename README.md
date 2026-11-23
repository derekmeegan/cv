My virtual resume and personal website :)

## Link preview

Sharing the site's address shows the D m mark, and in Messages on iOS and
macOS the mark moves: the three figures do a wave. That is an `og:video` tag
pointing straight at a short MP4 (`public/images/preview/dm.mp4`), which
Messages plays muted on a loop; everywhere else shows the still
(`dm.png`). `pnpm preview:render` rebuilds both from `public/logo.svg`
(needs ffmpeg). Messages caches a preview by its address, so after changing
the animation rename the files and update the paths in `src/app/layout.tsx`.

Articles keep their own picture as their preview.

## Writing

`/writing` lists my articles and `/writing/<slug>` renders each one on this
site, with a link back to where it was first published.

- **Medium** posts come from the Medium feed when the site is built, so a new
  post appears on the next deploy with nothing to do here.
- **Browserbase** posts have no feed, so their copy is stored in the repo:
  `src/data/articles/browserbase.json`, with the pictures in
  `public/images/articles/`.

`pnpm articles:sync` refreshes both. To add a Browserbase post, put its URL
in `src/data/articles/links.json` and run it. It also saves a snapshot of the
Medium feed (`medium.json`), which the site falls back on if the feed cannot
be reached and which keeps posts that have dropped off the feed (Medium only
carries the latest ten) — so run it now and then.

The stored files are plain data and can be edited by hand. The typography is
in `src/app/(site)/writing/article.css`.

## Gallery

`/gallery` is pieces I like, floating on the page: frame against frame,
fitted together like a collage, each picture keeping its own proportions,
with a little ironwork in among them. Click a piece and the whole hang comes
toward you, with the piece on one side and its label on the other.

### Adding a piece

1. Copy the piece's page URL from the museum's site and add it to
   `src/data/gallery/links.json`.
2. Run `pnpm gallery:sync`.
3. Commit `links.json`, `pieces.json` and the new file(s) in
   `public/images/gallery/pieces/`.

A bare URL is enough for the Met, the Barnes, the Philadelphia Museum of Art
and the Getty: the script reads the image, the facts and (where the museum
publishes one) the description from the page. The Barnes, the Getty and most
PMA pages carry a description; the Met's data does not, so those need a note
of your own. To say more, use an object:

```json
{
  "url": "https://www.getty.edu/art/collection/object/103JNH",
  "about": "Why I like it. Shown in the close-up instead of the museum's description.",
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
itself around whatever is in the list (`src/lib/gallery-layout.ts` packs it;
the wall's shape, the gap between frames and how strongly real size shows are
the numbers at the top of that file).

Downloaded originals are cached in `.cache/gallery/` (git-ignored). Museum
image hosts rate-limit; if one answers with a "try again later" page the
script waits and retries, and a second run picks up anything it missed.

### Frames

The mouldings are rendered by `scripts/gallery/frames.py` (Python 3 with numpy
and Pillow): `pnpm gallery:frames` rebuilds all of them, or pass style names
to rebuild some.
