# Oare Sans animations

Looping promo videos for Instagram, built with [Remotion](https://www.remotion.dev/). Every
composition renders at **1080 × 1440** (3:4, Instagram's native feed/grid ratio) and uses the
variable font from `../fonts/variable/`, so all weights and slants are real axis values.

| ID                 | Idea                                                         | Length | FPS |
| ------------------ | ------------------------------------------------------------ | ------ | --- |
| `WorldLanguages`   | “World” in 16 languages, each at a different weight/slant    | 14.4 s | 30  |
| `SplitFlap`        | Departure board flipping between four messages and weights   | 14 s   | 60  |
| `SpotlightRipple`  | A spotlight sweeps a pangram grid, raising weight and slant  | 10 s   | 30  |
| `FitToWidth`       | Resizable text box; each word solves its weight to fit       | 10 s   | 30  |
| `SpeedLean`        | Words race across; slant follows their speed                 | 8 s    | 30  |
| `Stacked3D`        | 36 layers from Thin (front) to Black (back) rotating in 3D   | 10 s   | 30  |
| `LetterPattern`    | Grid of S / a / g / & driven by weight and slant waves       | 10 s   | 30  |
| `LettersAsWindows` | Colour seen through the letters as they thin to slits        | 8 s    | 30  |
| `Flagger`          | The embed page’s flag: typing, shuffling, picking the icon   | 16.0 s | 30  |

All videos loop seamlessly.

## Usage

```sh
npm install
npm run dev                          # Remotion Studio for previewing and tweaking props
npm run render                       # render everything to out/<ID>.mp4
npm run render -- SplitFlap Stacked3D  # render only some compositions
npm run typecheck
```

`dev` and `render` copy the variable WOFF2 into `public/fonts/` first, so rebuild the font and
re-run to pick up changes. The first render downloads Chrome Headless Shell.

## Customising

- **Canvas size**: `src/lib/constants.ts` (`WIDTH`, `HEIGHT`, `MARGIN`). For 4:5 (1080 × 1350) or
  Reels/Stories (1080 × 1920), most layouts adapt, but check each in Studio: `SpotlightRipple`
  has fixed `TOP`/`BOTTOM` rows, and `LetterPattern` expects the size to be a multiple of `CELL`.
- **Props** (editable in Studio):
  - `Stacked3D` has `word`.
  - `LettersAsWindows` has `lines` and `videoSrc`. Put a clip in `public/` and set
    `videoSrc` to its file name to show footage through the letters instead of the generated
    gradients.
- **Text and colours**: constants at the top of each file in `src/compositions/`.
- **Flagger**: the typed/shuffled word pairs, weights, icons and hold times are the `FIRST`,
  `SHUFFLES` and `HERO` constants in `Flagger.tsx`, and the timeline is rebuilt from them.
  Icon artwork lives in `src/lib/flagIcons.ts`; new icons should come from the same set,
  Fluent UI System Icons Filled (`fluent:*-24-filled` on Iconify), and every icon there appears
  in the picker. The flag size is solved from the widest pair, so longer words make everything
  smaller.

## License

Remotion is free for individuals and small teams; larger companies need a
[company license](https://www.remotion.dev/license).
