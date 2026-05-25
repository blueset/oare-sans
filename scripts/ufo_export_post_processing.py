import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import xml.etree.ElementTree as ET
from pathlib import Path


POSTSCRIPT_NAME_PART_RE = re.compile(r"[^A-Za-z0-9]")
VERSION_STRING_RE = re.compile(
    r"^\s*(?:Version\s+)?(?P<major>\d+)(?P<rest>\.\d+.*)?\s*$",
    re.IGNORECASE,
)

GOOGLE_FONTS_CONFIG_FILENAMES = (
    "google_fonts_flavor.json",
    "google-fonts.json",
)

GOOGLE_FONTS_DESIGNSPACE_LIB_KEY = "studio.1a23.flavors.googleFont"
DEFAULT_VF_DESIGNSPACE_LIB_KEY = "studio.1a23.flavors.defaultVF"

DEFAULT_GOOGLE_FONTS_CONFIG = {
    "enabled": True,
    "output_dir": "google-fonts",
    "output_file": None,
    "sort_output_axis_tags": True,
    "family_name": None,
    "typographic_family_name": None,
    "style_name": "Regular",
    "typographic_style_name": None,
    "full_name": None,
    "postscript_name": None,
    "unique_id": None,
    "version_string": None,
    "public_font_info": {},
    "remove_name_ids": [],
    "instances": {},
    "fvar_instances": [],
    "stat": {
        "axes": [],
        "elided_fallback_name": 2,
        "axis_names": {},
        "axis_value_names": {},
    },
    "hhea": {},
    "os2": {},
    "meta": {},
    "name_records": {},
}

DEFAULT_VF_CONFIG = {
    "enabled": True,
    "stat": {
        "axis_order": [],
        "axis_names": {},
        "axis_value_names": {},
        "linked_values": {},
        "elided_values": {},
        "elided_fallback_name": 2,
    },
}

DESIGNSPACE_V5_FORMAT = "5.0"


def deep_update(base, overrides):
    for key, value in overrides.items():
        if isinstance(value, dict) and isinstance(base.get(key), dict):
            deep_update(base[key], value)
        else:
            base[key] = value
    return base


def plist_value(element):
    if element.tag == "dict":
        return plist_dict(element)
    if element.tag == "array":
        return [plist_value(child) for child in element]
    if element.tag == "true":
        return True
    if element.tag == "false":
        return False
    if element.tag == "integer":
        return int(element.text or 0)
    if element.tag == "real":
        value = float(element.text or 0)
        return int(value) if value.is_integer() else value

    return element.text or ""


def plist_dict(dict_element):
    values = {}
    children = list(dict_element)
    index = 0
    while index < len(children):
        key = children[index]
        if key.tag != "key" or index + 1 >= len(children):
            index += 1
            continue

        values[key.text or ""] = plist_value(children[index + 1])
        index += 2

    return values


def plist_element(value):
    if isinstance(value, dict):
        element = ET.Element("dict")
        for key, child_value in value.items():
            key_element = ET.SubElement(element, "key")
            key_element.text = str(key)
            element.append(plist_element(child_value))
        return element

    if isinstance(value, list):
        element = ET.Element("array")
        for child_value in value:
            element.append(plist_element(child_value))
        return element

    if isinstance(value, bool):
        return ET.Element("true" if value else "false")

    if isinstance(value, int):
        element = ET.Element("integer")
        element.text = str(value)
        return element

    if isinstance(value, float):
        element = ET.Element("real")
        element.text = coordinate_key(value)
        return element

    element = ET.Element("string")
    element.text = "" if value is None else str(value)
    return element


def designspace_lib_value(designspace, lib_key):
    root = ET.parse(designspace).getroot()
    lib_dict = root.find("./lib/dict")
    if lib_dict is None:
        return None

    children = list(lib_dict)
    for index, child in enumerate(children[:-1]):
        if child.tag != "key" or child.text != lib_key:
            continue

        return plist_value(children[index + 1])

    return None


def designspace_google_fonts_config(designspace):
    return designspace_lib_value(designspace, GOOGLE_FONTS_DESIGNSPACE_LIB_KEY)


def load_google_fonts_config(designspace):
    config = json.loads(json.dumps(DEFAULT_GOOGLE_FONTS_CONFIG))
    config_paths = [
        designspace.with_suffix(".googlefonts.json"),
        *(designspace.parent / filename for filename in GOOGLE_FONTS_CONFIG_FILENAMES),
    ]

    for config_path in config_paths:
        if not config_path.exists():
            continue

        with config_path.open("r", encoding="utf-8") as config_file:
            overrides = json.load(config_file)

        if "google_fonts" in overrides:
            overrides = overrides["google_fonts"]

        deep_update(config, overrides)
        print(f"Loaded Google Fonts flavor config: {config_path}")
        break

    designspace_config = designspace_google_fonts_config(designspace)
    if designspace_config:
        deep_update(config, designspace_config)
        print(
            "Loaded Google Fonts flavor config from designspace lib key: "
            f"{GOOGLE_FONTS_DESIGNSPACE_LIB_KEY}"
        )

    return config


def load_default_vf_config(designspace):
    config = json.loads(json.dumps(DEFAULT_VF_CONFIG))
    designspace_config = designspace_lib_value(designspace, DEFAULT_VF_DESIGNSPACE_LIB_KEY)
    if designspace_config:
        deep_update(config, designspace_config)
        print(
            "Loaded default variable font config from designspace lib key: "
            f"{DEFAULT_VF_DESIGNSPACE_LIB_KEY}"
        )

    return config


def postscript_name_part(value, fallback):
    value = value or fallback
    clean_value = POSTSCRIPT_NAME_PART_RE.sub("", value)
    return clean_value or fallback


def google_fonts_version_string(value):
    match = VERSION_STRING_RE.match(value or "")
    if not match:
        return "Version 1.000"

    major = max(int(match.group("major")), 1)
    rest = match.group("rest") or ".000"
    return f"Version {major}{rest}"


def version_fields(value):
    version_string = google_fonts_version_string(value)
    match = VERSION_STRING_RE.match(version_string)
    if not match:
        return 1, 0, "Version 1.000"

    major = int(match.group("major"))
    rest = match.group("rest") or ".000"
    numeric_rest = re.match(r"\.(\d+)", rest)
    minor = int(numeric_rest.group(1)) if numeric_rest else 0
    return major, minor, version_string


def designspace_default_source_font_info(designspace):
    tree = ET.parse(designspace)
    root = tree.getroot()
    defaults = axis_defaults(root)

    for source in root.findall("./sources/source"):
        filename = source.get("filename")
        if not filename or not is_default_instance(source, defaults):
            continue

        fontinfo = designspace.parent / filename / "fontinfo.plist"
        if not fontinfo.exists():
            return {}

        plist = ET.parse(fontinfo).getroot()
        dict_element = plist.find("dict")
        return plist_dict(dict_element) if dict_element is not None else {}

    return {}


def public_font_info_for_v5(designspace, config):
    public_font_info = config.get("public_font_info") or {}
    if not public_font_info:
        return None

    public_font_info = json.loads(json.dumps(public_font_info))
    source_info = designspace_default_source_font_info(designspace)
    source_version = (
        config.get("version_string")
        or public_font_info.get("openTypeNameVersion")
        or source_info.get("openTypeNameVersion")
    )
    if not source_version:
        source_major = int(source_info.get("versionMajor", 1) or 1)
        source_minor = int(source_info.get("versionMinor", 0) or 0)
        source_version = f"Version {source_major}.{source_minor:03d}"

    major, minor, version_string = version_fields(source_version)
    public_font_info.setdefault("versionMajor", major)
    public_font_info.setdefault("versionMinor", minor)
    public_font_info.setdefault("openTypeNameVersion", version_string)
    if config.get("unique_id"):
        public_font_info.setdefault("openTypeNameUniqueID", config["unique_id"])

    return public_font_info


def axis_defaults(root):
    axes = root.find("axes")
    if axes is None:
        return {}

    defaults = {}
    for axis in axes.findall("axis"):
        name = axis.get("name")
        default = axis.get("default")
        if name is not None and default is not None:
            defaults[name] = float(default)
    return defaults


def axis_label(axis):
    for label in axis.findall("labelname"):
        if label.text:
            return label.text

    name = axis.get("name") or axis.get("tag") or "Axis"
    return name[:1].upper() + name[1:]


def designspace_axes(root):
    axes_element = root.find("axes")
    if axes_element is None:
        return []

    axes = []
    for index, axis in enumerate(axes_element.findall("axis")):
        tag = axis.get("tag")
        name = axis.get("name")
        default = axis.get("default")
        if not tag or not name or default is None:
            continue

        axes.append(
            {
                "tag": tag,
                "name": name,
                "label": axis_label(axis),
                "ordering": index,
                "default": float(default),
                "minimum": float(axis.get("minimum", default)),
                "maximum": float(axis.get("maximum", default)),
            }
        )

    return axes


def instance_location(instance):
    location = instance.find("location")
    if location is None:
        return {}

    coordinates = {}
    for dimension in location.findall("dimension"):
        name = dimension.get("name")
        xvalue = dimension.get("xvalue")
        if name is not None and xvalue is not None:
            coordinates[name] = float(xvalue)
    return coordinates


def is_default_instance(instance, defaults):
    if not defaults:
        return False

    coordinates = instance_location(instance)
    return all(coordinates.get(name) == default for name, default in defaults.items())


def instance_lookup_keys(instance):
    keys = [
        instance.get("name"),
        instance.get("stylename"),
        instance.get("postscriptfontname"),
    ]

    filename = instance.get("filename")
    if filename:
        keys.append(Path(filename).stem)

    return [key for key in keys if key]


def configured_instance_value(instance, config, key):
    if not config:
        return None

    instances = config.get("instances", {})
    for lookup_key in instance_lookup_keys(instance):
        values = instances.get(lookup_key)
        if values and key in values:
            return values[key]

    return None


def instance_postscript_name(instance, defaults, config=None):
    configured_name = configured_instance_value(instance, config, "postscript_name")
    if configured_name:
        return configured_name

    configured_family_name = configured_instance_value(instance, config, "family_name")
    if not configured_family_name and config:
        configured_family_name = config.get("family_name")

    family_name = postscript_name_part(
        configured_family_name or instance.get("familyname"),
        "Font",
    )

    if is_default_instance(instance, defaults):
        return family_name

    style_name = postscript_name_part(
        configured_instance_value(instance, config, "style_name")
        or configured_instance_value(instance, config, "name")
        or configured_instance_value(instance, config, "display_name")
        or instance.get("stylename")
        or instance.get("name"),
        "Regular",
    )
    return f"{family_name}-{style_name}"


def patch_designspace_postscript_names(designspace, config=None):
    tree = ET.parse(designspace)
    root = tree.getroot()
    instances = root.find("instances")
    defaults = axis_defaults(root)

    if instances is None:
        print("No instances found in designspace; skipping postscriptfontname patch.")
        return

    updated = 0
    for instance in instances.findall("instance"):
        family_name = configured_instance_value(instance, config, "family_name")
        if not family_name and config:
            family_name = config.get("family_name")
        if family_name and instance.get("familyname") != family_name:
            instance.set("familyname", family_name)
            updated += 1

        for attr, key in (("name", "name"), ("stylename", "style_name")):
            value = configured_instance_value(instance, config, key)
            if value and instance.get(attr) != value:
                instance.set(attr, value)
                updated += 1

        postscriptfontname = instance_postscript_name(instance, defaults, config)
        if instance.get("postscriptfontname") != postscriptfontname:
            instance.set("postscriptfontname", postscriptfontname)
            updated += 1

    if not updated:
        print("Designspace instance postscriptfontname attributes are already up to date.")
        return

    tree.write(designspace, encoding="utf-8", xml_declaration=True)
    print(f"Added/updated {updated} designspace instance attribute(s).")


def designspace_axis_tags(designspace):
    root = ET.parse(designspace).getroot()
    axes = root.find("axes")
    if axes is None:
        return []

    return [axis.get("tag") for axis in axes.findall("axis") if axis.get("tag")]


def designspace_family_name(designspace):
    root = ET.parse(designspace).getroot()
    for parent_name in ("instances", "sources"):
        parent = root.find(parent_name)
        if parent is None:
            continue
        for element in parent:
            family_name = element.get("familyname")
            if family_name:
                return family_name

    return designspace.stem


def google_fonts_output_file(designspace, config):
    if config.get("output_file"):
        return config["output_file"]

    family_name = postscript_name_part(
        config.get("family_name") or designspace_family_name(designspace),
        "Font",
    )
    axis_tags = designspace_axis_tags(designspace)
    if config.get("sort_output_axis_tags", True):
        axis_tags = sorted(axis_tags)
    if axis_tags:
        return f"{family_name}[{','.join(axis_tags)}].ttf"

    return f"{family_name}.ttf"


def xml_coordinate(value):
    return coordinate_key(value)


def xml_bool(value):
    return "true" if value else "false"


def stat_elided_fallback_name(config):
    stat_config = config.get("stat", {}) if config else {}
    fallback = stat_config.get("elided_fallback_name")
    if isinstance(fallback, str) and not fallback.isdigit():
        return fallback

    return config.get("style_name") or "Regular"


def stat_axes_for_v5_labels(designspace, config):
    stat_config = config.get("stat", {}) if config else {}
    if stat_config.get("axes"):
        return stat_config["axes"]

    return default_vf_stat_axes(designspace, config or {})


def replace_axis_labels(root, stat_axes):
    axes_element = root.find("axes")
    if axes_element is None:
        return 0

    stat_axes_by_tag = {axis.get("tag"): axis for axis in stat_axes if axis.get("tag")}
    updated = 0

    for axis in axes_element.findall("axis"):
        existing_labels = axis.find("labels")
        if existing_labels is not None:
            axis.remove(existing_labels)

        stat_axis = stat_axes_by_tag.get(axis.get("tag"))
        if not stat_axis or not stat_axis.get("values"):
            continue

        labels = ET.Element("labels")
        ordering = stat_axis.get("ordering")
        if ordering is not None:
            labels.set("ordering", str(int(ordering)))

        for stat_value in stat_axis.get("values", []):
            if "value" not in stat_value or not stat_value.get("name"):
                continue

            label = ET.SubElement(
                labels,
                "label",
                {
                    "name": str(stat_value["name"]),
                    "uservalue": xml_coordinate(stat_value["value"]),
                },
            )
            flags = int(stat_value.get("flags", 0) or 0)
            if flags & 1:
                label.set("oldersibling", xml_bool(True))
            if flags & 2:
                label.set("elidable", xml_bool(True))
            if stat_value.get("linkedValue") is not None:
                label.set("linkeduservalue", xml_coordinate(stat_value["linkedValue"]))

        if list(labels):
            axis.append(labels)
            updated += 1

    return updated


def replace_variable_fonts(root, output_file, public_font_info=None):
    existing = root.find("variable-fonts")
    if existing is not None:
        root.remove(existing)

    axes = designspace_axes(root)
    if not axes:
        return False

    variable_fonts = ET.Element("variable-fonts")
    variable_font = ET.SubElement(
        variable_fonts,
        "variable-font",
        {
            "name": Path(output_file).stem,
            "filename": Path(output_file).name,
        },
    )
    axis_subsets = ET.SubElement(variable_font, "axis-subsets")
    for axis in axes:
        ET.SubElement(axis_subsets, "axis-subset", {"name": axis["name"]})

    if public_font_info:
        lib = ET.SubElement(variable_font, "lib")
        lib_dict = ET.SubElement(lib, "dict")
        key = ET.SubElement(lib_dict, "key")
        key.text = "public.fontInfo"
        lib_dict.append(plist_element(public_font_info))

    sources = root.find("sources")
    if sources is None:
        root.append(variable_fonts)
        return True

    root.insert(list(root).index(sources) + 1, variable_fonts)
    return True


def write_designspace_xml(tree, designspace):
    if hasattr(ET, "indent"):
        ET.indent(tree, space=" ")
    tree.write(designspace, encoding="utf-8", xml_declaration=True)


def materialize_designspace_v5(designspace, config, output_file):
    tree = ET.parse(designspace)
    root = tree.getroot()
    root.set("format", DESIGNSPACE_V5_FORMAT)

    axes_element = root.find("axes")
    if axes_element is not None:
        axes_element.set("elidedfallbackname", stat_elided_fallback_name(config))

    stat_axes = stat_axes_for_v5_labels(designspace, config)
    label_count = replace_axis_labels(root, stat_axes)
    public_font_info = public_font_info_for_v5(designspace, config)
    has_variable_font = replace_variable_fonts(root, output_file, public_font_info)
    write_designspace_xml(tree, designspace)

    print(
        "Materialized Designspace v5 metadata: "
        f"{designspace} ({label_count} labelled axes, "
        f"variable font: {has_variable_font}, "
        f"public font info: {bool(public_font_info)})"
    )


def rewrite_designspace_filenames_for_copy(source_designspace, copied_designspace):
    tree = ET.parse(copied_designspace)
    root = tree.getroot()
    updated = 0

    for element in root.findall("./sources/source") + root.findall("./instances/instance"):
        filename = element.get("filename")
        if not filename:
            continue

        original_path = source_designspace.parent / filename
        try:
            relative_path = os.path.relpath(original_path, copied_designspace.parent)
            copied_filename = Path(relative_path).as_posix()
        except ValueError:
            copied_filename = original_path.resolve().as_posix()
        if filename != copied_filename:
            element.set("filename", copied_filename)
            updated += 1

    if updated:
        tree.write(copied_designspace, encoding="utf-8", xml_declaration=True)


def prepare_google_fonts_designspace(designspace, build_dir, config):
    google_fonts_dir = build_dir / config.get("output_dir", "google-fonts")
    google_fonts_dir.mkdir(parents=True, exist_ok=True)

    google_fonts_designspace = google_fonts_dir / designspace.name
    shutil.copy2(designspace, google_fonts_designspace)
    rewrite_designspace_filenames_for_copy(designspace, google_fonts_designspace)
    patch_designspace_postscript_names(google_fonts_designspace, config)
    materialize_designspace_v5(
        google_fonts_designspace,
        config,
        google_fonts_output_file(designspace, config),
    )
    return google_fonts_designspace


def prepare_default_designspace(designspace, build_dir, output_file):
    default_designspace = build_dir / designspace.name
    shutil.copy2(designspace, default_designspace)
    rewrite_designspace_filenames_for_copy(designspace, default_designspace)
    patch_designspace_postscript_names(default_designspace)
    materialize_designspace_v5(
        default_designspace,
        load_default_vf_config(default_designspace),
        output_file,
    )
    return default_designspace


def build_google_fonts_flavor(designspace, build_dir, config):
    if not config.get("enabled", True):
        print("Skipping Google Fonts flavor: disabled by config.")
        return None

    google_fonts_designspace = prepare_google_fonts_designspace(
        designspace,
        build_dir,
        config,
    )
    output_ttf = google_fonts_designspace.parent / google_fonts_output_file(designspace, config)
    output_ttf.parent.mkdir(parents=True, exist_ok=True)
    run_fontmake(google_fonts_designspace, google_fonts_designspace.parent, ["variable"])
    print(f"Built Google Fonts flavor variable font: {output_ttf}")
    return output_ttf


def coordinate_key(value):
    value = float(value)
    if value.is_integer():
        return str(int(value))
    return str(value)


def coordinates_match(value, other_value):
    return abs(float(value) - float(other_value)) < 0.00001


def stat_nested_value(values, axis_tag, coordinate):
    axis_values = values.get(axis_tag, {}) if isinstance(values, dict) else {}
    if not isinstance(axis_values, dict):
        return None

    key = coordinate_key(coordinate)
    if key in axis_values:
        return axis_values[key]

    float_key = str(float(coordinate))
    if float_key in axis_values:
        return axis_values[float_key]

    return None


def stat_list_has_coordinate(values, axis_tag, coordinate):
    axis_values = values.get(axis_tag) if isinstance(values, dict) else None
    if axis_values is None:
        return False

    return any(coordinates_match(value, coordinate) for value in axis_values)


def default_vf_instance_records(root, axes):
    instances = root.find("instances")
    if instances is None:
        return []

    axis_tags = [axis["tag"] for axis in axes]
    name_to_tag = {axis["name"]: axis["tag"] for axis in axes}
    records = []

    for instance in instances.findall("instance"):
        coordinates = {}
        for name, value in instance_location(instance).items():
            tag = name_to_tag.get(name)
            if tag:
                coordinates[tag] = value

        missing = [tag for tag in axis_tags if tag not in coordinates]
        if missing:
            print(
                "Skipping default VF STAT instance with missing coordinates "
                f"{missing}: {instance.get('name') or instance.get('stylename')!r}"
            )
            continue

        records.append(
            {
                "name": instance.get("stylename") or instance.get("name") or "",
                "coordinates": coordinates,
            }
        )

    return records


def default_vf_axis_name(axis, stat_config):
    axis_names = stat_config.get("axis_names", {})
    return axis_names.get(axis["tag"]) or axis_names.get(axis["name"]) or axis["label"]


def default_vf_axis_value_name(axis, coordinate, raw_name, stat_config):
    override = stat_nested_value(
        stat_config.get("axis_value_names", {}),
        axis["tag"],
        coordinate,
    )
    if override:
        return override

    if axis["tag"] in ("ital", "slnt") and coordinates_match(coordinate, axis["default"]):
        return "Roman"

    return raw_name or coordinate_key(coordinate)


def default_vf_linked_value(axis, coordinate, coordinates, stat_config):
    linked_value = stat_nested_value(
        stat_config.get("linked_values", {}),
        axis["tag"],
        coordinate,
    )
    if linked_value is not None:
        linked_value = float(linked_value)
        if any(coordinates_match(value, linked_value) for value in coordinates):
            return linked_value

    if not coordinates_match(coordinate, axis["default"]):
        return None

    if axis["tag"] == "wght" and any(coordinates_match(value, 700) for value in coordinates):
        return 700

    if axis["tag"] in ("ital", "slnt"):
        linked_candidates = [
            value for value in coordinates if not coordinates_match(value, axis["default"])
        ]
        if linked_candidates:
            return sorted(linked_candidates)[0]

    return None


def default_vf_axis_values(axis, axes, instances, stat_config):
    other_axes = [other_axis for other_axis in axes if other_axis["tag"] != axis["tag"]]
    values = {}

    for instance in instances:
        coordinates = instance["coordinates"]
        if not all(
            coordinates_match(coordinates[other_axis["tag"]], other_axis["default"])
            for other_axis in other_axes
        ):
            continue

        coordinate = coordinates[axis["tag"]]
        key = coordinate_key(coordinate)
        if key not in values:
            values[key] = {
                "coordinate": coordinate,
                "name": instance["name"],
            }

    if coordinate_key(axis["default"]) not in values:
        values[coordinate_key(axis["default"])] = {
            "coordinate": axis["default"],
            "name": "Regular",
        }

    coordinates = [value["coordinate"] for value in values.values()]
    elided_values = stat_config.get("elided_values", {})
    configured_elided_values = axis["tag"] in elided_values
    stat_values = []

    for value in sorted(values.values(), key=lambda item: item["coordinate"]):
        coordinate = value["coordinate"]
        stat_value = {
            "name": default_vf_axis_value_name(
                axis,
                coordinate,
                value["name"],
                stat_config,
            ),
            "value": coordinate,
        }

        if (
            configured_elided_values
            and stat_list_has_coordinate(elided_values, axis["tag"], coordinate)
        ) or (
            not configured_elided_values
            and coordinates_match(coordinate, axis["default"])
        ):
            stat_value["flags"] = 2

        linked_value = default_vf_linked_value(axis, coordinate, coordinates, stat_config)
        if linked_value is not None:
            stat_value["linkedValue"] = linked_value

        stat_values.append(stat_value)

    return stat_values


def default_vf_stat_axes(designspace, config):
    root = ET.parse(designspace).getroot()
    axes = designspace_axes(root)
    if not axes:
        return []

    stat_config = config.get("stat", {})
    axis_order = stat_config.get("axis_order", [])
    if axis_order:
        order_index = {tag: index for index, tag in enumerate(axis_order)}
        axes = sorted(axes, key=lambda axis: order_index.get(axis["tag"], axis["ordering"]))

    instances = default_vf_instance_records(root, axes)
    if not instances:
        print("No designspace instances found for default VF STAT generation.")
        return []

    stat_axes = []
    for ordering, axis in enumerate(axes):
        values = default_vf_axis_values(axis, axes, instances, stat_config)
        if not values:
            continue

        stat_axes.append(
            {
                "tag": axis["tag"],
                "name": default_vf_axis_name(axis, stat_config),
                "ordering": ordering,
                "values": values,
            }
        )

    return stat_axes


def write_google_fonts_patcher_script(script_path):
    patcher = r"""
# /// script
# requires-python = ">=3.9"
# dependencies = ["fonttools"]
# ///
import json
import re
import sys


POSTSCRIPT_NAME_PART_RE = re.compile(r"[^A-Za-z0-9]")
def postscript_name_part(value, fallback):
    value = value or fallback
    clean_value = POSTSCRIPT_NAME_PART_RE.sub("", value)
    return clean_value or fallback


def font_name(font, name_id):
    name_table = font["name"]
    preferred = name_table.getName(name_id, 3, 1, 0x409)
    if preferred is not None:
        return preferred.toUnicode()

    for record in name_table.names:
        if record.nameID == name_id:
            return record.toUnicode()

    return None


def set_font_name(font, name_id, value):
    if value is None:
        return

    value = str(value)
    name_table = font["name"]
    platforms = set()

    for record in list(name_table.names):
        if record.nameID != name_id:
            continue
        platform = (record.platformID, record.platEncID, record.langID)
        if platform in platforms:
            continue
        name_table.setName(value, name_id, *platform)
        platforms.add(platform)

    if not platforms:
        name_table.setName(value, name_id, 3, 1, 0x409)
        name_table.setName(value, name_id, 1, 0, 0)


def delete_font_name(font, name_id):
    font["name"].names = [
        record for record in font["name"].names if record.nameID != name_id
    ]


def remove_name_records(font, config):
    for name_id in config.get("remove_name_ids", []):
        delete_font_name(font, int(name_id))


def allocate_name_id(font):
    used = {record.nameID for record in font["name"].names}
    name_id = 256
    while name_id in used:
        name_id += 1
    return name_id


def fvar_instance_config(font, instance, config):
    instances = config.get("instances", {})
    keys = [
        font_name(font, instance.subfamilyNameID),
        font_name(font, instance.postscriptNameID),
    ]

    for key in keys:
        if key and key in instances:
            return instances[key]

    return {}


def replace_fvar_instances(font, config):
    from fontTools.ttLib.tables._f_v_a_r import NamedInstance

    family_name = config.get("family_name") or font_name(font, 1) or "Font"
    instances = []

    for instance_config in config.get("fvar_instances", []):
        style_name = instance_config["name"]
        postscript_name = instance_config.get("postscript_name") or "-".join(
            (
                postscript_name_part(family_name, "Font"),
                postscript_name_part(style_name, "Regular"),
            )
        )

        instance = NamedInstance()
        instance.subfamilyNameID = allocate_name_id(font)
        set_font_name(font, instance.subfamilyNameID, style_name)
        instance.postscriptNameID = allocate_name_id(font)
        set_font_name(font, instance.postscriptNameID, postscript_name)
        instance.coordinates = dict(instance_config.get("coordinates", {}))
        instance.flags = int(instance_config.get("flags", 0))
        instances.append(instance)

    font["fvar"].instances = instances


def update_fvar_names(font, config):
    if "fvar" not in font:
        return

    if config.get("fvar_instances"):
        replace_fvar_instances(font, config)
        return

    family_name = config.get("family_name")
    for instance in font["fvar"].instances:
        instance_config = fvar_instance_config(font, instance, config)
        display_name = (
            instance_config.get("name")
            or instance_config.get("display_name")
            or instance_config.get("style_name")
        )
        if display_name:
            set_font_name(font, instance.subfamilyNameID, display_name)

        postscript_name = instance_config.get("postscript_name")
        if not postscript_name and family_name:
            style_name = display_name or font_name(font, instance.subfamilyNameID)
            postscript_name = "-".join(
                (
                    postscript_name_part(family_name, "Font"),
                    postscript_name_part(style_name, "Regular"),
                )
            )

        if not postscript_name:
            continue

        if instance.postscriptNameID in (0, 0xFFFF):
            instance.postscriptNameID = allocate_name_id(font)
        set_font_name(font, instance.postscriptNameID, postscript_name)


def update_meta(font, config):
    meta_config = config.get("meta", {})
    if not meta_config:
        return

    if "meta" not in font:
        from fontTools.ttLib import newTable

        font["meta"] = newTable("meta")
        font["meta"].data = {}

    for tag in ("dlng", "slng"):
        value = meta_config.get(tag)
        if value:
            font["meta"].data[tag] = value


def apply_google_fonts_flavor(ttf_path, config):
    from fontTools.ttLib import TTFont

    font = TTFont(ttf_path)
    remove_name_records(font, config)
    update_fvar_names(font, config)
    update_meta(font, config)
    font.save(ttf_path)
    print(f"Patched Google Fonts flavor metadata: {ttf_path}")


def main():
    if sys.argv[1:] == ["--check"]:
        import fontTools

        print(fontTools.__version__)
        return

    if len(sys.argv) != 3:
        raise SystemExit(
            "usage: google_fonts_flavor_patcher.py <font.ttf> <config.json>"
        )

    ttf_path, config_path = sys.argv[1:3]

    with open(config_path, "r", encoding="utf-8") as config_file:
        config = json.load(config_file)

    apply_google_fonts_flavor(ttf_path, config)


if __name__ == "__main__":
    main()
""".strip()

    script_path.write_text(patcher, encoding="utf-8")


def apply_google_fonts_flavor(ttf_path, config):
    with tempfile.TemporaryDirectory(prefix="google-fonts-flavor-") as temp_dir:
        temp_path = Path(temp_dir)
        config_path = temp_path / "google_fonts_flavor_config.json"
        patcher_path = temp_path / "google_fonts_flavor_patcher.py"
        config_path.write_text(json.dumps(config), encoding="utf-8")
        write_google_fonts_patcher_script(patcher_path)

        cmd = [
            "uv",
            "run",
            "--script",
            str(patcher_path),
            str(ttf_path),
            str(config_path),
        ]

        print("Running Google Fonts flavor patcher via uv:")
        print(" ".join(cmd))

        result = subprocess.run(
            cmd,
            cwd=str(Path(ttf_path).parent),
            text=True,
            capture_output=True,
        )

        print(result.stdout)
        if result.stderr:
            print(result.stderr)

        if result.returncode != 0:
            raise RuntimeError(
                f"Google Fonts flavor patcher failed with exit code {result.returncode}"
            )


def run_fontmake(designspace, output_dir, outputs, interpolate=None):
    cmd = [
        "uvx",
        "--with",
        "ttfautohint-py",
        "fontmake",
        "-m",
        str(designspace),
        "--output",
        *outputs,
    ]
    if interpolate is not None:
        cmd.extend(["-i", interpolate])

    cmd.extend(
        [
            "--flatten-components",
            "-a",
            "--filter",
            "DottedCircleFilter(pre=True)",
            "--output-dir",
            str(output_dir),
        ]
    )

    print("Running fontmake via uvx:")
    print(" ".join(cmd))

    result = subprocess.run(
        cmd,
        cwd=str(designspace.parent),
        text=True,
        capture_output=True,
    )

    print(result.stdout)
    if result.stderr:
        print(result.stderr)

    if result.returncode != 0:
        raise RuntimeError(f"fontmake failed with exit code {result.returncode}")


def build_default_flavor(designspace, build_dir):
    run_fontmake(designspace, build_dir, ["variable"])
    run_fontmake(designspace, build_dir, ["variable-cff2"])
    run_fontmake(designspace, build_dir, ["ttf", "otf-cff2"], interpolate=".*")


def build_google_fonts_variable_flavor(designspace, build_dir, config):
    google_fonts_ttf = build_google_fonts_flavor(designspace, build_dir, config)
    if google_fonts_ttf:
        apply_google_fonts_flavor(google_fonts_ttf, config)


def postprocess(data):
    data = json.loads(data)

    # Only run this for DesignSpace+UFO exports.
    if data.get("format") != "DesignSpace":
        print(f"Skipping fontmake: export format is {data.get('format')!r}")
        return

    outputs = data.get("outputs", [])
    designspaces = [
        Path(o["path"])
        for o in outputs
        if o.get("path", "").lower().endswith(".designspace")
    ]

    if not designspaces:
        print("No .designspace file found in FontLab export outputs.")
        print(json.dumps(data, indent=2))
        return

    designspace = designspaces[0]

    build_dir = designspace.parent / "build"
    build_dir.mkdir(exist_ok=True)

    output_ttf = build_dir / f"{designspace.stem}-VF.ttf"
    default_designspace = prepare_default_designspace(
        designspace,
        build_dir,
        output_ttf.name,
    )
    build_default_flavor(default_designspace, build_dir)

    print(f"Built default flavor variable font: {output_ttf}")
    print("Built default flavor CFF2 variable font and static TTF/OTF-CFF2 instances.")

    google_fonts_config = load_google_fonts_config(designspace)
    build_google_fonts_variable_flavor(designspace, build_dir, google_fonts_config)
