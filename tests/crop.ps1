param(
  [Parameter(Mandatory = $true)][string]$Src,
  [Parameter(Mandatory = $true)][string]$Dst,
  [Parameter(Mandatory = $true)][int]$X,
  [Parameter(Mandatory = $true)][int]$Y,
  [Parameter(Mandatory = $true)][int]$W,
  [Parameter(Mandatory = $true)][int]$H,
  [double]$Scale = 1.0,
  [int]$Quality = 88
)

# Chrome's Page.captureScreenshot ignores clip, so full-page shots are taken
# once and cropped here for close review.
Add-Type -AssemblyName System.Drawing

$img = [System.Drawing.Image]::FromFile((Resolve-Path $Src).Path)

# Clamp to the source so a bad region fails loudly instead of writing garbage.
$x = [Math]::Max(0, [Math]::Min($X, $img.Width - 1))
$y = [Math]::Max(0, [Math]::Min($Y, $img.Height - 1))
$w = [Math]::Max(1, [Math]::Min($W, $img.Width - $x))
$h = [Math]::Max(1, [Math]::Min($H, $img.Height - $y))

$ow = [Math]::Max(1, [int][Math]::Round($w * $Scale))
$oh = [Math]::Max(1, [int][Math]::Round($h * $Scale))

$bmp = New-Object System.Drawing.Bitmap($ow, $oh)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.DrawImage(
  $img,
  (New-Object System.Drawing.Rectangle(0, 0, $ow, $oh)),
  (New-Object System.Drawing.Rectangle($x, $y, $w, $h)),
  [System.Drawing.GraphicsUnit]::Pixel
)

if ($Dst.ToLower().EndsWith('.png')) {
  $bmp.Save((Join-Path (Get-Location).Path $Dst), [System.Drawing.Imaging.ImageFormat]::Png)
} else {
  $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
  $params = New-Object System.Drawing.Imaging.EncoderParameters(1)
  $params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]$Quality)
  $bmp.Save((Join-Path (Get-Location).Path $Dst), $codec, $params)
}

$g.Dispose(); $bmp.Dispose(); $img.Dispose()
"$Dst  ${ow}x${oh}  (from $Src at $x,$y ${w}x${h})"
