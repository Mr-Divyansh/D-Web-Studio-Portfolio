(function () {
    "use strict";

    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    var zones = document.querySelectorAll(".github-band .fun-blocks");
    if (!zones.length) return;

    var COLORS = ["#1f1e24", "#b72015", "#3552ba", "#e1b806", "#8b93a2"];
    var ROWS = 8;
    var BUILD_MS = 16;

    function cellCount(zone) {
        var cols = window.getComputedStyle(zone).gridTemplateColumns.split(" ").filter(Boolean).length;
        if (!cols) cols = 20;
        return cols * ROWS;
    }

    function buildZone(zone) {
        var host = zone.closest(".github-band");
        if (zone.funTimer) window.clearInterval(zone.funTimer);
        zone.innerHTML = "";
        zone.style.filter = "hue-rotate(" + Math.floor(Math.random() * 60 - 30) + "deg)";
        var total = cellCount(zone);
        zone.funTimer = window.setInterval(function () {
            if (zone.childNodes.length >= total) {
                window.clearInterval(zone.funTimer);
                zone.funTimer = null;
                return;
            }
            var b = document.createElement("div");
            b.className = "fun-block";
            b.style.background = COLORS[Math.floor(Math.random() * COLORS.length)];
            b.style.borderRadius = (Math.random() < 0.5 ? "0" : "45") + "%";
            b.style.transform = "scale(" + (0.35 + Math.random() * 0.65).toFixed(2) + ")";
            zone.appendChild(b);
        }, BUILD_MS);
        if (host && !host.dataset.funBound) {
            host.dataset.funBound = "1";
            host.addEventListener("pointerdown", function (event) {
                if (event.target.closest("a, button")) return;
                buildZone(zone);
            });
        }
    }

    function observe(zone) {
        if (typeof window.IntersectionObserver === "undefined") {
            buildZone(zone);
            return;
        }
        var done = false;
        var io = new IntersectionObserver(function (entries) {
            if (entries[0].isIntersecting && !done) {
                done = true;
                buildZone(zone);
                io.disconnect();
            }
        }, { threshold: 0.15 });
        io.observe(zone);
    }

    for (var i = 0; i < zones.length; i++) observe(zones[i]);
})();
