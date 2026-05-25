# Constants
$ErrorActionPreference = "Stop"

$documents = [Environment]::GetFolderPath("MyDocuments")
$desktop = [Environment]::GetFolderPath("Desktop")
$cwd = $PSScriptRoot

$sourcesDir = Join-Path $cwd "sources"
$designspaceDir = Join-Path $cwd "designspace"
$mastersDir = Join-Path $designspaceDir "masters"
$fontsDir = Join-Path $cwd "fonts"
$scriptsDir = Join-Path $cwd "scripts"
$reportsDir = Join-Path $cwd "reports"
$proofsDir = Join-Path $cwd "proofs"
$variableFontsDir = Join-Path $fontsDir "variable"
$otfFontsDir = Join-Path $fontsDir "otf"
$ttfFontsDir = Join-Path $fontsDir "ttf"
$woff2FontsDir = Join-Path $fontsDir "woff2"

$designspaceBuildDir = Join-Path $desktop "OareSans\DesignSpace-UFO"
$fontBuildDir = Join-Path $designspaceBuildDir "build"
$googleFontsBuildDir = Join-Path $fontBuildDir "google-fonts"

function Invoke-Robocopy {
    param(
        [Parameter(Mandatory)]
        [string] $Source,

        [Parameter(Mandatory)]
        [string] $Destination,

        [string[]] $Files = @("*"),

        [string[]] $Options = @()
    )

    robocopy $Source $Destination @Files @Options /R:2 /W:1 /NFL /NDL /NP

    if ($LASTEXITCODE -gt 7) {
        throw "Robocopy failed with exit code $LASTEXITCODE`: $Source -> $Destination"
    }

    $global:LASTEXITCODE = 0
}

function Sync-FontFiles {
    param(
        [AllowEmptyCollection()]
        [System.IO.FileInfo[]] $SourceFiles = @(),

        [Parameter(Mandatory)]
        [string] $Destination
    )

    $sourceFilesByName = @{}
    foreach ($sourceFile in $SourceFiles) {
        $sourceFilesByName[$sourceFile.Name] = $sourceFile
    }

    Get-ChildItem -LiteralPath $Destination -File | Where-Object { -not $sourceFilesByName.ContainsKey($_.Name) } | Remove-Item -Force
    foreach ($sourceFile in $sourceFilesByName.Values) {
        Copy-Item -LiteralPath $sourceFile.FullName -Destination (Join-Path $Destination $sourceFile.Name) -Force
    }
}

# ----------
# Copy files
# ----------

New-Item -ItemType Directory -Path $sourcesDir, $designspaceDir, $fontsDir, $variableFontsDir, $otfFontsDir, $ttfFontsDir, $woff2FontsDir, $scriptsDir, $reportsDir, $proofsDir -Force | Out-Null

# Copy FontLab source
Copy-Item -LiteralPath (Join-Path $documents "Fonts\OareSans-Regular.vfj") -Destination (Join-Path $sourcesDir "OareSans-Regular.vfj") -Force

# Copy Designspace source
Copy-Item -LiteralPath (Join-Path $designspaceBuildDir "OareSans-Regular.designspace") -Destination (Join-Path $designspaceDir "OareSans-Regular.designspace") -Force
Invoke-Robocopy -Source (Join-Path $designspaceBuildDir "masters") -Destination $mastersDir -Options @("/MIR")

# Sync font files from build outputs
Sync-FontFiles -Destination $variableFontsDir -SourceFiles @(
    Get-Item -LiteralPath (Join-Path $fontBuildDir "OareSans-Regular-VF.ttf")
    Get-Item -LiteralPath (Join-Path $fontBuildDir "OareSans-Regular-VF.otf")
    Get-Item -LiteralPath (Join-Path $googleFontsBuildDir "OareSans[slnt,wght].ttf")
)

Sync-FontFiles -Destination $ttfFontsDir -SourceFiles @(
    Get-ChildItem -LiteralPath $fontBuildDir -Filter "*.ttf" -File | Where-Object { $_.Name -ne "OareSans-Regular-VF.ttf" }
)

Sync-FontFiles -Destination $otfFontsDir -SourceFiles @(
    Get-ChildItem -LiteralPath $fontBuildDir -Filter "*.otf" -File
)

# Copy scripts
Copy-Item -LiteralPath (Join-Path $documents "FontLab\Fontlab 8\Exports\ufo_export_post_processing.py") -Destination (Join-Path $scriptsDir "ufo_export_post_processing.py") -Force

# ----------------
# Generate reports
# ----------------

# Fontspector reports
fontspector --profile universal --ghmarkdown (Join-Path $reportsDir "universal.md") --html (Join-Path $reportsDir "universal.html") (Join-Path $variableFontsDir "OareSans-Regular-VF.ttf")
fontspector --profile googlefonts --ghmarkdown (Join-Path $reportsDir "googlefonts.md") --html (Join-Path $reportsDir "googlefonts.html") (Join-Path $variableFontsDir "OareSans[slnt,wght].ttf")

# Proofing
proofer generate (Join-Path $proofsDir "glyphs.yml")
proofer generate (Join-Path $proofsDir "proof.yml")

# ----------------
# Update README.md
# ----------------

$version = (Get-Content (Join-Path $sourcesDir "OareSans-Regular.vfj") -Raw | ConvertFrom-Json -AsHashTable).font.info.version
$readmePath = Join-Path $cwd "README.md"
(Get-Content $readmePath) -replace "(?<=<!-- Version begin -->).*(?=<!-- Version end -->)", "$version" | Set-Content $readmePath -Force

# -----------------
# Build WOFF2 fonts
# -----------------

function Convert-TtfFontsToWoff2 {
    param(
        [Parameter(Mandatory)]
        [string] $Source,

        [Parameter(Mandatory)]
        [string] $Destination
    )

    $sourceFiles = Get-ChildItem -LiteralPath $Source -Filter "*.ttf" -File
    $outputNames = @{}

    foreach ($sourceFile in $sourceFiles) {
        $outputName = "$($sourceFile.BaseName).woff2"
        $outputPath = Join-Path $Destination $outputName
        $outputNames[$outputName] = $true

        uvx --from "fonttools[woff]" fonttools ttLib.woff2 compress $sourceFile.FullName -o $outputPath
    }

    Get-ChildItem -LiteralPath $Destination -Filter "*.woff2" -File | Where-Object { -not $outputNames.ContainsKey($_.Name) } | Remove-Item -Force
}

Convert-TtfFontsToWoff2 -Source $ttfFontsDir -Destination $woff2FontsDir
Convert-TtfFontsToWoff2 -Source $variableFontsDir -Destination $variableFontsDir

