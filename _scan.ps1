$root = 'd:\hinovaapexllp'
$t2 = [System.IO.File]::ReadAllText((Join-Path $root 'faq-page.html'))
$m2 = [regex]::Match($t2, '.{40}<code class="code-3"><br>\?</code>questions.{20}')
Write-Output ("faq heading: " + ($m2.Value -replace '\s+',' '))
Write-Output ""
$t3 = [System.IO.File]::ReadAllText((Join-Path $root 'homepage-3.html'))
$m3 = [regex]::Match($t3, '.{50}<code><br>\?</code>to many industry.{20}')
Write-Output ("homepage-3 services: " + ($m3.Value -replace '\s+',' '))
