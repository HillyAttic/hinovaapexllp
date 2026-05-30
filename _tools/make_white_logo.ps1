Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Drawing.Imaging

$src = 'd:\hinovaapexllp\logo\hinovaapexlogo.png'
$outFiles = @(
  'd:\hinovaapexllp\logo\hinova-logo-white.png',
  'd:\hinovaapexllp\67512b0c631970a86b689dc8\hinova-logo-white.png'
)

$orig = New-Object System.Drawing.Bitmap($src)
$w = $orig.Width
$h = $orig.Height

$white = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

# Lock bits for fast pixel access
$rectSrc = New-Object System.Drawing.Rectangle(0, 0, $w, $h)
$dataSrc = $orig.LockBits($rectSrc, [System.Drawing.Imaging.ImageLockMode]::ReadOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$dataDst = $white.LockBits($rectSrc, [System.Drawing.Imaging.ImageLockMode]::WriteOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

$bytes = $w * $h * 4
$buf = New-Object byte[] $bytes
[System.Runtime.InteropServices.Marshal]::Copy($dataSrc.Scan0, $buf, 0, $bytes)

for ($i = 0; $i -lt $bytes; $i += 4) {
    # BGRA order
    $b = $buf[$i]
    $g = $buf[$i + 1]
    $r = $buf[$i + 2]
    $a = $buf[$i + 3]

    # luminance of source pixel
    $lum = 0.299 * $r + 0.587 * $g + 0.114 * $b

    # Smooth alpha: darker source content => more opaque white.
    # Background (near white, lum ~255) => alpha 0 (transparent).
    # Logo strokes (dark, lum ~0) => alpha 255 (solid white).
    $alpha = [int](255 - $lum)
    if ($alpha -lt 0) { $alpha = 0 }
    if ($alpha -gt 255) { $alpha = 255 }
    # respect any existing transparency in the source
    $alpha = [int]($alpha * $a / 255)

    # write white with computed alpha (BGRA)
    $buf[$i]     = 255
    $buf[$i + 1] = 255
    $buf[$i + 2] = 255
    $buf[$i + 3] = [byte]$alpha
}

[System.Runtime.InteropServices.Marshal]::Copy($buf, 0, $dataDst.Scan0, $bytes)
$orig.UnlockBits($dataSrc)
$white.UnlockBits($dataDst)

foreach ($out in $outFiles) {
    $white.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Output ("Saved " + $out)
}

$orig.Dispose()
$white.Dispose()
Write-Output "DONE: anti-aliased white logo regenerated."
