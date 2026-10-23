$c = Get-Content "css/style.css"
$c = $c | Where-Object { $_ -notmatch "^    --ink-2: #FFFFFF$"; $_ -notmatch "^    --ink-3: #E8EFF9$"; $_ -notmatch "^    --paper: #0E1B31$"; $_ -notmatch "^    --silver: #51617B$"; $_ -notmatch "^    --muted: #455875$"; $_ -notmatch "^    --muted-2: #576A86$"; }
$c | Set-Content -Encoding UTF8 "css/style.css"