import shutil
import subprocess
import sys
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
        for platform, suffix in (("win32", ".exe"), ("linux", ""), ("darwin", "")):
            for tool in ("uv", "uvx"):
                with (
                    self.subTest(platform=platform, tool=tool),
                    patch.object(shutil, "which", return_value=None),
                    patch.object(sys, "platform", platform),
                ):
                    command = postprocessor.uv_command(tool)

                    self.assertEqual(Path(command).parent, postprocessor.UV_BIN_DIR)
                    self.assertEqual(Path(command).name, tool + suffix)

    def test_builds_both_flavors_and_returns_google_fonts_path(self):
        designspace = (
            Path(__file__).resolve().parents[1]
            / "sources" / "designspace" / "OareSans-Regular.designspace"
        )
        for enabled in (True, False):
            config = postprocessor.load_google_fonts_config(designspace)
            config["enabled"] = enabled
            with (
                self.subTest(google_fonts_enabled=enabled),
                tempfile.TemporaryDirectory() as temp_dir,
                patch.object(postprocessor, "load_google_fonts_config", return_value=config),
                patch.object(shutil, "which", side_effect=lambda tool: f"/tools/{tool}"),
                patch.object(subprocess, "run") as run,
            ):
                run.return_value = subprocess.CompletedProcess([], 0, "", "")
                build_dir = Path(temp_dir) / "build"
                google_fonts_ttf = postprocessor.build_fonts(designspace, build_dir)

                self.assertTrue((build_dir / designspace.name).is_file())
                commands = [call.args[0] for call in run.call_args_list]
                outputs = [
                    command[command.index("--output") + 1]
                    for command in commands if "--output" in command
                ]
                self.assertEqual(
                    outputs,
                    ["variable", "variable-cff2", "ttf"] + (["variable"] if enabled else []),
                )
                self.assertIn("otf-cff2", commands[2])
                if enabled:
                    expected = build_dir / "google-fonts" / "OareSans[slnt,wght].ttf"
                    self.assertEqual(google_fonts_ttf, expected)
                    self.assertEqual(commands[-1][0], "/tools/uv")
                    self.assertEqual(commands[-1][-2], str(expected))
                else:
                    self.assertIsNone(google_fonts_ttf)
                    self.assertEqual(len(commands), 3)

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
