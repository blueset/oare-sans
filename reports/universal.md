## FontSpector report

fontspector version: 1.5.2






## Check results




<details><summary>[5] C:\Users\ilove\Codebase\oare-sans\fonts\variable\OareSans-Regular-VF.ttf</summary>
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
* Sacute (U+015A): found 4, expected one of: {3, 6, 2}
* sacute (U+015B): found 4, expected one of: {2, 3, 6}
* scircumflex (U+015D): found 4, expected one of: {3, 6, 2} [code: contour-count]
  
  

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
width=360: multiply
width=370: divide
width=380: plus
width=420: minus
width=440: equal [code: width-outliers]
  
  

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
    <summary>⚠️ <b>WARN</b> Checking that the typoAscender exceeds the yMax of the /Agrave. (typoascender_exceeds_Agrave)</summary>
    <div>


> MacOS uses OS/2.sTypoAscender/Descender values to determine the line height of a font. If the sTypoAscender value is smaller than the maximum height of the uppercase /Agrave, the font’s sTypoAscender value is ignored, and a very tall line height is used instead.
> 
> This happens on a per-font, per-style basis, so it’s possible for a font to have a good sTypoAscender value in one style but not in another. This can lead to inconsistent line heights across a typeface family.
> 
> So, it is important to ensure that the sTypoAscender value is greater than the maximum height of the uppercase /Agrave in all styles of a type family.




Original proposal: [https://github.com/fonttools/fontbakery/issues/3170]





- ⚠️ **WARN** OS/2.sTypoAscender value should be greater than 845, but got 735 instead [code: typoAscender]
  
  

</div>
</details>


</div>
</details>






### Summary

| ⚠️ WARN | ℹ️ INFO | ✅ PASS | ⏩ SKIP | 
| ---|---|---|---|
| 5 | 1 | 87 | 26 | 
| 4% | 1% | 73% | 22% | 



