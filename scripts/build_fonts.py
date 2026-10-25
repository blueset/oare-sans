# /// script
# requires-python = ">=3.10"
# dependencies = ["fonttools[woff]"]
# ///

import argparse
import shutil
import tempfile
from pathlib import Path

from fontTools.ttLib.woff2 import compress

import ufo_export_post_processing as postprocessor


def package_fonts(build_dir, output_dir, variable_stem, google_fonts_ttf):
    for directory in ("variable", "ttf", "otf", "woff2"):
        (output_dir / directory).mkdir(parents=True, exist_ok=True)

    for extension in ("ttf", "otf"):
        name = f"{variable_stem}.{extension}"
        shutil.copy2(build_dir / name, output_dir / "variable" / name)

    if google_fonts_ttf is not None:
        shutil.copy2(google_fonts_ttf, output_dir / "variable" / google_fonts_ttf.name)

    for source in build_dir.glob("*.ttf"):
        if source.stem != variable_stem:
            shutil.copy2(source, output_dir / "ttf" / source.name)
    for source in build_dir.glob("*.otf"):
        shutil.copy2(source, output_dir / "otf" / source.name)

    for source_dir, destination_dir in (("ttf", "woff2"), ("variable", "variable")):
        for source in (output_dir / source_dir).glob("*.ttf"):
            compress(source, output_dir / destination_dir / f"{source.stem}.woff2")


def main():
    parser = argparse.ArgumentParser(description="Build and package fonts from Designspace/UFO sources.")
    parser.add_argument(
        "designspace",
        type=Path,
        nargs="?",
        default=Path(__file__).resolve().parents[1] / "sources" / "designspace" / "OareSans-Regular.designspace",
    )
    parser.add_argument("--output-dir", type=Path, required=True, help="Destination fonts directory.")
    args = parser.parse_args()
    designspace = args.designspace.resolve(strict=True)

    with tempfile.TemporaryDirectory(prefix="oare-sans-build-") as temp_dir:
        build_dir = Path(temp_dir)
        google_fonts_ttf = postprocessor.build_fonts(designspace, build_dir)
        package_fonts(build_dir, args.output_dir.resolve(), f"{designspace.stem}-VF", google_fonts_ttf)


if __name__ == "__main__":
    main()
