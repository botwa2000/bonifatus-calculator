# „Was ist fair?“ — Bonifatus Reels

Vertical videos for Instagram Reels (also usable on TikTok / YouTube Shorts). On Instagram,
only Reels reach people who do not already follow the account; feed posts do not.

| File                                 | Promotes                                                    | Length |
| ------------------------------------ | ----------------------------------------------------------- | ------ |
| `01_gerecht-heisst-nicht-gleich.mp4` | https://bonifatus.com/de/ratgeber/geschwister-gerechtigkeit | 19.3 s |
| `02_faires-zeugnisgeld.mp4`          | https://bonifatus.com/de/ratgeber/zeugnisgeld               | 18.5 s |
| `03_belohnen-ohne-geld.mp4`          | https://bonifatus.com/de/ratgeber/belohnen-ohne-geld        | 19.9 s |

`covers/*.jpg` is frame 0 of each episode (the hook), for the Reels cover picker.

Format, fixed for every episode: 1080×1920, 30 fps, H.264 + AAC, 15–20 s, German.
The text carries everything (most viewing is muted); the soundtrack is a bonus.

## How the pipeline works

```
scripts/social/copy.ts      videos.<episode>  — the words, as a list of beats
scripts/make-social-video.ts                  — beats → frames → ffmpeg (+ synthesised audio)
scripts/social/render.ts                      — every glyph via Pango + bundled Geist fonts
```

- **Text** is rendered by Pango from the TTFs in `scripts/social/fonts/`, never a system font,
  so umlauts and „…" cannot silently degrade. `assertNoTransliteration` also scans video copy.
- **Timing is derived, not hand-tuned.** After a beat's last element has appeared, it holds
  for `0.9 s + 0.26 s per word` (sources count half). The episode is refused if the total
  falls outside 15–20 s. If it is too long, **cut words** — do not shorten the reading time.
- **Layout contract** (checked on every render): essential text stays inside the Reels safe
  zone x 80–1000, y 270–1250 (Meta: keep the top 14 % and bottom 35 % clear); nothing is
  smaller than 32 px. The series pill sits above the safe zone on purpose — it is branding.
- **Frame 0 shows the hook**, so muted autoplay and the cover both show the question.
- **Audio** is synthesised from the beat timeline (no samples, no licences). The sonic logo
  on the end card — a suspended chord resolving — is identical in every episode. Keep it.

Beat kinds: `hook` (first), `compare`, `statement`, `stat`, `bars`, `list`, `end` (last).
Each one's fields are documented on the `VideoBeat` type in `scripts/social/copy.ts`.

## Adding episode 4

1. **Pick one live Ratgeber page** (`content/ratgeber/de/<slug>.ts`). Every figure on screen
   must appear on that page, with the page's source. If you cannot point to the sentence,
   cut the figure. Keep the page's own caveats (e.g. „unsere Einschätzung“).
2. **No real child data.** No names, no real report cards — fictional examples only.
3. In `scripts/social/copy.ts`, add a field to `Copy['videos']` and write the beats in `de`
   — four beats is the practical maximum for 20 s: hook → one point → evidence → end.
   Put a `// §"<section heading>"` comment above each figure so a reviewer can check it.
4. In `scripts/make-social-video.ts`, add one line to `EPISODES`:
   `{ n: 4, slug: 'kurzer-titel', band: C.<colour>, copy: (c) => c.videos.<field> }`
   — use the band colour of the page's Pinterest pin so pin and video match.
5. Render: `npx tsx scripts/make-social-video.ts 4`. It prints each beat's length and
   reading time; fix any contract error it throws.
6. **Watch it.** Extract frames and read each one at full size:
   ```
   ffmpeg -ss <t> -i docs/social-content/videos/was-ist-fair/04_….mp4 -frames:v 1 f.png
   ```
   at 0 s, each beat once it has settled (the script prints beat starts), and the last
   frame (`-sseof -0.1`). Check: diacritics, no clipping, `bonifatus.com` on the last frame.
   Delete the extracted frames afterwards.
7. Commit the copy, the `EPISODES` line, the `.mp4` and its cover.

## Publishing

Nothing here posts anything. The social runner (`lalabuba/queue.yaml`) only accepts
Instagram `image` / `images` (.jpg) today, so Reels are posted by hand until it supports
video. A person approves every post; no script writes `approved:`.
