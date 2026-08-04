[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$Repo = Split-Path -Parent $PSScriptRoot
$Web = Join-Path $Repo "website"
$Failures = [System.Collections.Generic.List[string]]::new()

function Pass([string]$Text) { Write-Host "[PASS] $Text" -ForegroundColor Green }
function Fail([string]$Text) { $Failures.Add($Text); Write-Host "[FAIL] $Text" -ForegroundColor Red }

Write-Host "`n=== Farsi Smart website V2 product test ===" -ForegroundColor Cyan

$Required = @(
    "index.html",
    "styles.css",
    "app.js",
    "history-data.js",
    "changelog.html",
    "privacy.html",
    "support.html",
    "README.md"
)

foreach ($Name in $Required) {
    if (Test-Path -LiteralPath (Join-Path $Web $Name) -PathType Leaf) {
        Pass "Required file exists: $Name"
    }
    else {
        Fail "Required file missing: $Name"
    }
}

$Font = Join-Path $Repo "fonts\Vazirmatn.woff2"

if (Test-Path -LiteralPath $Font -PathType Leaf) {
    Pass "Local Persian font exists."
}
else {
    Fail "Local Persian font is missing."
}

$HtmlFiles = @(Get-ChildItem -LiteralPath $Web -Filter "*.html" -File)

foreach ($File in $HtmlFiles) {
    $Text = Get-Content -LiteralPath $File.FullName -Raw

    if ($Text -match '<html\s+lang="fa"\s+dir="rtl">') {
        Pass "Persian RTL declared: $($File.Name)"
    }
    else {
        Fail "Persian RTL missing: $($File.Name)"
    }

    if ($Text -match '<meta\s+name="viewport"') {
        Pass "Responsive viewport exists: $($File.Name)"
    }
    else {
        Fail "Responsive viewport missing: $($File.Name)"
    }

    if ($Text -match '(?i)\son[a-z]+\s*=') {
        Fail "Inline event handler found: $($File.Name)"
    }
    else {
        Pass "No inline event handler: $($File.Name)"
    }

    if ($Text -match '(?i)(src|href)\s*=\s*["'']https?://') {
        Fail "External HTTP dependency found: $($File.Name)"
    }
    else {
        Pass "No external HTTP dependency: $($File.Name)"
    }

    $Visible = [regex]::Replace(
        $Text,
        '(?is)<script\b[^>]*>.*?</script>|<style\b[^>]*>.*?</style>|<[^>]+>',
        ' '
    )

    $Visible = [System.Net.WebUtility]::HtmlDecode($Visible)

    if ($Visible -match '[0-9]') {
        Fail "ASCII digit found in visible text: $($File.Name)"
    }
    else {
        Pass "Visible digits are Persian: $($File.Name)"
    }

    if ($Visible -match '\b(Farsi|Smart|Assistant|Preview|Release|Support|Privacy)\b') {
        Fail "English interface word found: $($File.Name)"
    }
    else {
        Pass "Visible interface is Persian: $($File.Name)"
    }

    $Links = @(
        [regex]::Matches(
            $Text,
            'href\s*=\s*["''](?<path>\./[^"'']+)["'']',
            [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
        ) |
        ForEach-Object { $_.Groups["path"].Value }
    )

    foreach ($Link in $Links) {
        $PathOnly = ($Link -split "#", 2)[0]

        if (
            -not [string]::IsNullOrWhiteSpace($PathOnly) -and
            -not (Test-Path -LiteralPath (Join-Path $File.DirectoryName $PathOnly) -PathType Leaf)
        ) {
            Fail "Broken local link in $($File.Name): $Link"
        }
    }
}

$Index = Get-Content -LiteralPath (Join-Path $Web "index.html") -Raw
$Styles = Get-Content -LiteralPath (Join-Path $Web "styles.css") -Raw
$App = Get-Content -LiteralPath (Join-Path $Web "app.js") -Raw
$HistoryScript = Get-Content -LiteralPath (Join-Path $Web "history-data.js") -Raw

foreach ($RequiredText in @(
    "فارسی اسمارت",
    "وقتی فارسی",
    "نسخهٔ نمایشی ۳٫۷٫۱",
    "۲۸۲",
    "نمایش امن"
)) {
    if ($Index.Contains($RequiredText)) {
        Pass "Landing content exists: $RequiredText"
    }
    else {
        Fail "Landing content missing: $RequiredText"
    }
}

if (
    $Styles.Contains('@font-face') -and
    $Styles.Contains('../fonts/Vazirmatn.woff2') -and
    $Styles.Contains('font-family:"وزیرمتن"')
) {
    Pass "Local Persian typography is configured."
}
else {
    Fail "Persian typography configuration is incomplete."
}

foreach ($Pattern in @(
    '(?i)\.innerHTML\s*=',
    '(?i)\.outerHTML\s*=',
    '(?i)document\.write\s*\(',
    '(?i)\beval\s*\(',
    '(?i)new\s+Function\s*\('
)) {
    if ($App -match $Pattern) {
        Fail "Forbidden JavaScript pattern found: $Pattern"
    }
    else {
        Pass "Forbidden JavaScript pattern absent: $Pattern"
    }
}

if ($App -match '\.textContent\s*=') {
    Pass "Safe textContent assignment is used."
}
else {
    Fail "Safe textContent assignment is missing."
}

$Prefix = "window.FARSI_SMART_HISTORY="
if (
    -not $HistoryScript.StartsWith($Prefix) -or
    -not $HistoryScript.TrimEnd().EndsWith(";")
) {
    Fail "History data wrapper is invalid."
}
else {
    $JsonText = $HistoryScript.Substring(
        $Prefix.Length,
        $HistoryScript.TrimEnd().Length - $Prefix.Length - 1
    )

    try {
        $History = $JsonText | ConvertFrom-Json

        if (@($History.releases).Count -eq 11) {
            Pass "All 11 releases are present."
        }
        else {
            Fail "Release count differs from 11."
        }

        if (@($History.activities).Count -eq 282) {
            Pass "All 282 development records are present."
        }
        else {
            Fail "Activity count differs from 282."
        }

        $Versions = @($History.releases.version)

        foreach ($Version in @(
            "۱٫۰","۲٫۰","۳٫۰","۳٫۱","۳٫۲","۳٫۳",
            "۳٫۴","۳٫۵","۳٫۶","۳٫۷٫۰","۳٫۷٫۱"
        )) {
            if ($Version -in $Versions) {
                Pass "Release exists: $Version"
            }
            else {
                Fail "Release missing: $Version"
            }
        }
    }
    catch {
        Fail "History data JSON could not be parsed: $($_.Exception.Message)"
    }
}

Write-Host "`n=== Website V2 product test result ===" -ForegroundColor Cyan
Write-Host "FailureCount=$($Failures.Count)"

if ($Failures.Count -gt 0) {
    Write-Host "Decision=WEBSITE-V2-PRODUCT-GATE-FAIL" -ForegroundColor Red
    exit 1
}

Write-Host "Decision=WEBSITE-V2-PRODUCT-GATE-PASS" -ForegroundColor Green
exit 0
