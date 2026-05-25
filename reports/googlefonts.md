## FontSpector report

fontspector version: 1.5.2






## Check results




<details><summary>[9] C:\Users\ilove\Codebase\oare-sans\fonts\variable\OareSans[slnt,wght].ttf</summary>
<div>


<details>
    <summary>⚠️ <b>WARN</b> Check if each glyph has the recommended amount of contours. (contour_count)</summary>
    <div>


> Visually QAing thousands of glyphs by hand is tiring. Most glyphs can only be constructured in a handful of ways. This means a glyph's contour count will only differ slightly amongst different fonts, e.g a 'g' could either be 2 or 3 contours, depending on whether its double story or single story.
> 
> However, a quotedbl should have 2 contours, unless the font belongs to a display family.
> 
> This check currently does not cover variable fonts because there's plenty of alternative ways of constructing glyphs with multiple outlines for each feature in a VarFont. The expected contour count data for this check is currently optimized for the typical construction of glyphs in static fonts.




Original proposal: [https://github.com/fonttools/fontbakery/issues/4829]





- ⚠️ **WARN** This check inspects the glyph outlines and detects the total number of contours in each of them. The expected values are
     inferred from the typical amounts of contours observed in a
     large collection of reference font families. The divergences
     listed below may simply indicate a significantly different
     design on some of your glyphs. On the other hand, some of these
     may flag actual bugs in the font such as glyphs mapped to an
     incorrect codepoint. Please consider reviewing the design and
     codepoint assignment of these to make sure they are correct.


    The following glyphs do not have the recommended number of contours:
* S (U+0053): found 3, expected one of: {5, 1, 2}
* Sacute (U+015A): found 4, expected one of: {6, 3, 2}
* sacute (U+015B): found 4, expected one of: {3, 6, 2}
* scircumflex (U+015D): found 4, expected one of: {3, 2, 6} [code: contour-count]
  
  

</div>
</details>





<details>
    <summary>⚠️ <b>WARN</b> Ensure variable fonts include an avar table. (mandatory_avar_table)</summary>
    <div>


> Most variable fonts should include an avar table to correctly define axes progression rates.
> 
> For example, a weight axis from 0% to 100% doesn't map directly to 100 to 1000, because a 10% progression from 0% may be too much to define the 200, while 90% may be too little to define the 900.
> 
> If the progression rates of axes is linear, this check can be ignored. Fontmake will also skip adding an avar table if the progression rates are linear. However, it is still recommended that designers visually proof each instance is at the expected weight, width etc.




Original proposal: [https://github.com/fonttools/fontbakery/issues/3100]





- ⚠️ **WARN** The font does not include an avar table. [code: missing-avar]
  
  

</div>
</details>





<details>
    <summary>⚠️ <b>WARN</b> Check math signs have the same width. (math_signs_width)</summary>
    <div>


> #,         It is a common practice to have math signs sharing the same width         (preferably the same width as tabular figures accross the entire font family).
> 
> This probably comes from the will to avoid additional tabular math signs knowing that their design can easily share the same width.




Original proposal: [https://github.com/fonttools/fontbakery/issues/3832]





- ⚠️ **WARN** The most common width is 373 among a set of 9  math glyphs.
The following math glyphs have a different width, though:
width=390: plusminus, logicalnot
width=440: equal
width=360: multiply
width=370: divide
width=380: plus
width=420: minus [code: width-outliers]
  
  

</div>
</details>





<details>
    <summary>⚠️ <b>WARN</b> Ensure indic fonts have the Indian Rupee Sign glyph. (rupee)</summary>
    <div>


> Per Bureau of Indian Standards every font supporting one of the official Indian languages needs to include Unicode Character “₹” (U+20B9) Indian Rupee Sign.




Original proposal: [https://github.com/fonttools/fontbakery/issues/2967]





- ⚠️ **WARN** Font is missing the Indian Rupee Sign glyph. Please add a glyph for Indian Rupee Sign (₹) at codepoint U+20B9. [code: missing-rupee]
  
  

</div>
</details>





<details>
    <summary>⚠️ <b>WARN</b> Shapes languages in all GF glyphsets. (googlefonts/glyphsets/shape_languages)</summary>
    <div>


> This check uses a heuristic to determine which GF glyphsets a font supports. Then it checks the font for correct shaping behaviour for all languages in those glyphsets.




Original proposal: [https://github.com/googlefonts/fontbakery/issues/4147]





- ⚠️ **WARN** Warning language shaping:

| Message                                                           | Languages                    |
|-------------------------------------------------------------------|------------------------------|
| Auxiliary orthography codepoints:                                 | * de_Latn (German)           |
|   The following auxiliary characters are missing from the font: ſ | * fr_Latn (French)           |
| Auxiliary orthography codepoints:                                 | * lt_Latn (Lithuanian)       |
|   The following auxiliary characters are missing from the font: Ẽ |                              |
|   The following auxiliary characters are missing from the font: ẽ |                              |
| Auxiliary orthography codepoints:                                 | * nb_Latn (Norwegian Bokmål) |
|   The following auxiliary characters are missing from the font: Ŋ |                              |
|   The following auxiliary characters are missing from the font: Ŧ |                              |
|   The following auxiliary characters are missing from the font: ŋ |                              |
|   The following auxiliary characters are missing from the font: ŧ |                              |
| Auxiliary orthography codepoints:                                 | * fi_Latn (Finnish)          |
|   The following auxiliary characters are missing from the font: Ǥ |                              |
|   The following auxiliary characters are missing from the font: Ŋ |                              |
|   The following auxiliary characters are missing from the font: Ŧ |                              |
|   The following auxiliary characters are missing from the font: Ʒ |                              |
|   The following auxiliary characters are missing from the font: Ǯ |                              |
|   The following auxiliary characters are missing from the font: ǥ |                              |
|   The following auxiliary characters are missing from the font: ŋ |                              |
|   The following auxiliary characters are missing from the font: ŧ |                              |
|   The following auxiliary characters are missing from the font: ʒ |                              |
|   The following auxiliary characters are missing from the font: ǯ |                              |
| Auxiliary orthography codepoints:                                 | * nl_Latn (Dutch)            |
|   The following auxiliary characters are missing from the font: Ĳ |                              |
|   The following auxiliary characters are missing from the font: ĳ |                              | [code: warning-language-shaping]
  
  

</div>
</details>





<details>
    <summary>⚠️ <b>WARN</b> Are there any misaligned on-curve points? (outline_alignment_miss)</summary>
    <div>


> This check heuristically looks for on-curve points which are close to, but do not sit on, significant boundary coordinates. For example, a point which has a Y-coordinate of 1 or -1 might be a misplaced baseline point. As well as the baseline, here we also check for points near the x-height (but only for lowercase Latin letters), cap-height, ascender and descender Y coordinates.
> 
> Not all such misaligned curve points are a mistake, and sometimes the design may call for points in locations near the boundaries. As this check is liable to generate significant numbers of false positives, it will pass if there are more than 100 reported misalignments.




Original proposal: [https://github.com/fonttools/fontbakery/pull/3088]





- ⚠️ **WARN** The following glyphs have on-curve points which have potentially incorrect y coordinates:

* - dollar (U+0024): X=318.5,Y=698 (should be at cap-height 700?)
* - ampersand (U+0026): X=247,Y=-2 (should be at baseline 0?)
* - S (U+0053): X=318.5,Y=698 (should be at cap-height 700?)
* - gcommaaccent (U+0123): X=239,Y=698.5 (should be at cap-height 700?)
* - Sacute (U+015A): X=318.5,Y=698 (should be at cap-height 700?)
* - Scedilla (U+015E): X=318.5,Y=698 (should be at cap-height 700?)
* - Scaron (U+0160): X=318.5,Y=698 (should be at cap-height 700?)
* - Scommaaccent (U+0218): X=318.5,Y=698 (should be at cap-height 700?)
* - Scircumflex (U+015C): X=318.5,Y=698 (should be at cap-height 700?)
... and 1 others [code: found-misalignments]
  
  

</div>
</details>





<details>
    <summary>⚠️ <b>WARN</b> Check there are no overlapping path segments (overlapping_path_segments)</summary>
    <div>


> Some rasterizers encounter difficulties when rendering glyphs with overlapping path segments.
> 
> A path segment is a section of a path defined by two on-curve points. When two segments share the same coordinates, they are considered overlapping.




Original proposal: [https://github.com/google/fonts/issues/7594#issuecomment-2401909084]





- ⚠️ **WARN** The following glyphs have overlapping path segments:

* B (U+0042): Line(Line { p0: (87.0, 338.0), p1: (87.0, 410.0) }) has the same coordinates as a previous segment.
* X (U+0058): Line(Line { p0: (181.0, 350.0), p1: (271.0, 350.0) }) has the same coordinates as a previous segment.
* X (U+0058): Line(Line { p0: (201.0, 350.0), p1: (291.0, 350.0) }) has the same coordinates as a previous segment.
* x (U+0078): Line(Line { p0: (139.0, 263.0), p1: (225.0, 263.0) }) has the same coordinates as a previous segment.
* x (U+0078): Line(Line { p0: (155.0, 263.0), p1: (241.0, 263.0) }) has the same coordinates as a previous segment.
* dagger (U+2020): Line(Line { p0: (155.0, 534.0), p1: (208.0, 534.0) }) has the same coordinates as a previous segment.
* daggerdbl (U+2021): Line(Line { p0: (155.0, 565.0), p1: (208.0, 565.0) }) has the same coordinates as a previous segment.
* daggerdbl (U+2021): Line(Line { p0: (149.0, 433.0), p1: (214.0, 433.0) }) has the same coordinates as a previous segment.
* daggerdbl (U+2021): Line(Line { p0: (155.0, 300.0), p1: (208.0, 300.0) }) has the same coordinates as a previous segment. [code: overlapping-path-segments]
  
  

</div>
</details>





<details>
    <summary>⚠️ <b>WARN</b> Check variable font instances (googlefonts/fvar_instances)</summary>
    <div>


> Check a font's fvar instance coordinates comply with our guidelines: https://googlefonts.github.io/gf-guide/variable.html#fvar-instances
> 
> This check is skipped for fonts that have a Morph (MORF) axis since we allow users to define their own custom instances.




Original proposal: [https://github.com/fonttools/fontbakery/pull/3800]





- ⚠️ **WARN** fvar instance coordinates for non-wght axes are not the same as the fvar defaults. This may be intentional so please check with the font author:

| Name              | current            | expected         |
|-------------------|--------------------|------------------|
| Thin              | slnt=0, wght=100   | slnt=0, wght=100 |
| Thin Italic       | slnt=-10, wght=100 | slnt=0, wght=100 |
| ExtraLight        | slnt=0, wght=200   | slnt=0, wght=200 |
| ExtraLight Italic | slnt=-10, wght=200 | slnt=0, wght=200 |
| Light             | slnt=0, wght=300   | slnt=0, wght=300 |
| Light Italic      | slnt=-10, wght=300 | slnt=0, wght=300 |
| Regular           | slnt=0, wght=400   | slnt=0, wght=400 |
| Italic            | slnt=-10, wght=400 | slnt=0, wght=400 |
| Medium            | slnt=0, wght=500   | slnt=0, wght=500 |
| Medium Italic     | slnt=-10, wght=500 | slnt=0, wght=500 |
| SemiBold          | slnt=0, wght=600   | slnt=0, wght=600 |
| SemiBold Italic   | slnt=-10, wght=600 | slnt=0, wght=600 |
| Bold              | slnt=0, wght=700   | slnt=0, wght=700 |
| Bold Italic       | slnt=-10, wght=700 | slnt=0, wght=700 |
| ExtraBold         | slnt=0, wght=800   | slnt=0, wght=800 |
| ExtraBold Italic  | slnt=-10, wght=800 | slnt=0, wght=800 |
| Black             | slnt=0, wght=900   | slnt=0, wght=900 |
| Black Italic      | slnt=-10, wght=900 | slnt=0, wght=900 |

 [code: suspicious-fvar-coords]
  
  

</div>
</details>





<details>
    <summary>⚠️ <b>WARN</b> Checking OS/2 achVendID. (googlefonts/vendor_id)</summary>
    <div>


> Microsoft keeps a list of font vendors and their respective contact info. This list is updated regularly and is indexed by a 4-char "Vendor ID" which is stored in the achVendID field of the OS/2 table.
> 
> Registering your ID is not mandatory, but it is a good practice since some applications may display the type designer / type foundry contact info on some dialog and also because that info will be visible on Microsoft's website:
> 
> https://docs.microsoft.com/en-us/typography/vendors/
> 
> This check verifies whether or not a given font's vendor ID is registered in that list or if it has some of the default values used by the most common font editors.
> 
> Each new FontBakery release includes a cached copy of that list of vendor IDs. If you registered recently, you're safe to ignore warnings emitted by this check, since your ID will soon be included in one of our upcoming releases.




Original proposal: [https://github.com/fonttools/fontbakery/issues/3943, https://github.com/fonttools/fontbakery/issues/4829]





- ⚠️ **WARN** OS/2 VendorID value '1A23' is not yet recognized.
If you registered it recently, then it's safe to ignore this warning message. Otherwise, you should set it to your own unique 4 character code, and register it with Microsoft at https://www.microsoft.com/typography/links/vendorlist.aspx
 [code: unknown]
  
  

</div>
</details>


</div>
</details>


<details><summary>[1] C:\Users\ilove\Codebase\oare-sans\fonts\variable</summary>
<div>


<details>
    <summary>⚠️ <b>WARN</b> Check for codepoints not covered by METADATA subsets. (googlefonts/metadata/unreachable_subsetting)</summary>
    <div>


> This check ensures that all encoded glyphs in the font are covered by a subset declared in the METADATA.pb. Google Fonts splits the font into a set of subset fonts based on the contents of the `subsets` field and the subset definitions in the `glyphsets` repository.
> 
> Any encoded glyphs which are not by any of these subset definitions will not be served in the subsetted fonts, and so will be unreachable to the end user.




Original proposal: [https://github.com/fonttools/fontbakery/issues/4097 and https://github.com/fonttools/fontbakery/pull/4273]





- ⚠️ **WARN** C:\Users\ilove\Codebase\oare-sans\fonts\variable\OareSans[slnt,wght].ttf: The following codepoints supported by the font are not covered by any subsets defined in the font's metadata file, and will never be served. You can solve this by either manually adding additional subset declarations to METADATA.pb, or by editing the glyphset definitions.

* U+02D8 BREVE: try adding one of: canadian-aboriginal, yi
* U+02D9 DOT ABOVE: try adding one of: yi, canadian-aboriginal
* U+02DB OGONEK: try adding one of: canadian-aboriginal, yi
* U+0302 COMBINING CIRCUMFLEX ACCENT: try adding one of: cherokee, tifinagh, math, coptic
* U+0306 COMBINING BREVE: try adding one of: tifinagh, old-permic
* U+0307 COMBINING DOT ABOVE: try adding one of: syriac, hebrew, todhri, coptic, duployan, math, canadian-aboriginal, tifinagh, malayalam, tai-le, old-permic
* U+030A COMBINING RING ABOVE: try adding one of: duployan, syriac
* U+030B COMBINING DOUBLE ACUTE ACCENT: try adding one of: cherokee, osage
* U+030C COMBINING CARON: try adding one of: cherokee, tai-le
... and 5 others

Or you can add the above codepoints to one of the subsets supported by the font: latin-ext, latin [code: unreachable-subsetting]
  
  

</div>
</details>


</div>
</details>






### Summary

| ⚠️ WARN | ℹ️ INFO | ✅ PASS | ⏩ SKIP | 
| ---|---|---|---|
| 10 | 7 | 113 | 58 | 
| 5% | 4% | 60% | 31% | 



