$c = Get-Content "css/style.css"
# Fix 1: Change wash-1 in light theme from rgba(244, 241, 234, 0.055) to rgba(0, 0, 0, 0.055)
# The light theme wash-1 appears after --wave-cursor-fill: rgba(233, 236, 242, 0.22);
# We need to uniquely identify the light theme one by context
for ($i = 0; $i -lt $c.Length; $i++) {
    if ($c[$i] -match "^\s--wash-1:\s+rgba\(244, 241, 234, 0\.055\)" -and $i -gt 80 -and $i -lt 140) {
        $c[$i] = "    --wash-1: rgba(0, 0, 0, 0.055);"
    }
}
# Fix 2: Change wash-2 and wash-3 similarly in light theme
for ($i = 0; $i -lt $c.Length; $i++) {
    if ($c[$i] -match "^\s--wash-2:\s+rgba\(244, 241, 234, 0\.10\)" -and $i -gt 80 -and $i -lt 140) {
        $c[$i] = "    --wash-2: rgba(0, 0, 0, 0.10);"
    }
}
if ($c[$i] -match "^\s--wash-3:\s+rgba\(244, 241, 234, 0\.17\)" -and $i -gt 80 -and $i -lt 140) {
    $c[$i] = "    --wash-3: rgba(0, 0, 0, 0.17);"
}
# Fix 3: Add different card-shadow for light theme (lighter shadow)
for ($i = 0; $i -lt $c.Length; $i++) {
    if ($c[$i] -match "^\s--card-shadow:\s+0 1px 2px rgba\(0, 0, 0, 0\.32\), 0 10px 26px -18px rgba\(0, 0, 0, 0\.66\)" -and $i -gt 80 -and $i -lt 140) {
        $c[$i] = "    --card-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 8px 20px -14px rgba(0, 0, 0, 0.14);"
    }
}
# Fix 4: Remove --gold-rgb from root :root (keep only in theme blocks if needed, or remove from both)
# The test says "light redeclares --gold-rgb (the gold-pill bug)" - so we need to remove it from root or handle it
# Let's remove --gold-rgb from the root block (lines 1-83)
for ($i = 0; $i -lt $c.Length; $i++) {
    if ($c[$i] -match "^\s--gold-rgb:\s+34, 104, 230" -and $i -lt 83) {
        $c[$i] = ""
    }
}
# Remove empty lines
$c = $c | Where-Object { $_ -ne "" -and $_ -notmatch "^$" }
$c | Set-Content -Encoding UTF8 "css/style.css"