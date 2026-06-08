$ErrorActionPreference = 'Stop'
$file = 'd:\hinovaapexllp\about-us.html'
$content = [System.IO.File]::ReadAllText($file)

# Replace any team-image path (with optional CDN prefix, hash, and -p-### size
# variant) with the anonymous placeholder SVG.
$re = [regex]'(?:https://cdn\.prod\.website-files\.com/)?67512b0c631970a86b689e0a/[0-9a-fA-F]+_team-image-0\d(?:-p-\d+)?\.jpg'
$count = ($re.Matches($content)).Count
$new = $re.Replace($content, '67512b0c631970a86b689e0a/team-anonymous.svg')
[System.IO.File]::WriteAllText($file, $new, (New-Object System.Text.UTF8Encoding($false)))
Write-Output "Replacements: $count"
