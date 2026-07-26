Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile('f:\AI Learnig - NEW SKILL\Avalokana\public\images\hero-bg.jpg')
$cropAmount = 160
$rect = New-Object System.Drawing.Rectangle(0, 0, $img.Width, ($img.Height - $cropAmount))
$bmp = New-Object System.Drawing.Bitmap($rect.Width, $rect.Height)
$graphics = [System.Drawing.Graphics]::FromImage($bmp)
$graphics.DrawImage($img, $rect, $rect, [System.Drawing.GraphicsUnit]::Pixel)
$graphics.Dispose()
$img.Dispose()
$bmp.Save('f:\AI Learnig - NEW SKILL\Avalokana\public\images\hero-bg-cropped.jpg', [System.Drawing.Imaging.ImageFormat]::Jpeg)
$bmp.Dispose()
