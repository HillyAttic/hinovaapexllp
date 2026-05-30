Add-Type -AssemblyName System.Drawing

$src = 'd:\hinovaapexllp\logo\hinovaapexlogo.png'
$outDir = 'd:\hinovaapexllp\logo'

$orig = New-Object System.Drawing.Bitmap($src)
$w = $orig.Width
$h = $orig.Height

# 1) Transparent version (keep original colors, key out near-white background)
$trans = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
for ($y = 0; $y -lt $h; $y++) {
    for ($x = 0; $x -lt $w; $x++) {
        $p = $orig.GetPixel($x, $y)
        if ($p.R -gt 232 -and $p.G -gt 232 -and $p.B -gt 232) {
            $trans.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 255, 255, 255))
        } else {
            $trans.SetPixel($x, $y, $p)
        }
    }
}
$trans.Save("$outDir\hinova-logo.png", [System.Drawing.Imaging.ImageFormat]::Png)

# 2) White version (all visible pixels -> white, for dark footer)
$white = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
for ($y = 0; $y -lt $h; $y++) {
    for ($x = 0; $x -lt $w; $x++) {
        $p = $orig.GetPixel($x, $y)
        if ($p.R -gt 232 -and $p.G -gt 232 -and $p.B -gt 232) {
            $white.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 255, 255, 255))
        } else {
            $white.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($p.A, 255, 255, 255))
        }
    }
}
$white.Save("$outDir\hinova-logo-white.png", [System.Drawing.Imaging.ImageFormat]::Png)

# 3) Favicon (square crop of the mark area / centered, 64x64) from transparent version
$fav = New-Object System.Drawing.Bitmap(64, 64, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($fav)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.Clear([System.Drawing.Color]::FromArgb(0,0,0,0))
# fit whole logo into 64x64 preserving aspect
$scale = [Math]::Min(64.0/$w, 64.0/$h)
$nw = [int]($w*$scale); $nh = [int]($h*$scale)
$ox = [int]((64-$nw)/2); $oy = [int]((64-$nh)/2)
$g.DrawImage($trans, $ox, $oy, $nw, $nh)
$g.Dispose()
$fav.Save("$outDir\hinova-favicon.png", [System.Drawing.Imaging.ImageFormat]::Png)

$orig.Dispose(); $trans.Dispose(); $white.Dispose(); $fav.Dispose()
Write-Output "DONE generated hinova-logo.png, hinova-logo-white.png, hinova-favicon.png"
