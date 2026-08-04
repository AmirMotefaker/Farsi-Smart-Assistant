[CmdletBinding()]
param(
    [string]$EvidenceRoot = ""
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$RepositoryRoot = Split-Path -Parent $PSScriptRoot

if ([string]::IsNullOrWhiteSpace($EvidenceRoot)) {
    $Stamp = [DateTimeOffset]::Now.ToString(
        "yyyyMMdd-HHmmss",
        [System.Globalization.CultureInfo]::InvariantCulture
    )

    $EvidenceRoot = Join-Path `
        "C:\Projects\Operations\Farsi-Smart-Assistant\Audits\product-gates" `
        $Stamp
}

New-Item -ItemType Directory -Path $EvidenceRoot -Force | Out-Null

$SummaryPath = Join-Path $EvidenceRoot "00-summary.txt"
$CheckPath = Join-Path $EvidenceRoot "01-syntax.txt"
$TestsPath = Join-Path $EvidenceRoot "02-tests.txt"
$EvaluationPath = Join-Path $EvidenceRoot "03-evaluation.json"
$EvaluationRawPath = Join-Path $EvidenceRoot "04-evaluation-raw.txt"

function Invoke-NativeText {
    param(
        [Parameter(Mandatory = $true)]
        [scriptblock]$Command,

        [Parameter(Mandatory = $true)]
        [string]$FailureMessage
    )

    $Output = & $Command 2>&1
    $ExitCode = $LASTEXITCODE
    $Text = ($Output -join "`n").Trim()

    if ($ExitCode -ne 0) {
        throw "$FailureMessage`n$Text"
    }

    return $Text
}

Push-Location $RepositoryRoot

try {
    $CheckOutput = Invoke-NativeText `
        -FailureMessage "JavaScript syntax gate failed." `
        -Command { npm run check }

    [System.IO.File]::WriteAllText(
        $CheckPath,
        $CheckOutput + "`n",
        [System.Text.UTF8Encoding]::new($false)
    )

    $TestsOutput = Invoke-NativeText `
        -FailureMessage "Automated tests failed." `
        -Command { npm test }

    [System.IO.File]::WriteAllText(
        $TestsPath,
        $TestsOutput + "`n",
        [System.Text.UTF8Encoding]::new($false)
    )

    # Run the evaluator directly so npm lifecycle notices cannot prefix JSON.
    $EvaluationOutput = Invoke-NativeText `
        -FailureMessage "Persian evaluation gate failed." `
        -Command { node evaluation/run-evaluation.mjs }

    [System.IO.File]::WriteAllText(
        $EvaluationRawPath,
        $EvaluationOutput + "`n",
        [System.Text.UTF8Encoding]::new($false)
    )

    # Defensive extraction keeps the gate robust if Node emits a warning.
    $JsonStart = $EvaluationOutput.IndexOf("{")
    $JsonEnd = $EvaluationOutput.LastIndexOf("}")

    if ($JsonStart -lt 0 -or $JsonEnd -lt $JsonStart) {
        throw "Evaluation output did not contain a JSON object."
    }

    $EvaluationJson = $EvaluationOutput.Substring(
        $JsonStart,
        $JsonEnd - $JsonStart + 1
    )

    $Evaluation = $EvaluationJson | ConvertFrom-Json

    [System.IO.File]::WriteAllText(
        $EvaluationPath,
        ($Evaluation | ConvertTo-Json -Depth 20) + "`n",
        [System.Text.UTF8Encoding]::new($false)
    )

    if ($Evaluation.decision -ne "PASS") {
        throw "Evaluation decision is not PASS."
    }

    $Summary = @"
FARSI SMART ASSISTANT PRODUCT GATE

Recorded at:
$([DateTimeOffset]::Now.ToString(
    "yyyy-MM-ddTHH:mm:sszzz",
    [System.Globalization.CultureInfo]::InvariantCulture
))

Repository root:
$RepositoryRoot

Syntax:
PASS

Automated tests:
PASS

Evaluation decision:
$($Evaluation.decision)

Evaluation cases:
$($Evaluation.totalCases)

Release-blocking cases:
$($Evaluation.enforcedCases)

Manual-review cases:
$($Evaluation.manualReviewCases)

Enforced exact-match rate:
$($Evaluation.enforcedExactMatchRate)

False-positive rate:
$($Evaluation.falsePositiveRate)

P50 latency ms:
$($Evaluation.p50LatencyMs)

P95 latency ms:
$($Evaluation.p95LatencyMs)

Decision:
PRODUCT-GATE-PASS
"@

    [System.IO.File]::WriteAllText(
        $SummaryPath,
        $Summary.TrimEnd() + "`n",
        [System.Text.UTF8Encoding]::new($false)
    )

    Write-Host "`n=== Product gate summary ===" -ForegroundColor Cyan
    Get-Content -LiteralPath $SummaryPath

    Write-Host "`n[OK] Farsi Smart Assistant product gate passed." -ForegroundColor Green
    Write-Host "Evidence: $EvidenceRoot"
}
finally {
    Pop-Location
}
