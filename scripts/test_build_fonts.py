import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import ufo_export_post_processing as postprocessor


class BuildFontsTests(unittest.TestCase):
    def test_fontmake_uses_uvx_from_path(self):
        with (
            patch.object(shutil, "which", return_value="/tools/uvx"),
            patch.object(subprocess, "run") as run,
        ):
            run.return_value = subprocess.CompletedProcess([], 0, "", "")
            postprocessor.run_fontmake(Path("source.designspace"), Path("build"), ["ttf"])

        self.assertEqual(run.call_args.args[0][0], "/tools/uvx")

    def test_metadata_patcher_uses_uv_from_path(self):
        with (
            patch.object(shutil, "which", return_value="/tools/uv"),
            patch.object(subprocess, "run") as run,
        ):
            run.return_value = subprocess.CompletedProcess([], 0, "", "")
            postprocessor.apply_google_fonts_flavor(Path("font.ttf"), {})

        self.assertEqual(run.call_args.args[0][0], "/tools/uv")

    def test_fontlab_can_find_uv_without_path(self):
        with patch.object(shutil, "which", return_value=None):
            command = postprocessor.uv_command("uv")

        self.assertEqual(Path(command).parent, postprocessor.UV_BIN_DIR)
        self.assertIn(Path(command).name, ("uv", "uv.exe"))

    def test_packages_same_font_layout_as_update_script(self):
        from build_fonts import package_fonts
        from fontTools.ttLib import TTFont

        reference = Path(__file__).resolve().parents[1] / "fonts" / "variable"
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            build = root / "build"
            build.mkdir()
            for name in ("OareSans-Regular-VF.ttf", "OareSans-Regular-VF.otf"):
                shutil.copy2(reference / name, build / name)
            shutil.copy2(reference / "OareSans-Regular-VF.ttf", build / "OareSans-Regular.ttf")
            shutil.copy2(reference / "OareSans-Regular-VF.otf", build / "OareSans-Regular.otf")
            google_fonts = build / "google-fonts" / "OareSans[slnt,wght].ttf"
            google_fonts.parent.mkdir()
            shutil.copy2(reference / google_fonts.name, google_fonts)

            output = root / "fonts"
            package_fonts(build, output, "OareSans-Regular-VF", google_fonts)

            self.assertEqual(
                {path.relative_to(output).as_posix() for path in output.rglob("*") if path.is_file()},
                {
                    "variable/OareSans-Regular-VF.ttf",
                    "variable/OareSans-Regular-VF.otf",
                    "variable/OareSans-Regular-VF.woff2",
                    "variable/OareSans[slnt,wght].ttf",
                    "variable/OareSans[slnt,wght].woff2",
                    "ttf/OareSans-Regular.ttf",
                    "otf/OareSans-Regular.otf",
                    "otf/OareSans-Regular-VF.otf",
                    "woff2/OareSans-Regular.woff2",
                },
            )
            for path in output.rglob("*.woff2"):
                with TTFont(path) as font:
                    self.assertEqual(font.flavor, "woff2")
                    self.assertIn("cmap", font)


if __name__ == "__main__":
    unittest.main()
