(function () {
    "use strict";

    if (typeof anime === "undefined") return;
    var reduceQuery = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
    if (reduceQuery && reduceQuery.matches) return;

    var bands = document.querySelectorAll(".contact-band .square-wave");
    if (!bands.length) return;

    var CELL_MIN = 18;
    var CELL_MAX = 58;
    var MAX_SHAPES = 220;
    var STAGGER_MS = 80;
    var RESIZE_MS = 250;

    function measure(band) {
        var width = band.clientWidth;
        var height = band.clientHeight;
        if (!width || !height) return null;

        var cols = width < 560 ? 12 : 20;
        var cell = Math.floor(Math.min(CELL_MAX, Math.max(CELL_MIN, width / cols)));
        var rows = Math.max(4, Math.floor(height / cell));
        while (cols * rows > MAX_SHAPES && rows > 4) rows--;

        return { cols: cols, rows: rows, cell: cell, total: cols * rows };
    }

    function cursorProps(state, index) {
        var grid = [state.cols, state.rows];
        return {
            translateX: anime.stagger(-state.cell, { grid: grid, from: index, axis: "x" }),
            translateY: anime.stagger(-state.cell, { grid: grid, from: index, axis: "y" })
        };
    }

    function cycle(state) {
        if (state.hidden) {
            state.animation = null;
            return;
        }

        var grid = [state.cols, state.rows];
        var from = state.index;
        var nextIndex = anime.random(0, state.total - 1);
        var next = cursorProps(state, nextIndex);

        state.index = nextIndex;

        state.animation = anime.timeline({
            easing: "easeInOutQuad",
            complete: function () { cycle(state); }
        })
            .add({
                targets: state.cursor,
                keyframes: [
                    { scale: 0.75, duration: 120 },
                    { scale: 2.5, duration: 220 },
                    { scale: 1.5, duration: 450 }
                ],
                duration: 300
            })
            .add({
                targets: state.shapes,
                keyframes: [
                    {
                        translateX: anime.stagger("-2px", { grid: grid, from: from, axis: "x" }),
                        translateY: anime.stagger("-2px", { grid: grid, from: from, axis: "y" }),
                        duration: 100
                    },
                    {
                        translateX: anime.stagger("4px", { grid: grid, from: from, axis: "x" }),
                        translateY: anime.stagger("4px", { grid: grid, from: from, axis: "y" }),
                        scale: anime.stagger([2.6, 1], { grid: grid, from: from }),
                        duration: 225
                    },
                    {
                        translateX: 0,
                        translateY: 0,
                        scale: 1,
                        duration: 1200
                    }
                ],
                delay: anime.stagger(STAGGER_MS, { grid: grid, from: from })
            }, 30)
            .add({
                targets: state.cursor,
                translateX: { value: next.translateX },
                translateY: { value: next.translateY },
                scale: 1.5,
                easing: "cubicBezier(.075, .2, .165, 1)"
            }, "-=800");
    }


    function build(band) {
        var grid = band.querySelector(".wave-grid");
        var cursor = band.querySelector(".wave-cursor");
        if (!grid || !cursor) return null;

        var size = measure(band);
        if (!size) return null;

        var cell = size.cell;
        var shapeSize = Math.round(cell * 0.42);
        var shapeMargin = (cell - shapeSize) / 2;
        var cursorSize = Math.round(cell * 0.62);

        grid.innerHTML = "";
        grid.style.width = size.cols * cell + "px";
        grid.style.height = size.rows * cell + "px";

        var shapes = [];
        var fragment = document.createDocumentFragment();
        for (var i = 0; i < size.total; i++) {
            var shape = document.createElement("div");
            shape.className = "wave-shape";
            shape.style.width = shapeSize + "px";
            shape.style.height = shapeSize + "px";
            shape.style.margin = shapeMargin + "px";
            fragment.appendChild(shape);
            shapes.push(shape);
        }
        grid.appendChild(fragment);

        cursor.style.width = cursorSize + "px";
        cursor.style.height = cursorSize + "px";
        cursor.style.margin = (cell - cursorSize) / 2 + "px";
        grid.appendChild(cursor);

        var state = {
            band: band,
            cursor: cursor,
            shapes: shapes,
            cols: size.cols,
            rows: size.rows,
            cell: cell,
            total: size.total,
            index: anime.random(0, size.total - 1),
            animation: null,
            observer: null,
            hidden: false
        };

        var start = cursorProps(state, state.index);
        anime.set(state.cursor, {
            translateX: start.translateX,
            translateY: start.translateY,
            translateZ: 0,
            scale: 1.5
        });

        return state;
    }


    function init(band) {
        var previous = band.waveState;
        if (previous) {
            previous.hidden = true;
            if (previous.animation) previous.animation.pause();
            if (previous.observer) previous.observer.disconnect();
        }

        var state = build(band);
        if (!state) return;
        band.waveState = state;

        function resume() {
            if (band.waveState !== state) return;
            state.hidden = false;
            if (state.animation) state.animation.play();
            else cycle(state);
        }

        function suspend() {
            if (band.waveState !== state) return;
            state.hidden = true;
            if (state.animation) state.animation.pause();
        }

        if (typeof window.IntersectionObserver === "undefined") {
            resume();
            return;
        }

        state.observer = new IntersectionObserver(function (entries) {
            if (entries[0].isIntersecting) resume();
            else suspend();
        }, { threshold: 0.1 });
        state.observer.observe(band);
    }

    for (var i = 0; i < bands.length; i++) init(bands[i]);

    var resizeTimer = null;
    window.addEventListener("resize", function () {
        if (resizeTimer) window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(function () {
            for (var i = 0; i < bands.length; i++) init(bands[i]);
        }, RESIZE_MS);
    });
})();
