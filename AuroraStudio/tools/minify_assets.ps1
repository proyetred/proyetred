# Minify CSS and JS (simple PowerShell minifier)
# Usage: Open PowerShell in the project root and run: .\tools\minify_assets.ps1

$files = @(
    @{ src = "styles.css"; dst = "styles.min.css" },
    @{ src = "script.js"; dst = "script.min.js" }
)

foreach ($f in $files) {
    $srcPath = Join-Path -Path (Get-Location) -ChildPath $f.src
    if (-not (Test-Path $srcPath)) {
        Write-Host "Skipping: $($f.src) not found" -ForegroundColor Yellow
        continue
    }

    $content = Get-Content $srcPath -Raw -ErrorAction Stop

    # Remove block comments /* ... */ (DOTALL)
    $content = [regex]::Replace($content, '(?s)/\*.*?\*/', '')

    if ($f.src -like '*.js') {
        # Remove line comments // ... (multiline)
        $content = [regex]::Replace($content, '(?m)//.*$', '')
    }

    # Collapse whitespace (replace sequences of whitespace with single space)
    $content = [regex]::Replace($content, '\s+', ' ')

    # Optional: remove space around punctuation for CSS/JS
    $content = $content -replace '\s*([{};:,>\(\)])\s*', '$1'

    $dstPath = Join-Path -Path (Get-Location) -ChildPath $f.dst
    Set-Content -Path $dstPath -Value $content -Encoding UTF8
    Write-Host "Wrote: $dstPath" -ForegroundColor Green
}

Write-Host "Minification complete. Review the .min files before deploying." -ForegroundColor Cyan
