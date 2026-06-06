# Oare Sans

<!-- Version begin -->Version 0.006<!-- Version end -->

> **oare** *n.* [o.ˈa.ɾɛ] moon

**Oare Sans** is a condensed geometric display sans-serif typeface with variable axes for weight and slant. This typeface is an expansion of the [custom logotype created for PSCTF][psctf] from a limited set of letters to cover the GF Latin Core character set, and with variable expansion from Thin to Black and Regular to Oblique. This design was initiated from the desire to create a typeface that would match the initial design of the unconventional letter shapes of S and C. The name “Oare” is also named after the [Luna CTFd theme][luna] commissioned by the same team.

[psctf]: https://1a23.com/works/design/project-sekai-ctf/
[luna]: https://1a23.com/works/open-source/luna-for-ctfd/

![Banner](./documentation/Banner.png)
![Styles](./documentation/Styles.png)
![Poster 1: Thin Oblique](./documentation/Poster1.png)
![Poster 2: Waterfall](./documentation/Poster2.png)
![Poster 3: Black](./documentation/Poster3.png)
![Poster 4: Stylistic Set](./documentation/Poster4.png)

## OpenType Features

- Kerning `kern`, Ligautures `liga`, Ordinals `ordn`, Glyph Composition/Decomposition `ccmp`
- Localized Forms `locl`: Moldavian `MOL`, Romanian `ROU`, Turkish `TUR`, Dutch `NLD`, and Catalan `CAT`
- Case-Sensitive Forms `case`
- Tabular Figures `tnum`
- Stylistic Sets
  - `ss01`: Alternative J
  - `ss02`: Single story a
  - `ss03`: Alternative S and 5 (Symmetrical S)
  - `ss04`: Alternative S and 5 (Asymmetrical S)

## Download

- [Variable Font](./fonts/variable/)
  - `OareSans-Regular-VF`: Default flavor
  - `OareSans[slnt,wght]`: Google Fonts flavor with metadata optimized for Google Fonts
- [Static TTF](./fonts/ttf/)
- [Static OTF](./fonts/otf/)
- [Static WOFF2](./fonts/woff2/)

## Changelog

- v0.006:
  - Added feature `case` (Case-Sensitive Forms) to glyphs `/hyphen`, `/endash`, `/emdash`, `/guillemotleft`, `/guillemotright`, `/guilsinglleft`, `/guilsinglright`, `/exclamdown`, `/questiondown`, `/colon`, `/asterisk`, and `/at`.
  - Added feature `tnum` (Tabular Figures) to glyphs `/zero` to `/nine`, `/dollar`, `/cent`, `/sterling`, `/yen`, `/Euro`, `/numbersign`, `/plus`, `/minus`, `/equal`, `/multiply`, `/divide`, `/plusminus`, `/less`, `/greater`, `/logicalnot`, `/asciitilde`, `/period`, `/comma`, `/colon`, `/semicolon`, `/slash`, and `/space`.
- v0.005:
  - Extended `ss03` and `ss04` to `/dollar` and `/dollar.through`.
  - Adjusted some kerning pairs.
- v0.004:
  - Adjusted kernings for `/S`, `/S.ss03`, and `/S.ss04`.
- v0.003:
  - Added precomposed glyphs: `/IJ` `/ij` `/IJ.ss01` `/Etilde` `/Ytilde` `/etilde` `/ytilde`
  - Extending `ss01` to `/Jcircumflex.ss01` `/J.ss01`
  - Extending `ss02` to `/agrave.ss02` `/aacute.ss02` `/acircumflex.ss02` `/ordfeminine.ss02`
- v0.002:
  - Adjusted the contour of `/C` in oblique styles.
  - Simplified the contour of `/circumflexcomb`, `/caroncomb`, and `/g_j.liga`.
  - Added `ss02` (Single story `/a/`), `ss03` (Alternative `/S` `/s` `/five` #1), and `ss04` (Alternative `/S` `/s` `/five` #2) stylistic sets.
- v0.001: Initial test release.

## License

> Copyright (c) 2026 Eana Hufwe, 1A23 Studio (https://1A23.studio)
> 
> This Font Software is licensed under the SIL Open Font License, Version 1.1.
> This license is in this repo LICENSE.md, and is also available with a FAQ at:
> https://openfontlicense.org
