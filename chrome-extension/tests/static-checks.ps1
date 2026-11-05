$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$manifestPath = Join-Path $root "manifest.json"
$contentPath = Join-Path $root "content.js"
$backgroundPath = Join-Path $root "background.js"
$cssPath = Join-Path $root "content.css"

$manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
$content = Get-Content $contentPath -Raw
$background = Get-Content $backgroundPath -Raw
$css = Get-Content $cssPath -Raw

function Assert-True {
  param(
    [bool] $Condition,
    [string] $Message
  )

  if (-not $Condition) {
    throw $Message
  }
}

Assert-True ($manifest.manifest_version -eq 3) "manifest_version must be 3."
Assert-True ($manifest.version -eq "1.2.0") "Manifest version must be 1.2.0."
Assert-True ($manifest.permissions -contains "downloads") "downloads permission is required."
Assert-True ($manifest.permissions -contains "storage") "storage permission is required for saved preferences."

Assert-True ($background -match "chrome\.downloads\.download") "background.js must use chrome.downloads.download."
Assert-True ($background -notmatch "URL\.createObjectURL") "background.js must not use URL.createObjectURL in MV3 service worker."
Assert-True ($background -notmatch "new Blob") "background.js must not create Blob objects."

Assert-True ($content -match 'const PREFS_KEY = "arenaExporterPreferencesV2"') "Preferences key should be V2 for the new defaults."
Assert-True ($content -match "saveAs: false") "Default saveAs should be false to avoid repeated folder prompts."
Assert-True ($content -match 'return "\\n"\.repeat\(9\);') "Wide spacing must produce eight blank lines."
Assert-True ($content -match 'return "\\n\\n\\n\\n";') "Normal spacing must produce three blank lines."
Assert-True ($content -match "trimPreservingBlankLines") "TXT/MD renderers must preserve intentional blank lines."
Assert-True ($content -notmatch "createCopyablePdfBlob") "Old ASCII-only PDF generator must not be present."
Assert-True ($content -notmatch "pdfEscape") "Old ASCII-only PDF escaping must not be present."
Assert-True ($content -match "html2pdf\(\)") "PDF export should use the local html2pdf renderer."

Assert-True ($content -match "PRIMARY_LANGUAGES") "Language UI should separate primary languages."
Assert-True ($content -match "OTHER_LANGUAGES") "Language UI should expose secondary languages through Other."
Assert-True ($content -match "arena-exporter-lang-select") "Other language dropdown must exist."
Assert-True ($content -match "data-setting-group") "Format-specific setting groups must be marked for hiding."

Assert-True ($css -match "@media \(max-width: 520px\)") "CSS must include compact mobile layout rules."
Assert-True ($css -match "arena-exporter-lang-select") "CSS must style the Other language dropdown."
Assert-True ($css -match "repeat\(auto-fit, minmax\(min\(100%, 170px\), 1fr\)\)") "Action grid must use adaptive columns."

# --- Chat mode detection and two-answers-in-direct-chat regression guards ---
Assert-True ($content -match "function detectChatMode") "Mode detection must be evidence based (detectChatMode)."
Assert-True ($content -match "function readModeLabelEvidence") "Mode selector label must be read as evidence."
Assert-True ($content -match "MODE_LABEL_PATTERNS") "Mode label keywords must live in MODE_LABEL_PATTERNS."
Assert-True ($content -match "MODE_OVERRIDE") "Manual mode override must exist."
Assert-True ($content -match 'name="arena-exporter-mode"') "Mode override control must be rendered."
Assert-True ($content -match "modeOverride") "Mode override must be persisted in preferences."
Assert-True ($content -match "collectAssistantAnswerNodes") "Direct parser must handle answer carousels (two answers per prompt)."
Assert-True ($content -match "variantSuffix") "Answer variants must be labelled in exports."
Assert-True ($content -match "hasAssistantAnswers") "Export must not silently drop model answers."
Assert-True ($content -match "function buildDiagnosticsReport") "Diagnostics report must be available."
Assert-True ($content -match "__arenaExporterInternals") "Internals must be exposed for diagnostics/tests."
Assert-True ($content -notmatch "eval\(") "No eval() in the content script."

Write-Host "Static checks passed."
