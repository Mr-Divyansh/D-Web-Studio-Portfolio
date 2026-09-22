(function () {
    "use strict";

    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    var canvases = document.querySelectorAll(".contact-band .contact-ripples");
    if (!canvases.length) return;

    function initBandCanvas(canvas) {
        var band = canvas.closest(".contact-band");
        if (!band) return;
        var ctx = canvas.getContext("2d");
        if (!ctx) return;

        var w = 0, h = 0;
        var squares = [];
        var baseHue = 214;
        var running = false;
        var visible = true;
        var rafId = 0;

        function resize() {
            var rect = band.getBoundingClientRect();
            var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
            w = Math.max(1, Math.round(rect.width * dpr));
            h = Math.max(1, Math.round(rect.height * dpr));
            canvas.width = w;
            canvas.height = h;
        }

        function Square(x, y, hue) {
            this.x = x;
            this.y = y;
            this.size = 0;
            this.maxSize = Math.max(w, h) * 0.55;
            this.life = 0.9;
            this.decay = 0.008 + Math.random() * 0.006;
            this.hue = hue;
            this.grow = (3 + Math.random() * 3) * (Math.min(window.devicePixelRatio || 1, 1.5));
            this.rotation = Math.random() * Math.PI / 4 - Math.PI / 8;
            this.rotationSpeed = Math.random() * 0.02 - 0.01;
        }

        Square.prototype.update = function () {
            this.size += this.grow;
            this.life -= this.decay;
            this.rotation += this.rotationSpeed;
        };

        Square.prototype.draw = function () {
            var alpha = Math.max(this.life, 0);
            if (alpha <= 0) return;
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.shadowBlur = 12 * alpha;
            ctx.shadowColor = "hsla(" + this.hue + ", 90%, 62%, " + alpha + ")";
            ctx.strokeStyle = "hsla(" + this.hue + ", 90%, 70%, " + (alpha * 0.85) + ")";
            ctx.lineWidth = Math.max(0.6, 2 * alpha);
            var half = this.size / 2;
            ctx.strokeRect(-half, -half, this.size, this.size);
            ctx.restore();
        };

        function burst(px, py) {
            for (var i = 0; i < 3; i++) {
                (function (k) {
                    window.setTimeout(function () {
                        var hue = baseHue + (Math.random() * 24 - 12);
                        var rect = canvas.getBoundingClientRect();
                        var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
                        squares.push(new Square((px - rect.left) * dpr, (py - rect.top) * dpr, hue));
                        if (squares.length > 40) squares.splice(0, squares.length - 40);
                    }, k * 140);
                })(i);
            }
            baseHue = baseHue + 18 > 232 ? 206 : baseHue + 18;
        }

        function frame() {
            // fade previous trails but keep canvas transparent (no black fill)
            ctx.globalCompositeOperation = "destination-out";
            ctx.fillStyle = "rgba(0, 0, 0, 0.10)";
            ctx.fillRect(0, 0, w, h);
            ctx.globalCompositeOperation = "source-over";

            for (var i = squares.length - 1; i >= 0; i--) {
                squares[i].update();
                squares[i].draw();
                if (squares[i].life <= 0 || squares[i].size > squares[i].maxSize * 1.4) {
                    squares.splice(i, 1);
                }
            }

            if (squares.length || visible) {
                rafId = window.requestAnimationFrame(frame);
            } else {
                running = false;
            }
        }

        function kick() {
            if (!running) {
                running = true;
                rafId = window.requestAnimationFrame(frame);
            }
        }

        // ambient auto-ripples, paused offscreen
        var ambientTimer = window.setInterval(function () {
            if (!visible || document.hidden) return;
            var rect = band.getBoundingClientRect();
            if (rect.width < 2) return;
            burst(
                rect.left + rect.width * (0.2 + Math.random() * 0.6),
                rect.top + rect.height * (0.25 + Math.random() * 0.5)
            );
            kick();
        }, 2600);

        band.addEventListener("pointerdown", function (e) {
            burst(e.clientX, e.clientY);
            kick();
        });

        if (typeof window.IntersectionObserver !== "undefined") {
            var io = new IntersectionObserver(function (entries) {
                visible = entries[0].isIntersecting;
                if (visible) {
                    resize();
                    kick();
                } else if (!squares.length && running) {
                    window.cancelAnimationFrame(rafId);
                    running = false;
                }
            }, { threshold: 0.05 });
            io.observe(band);
        }

        window.addEventListener("resize", resize);
        resize();

        // opening ripple, staggered per band
        window.setTimeout(function () {
            var rect = band.getBoundingClientRect();
            burst(rect.left + rect.width / 2, rect.top + rect.height / 2);
            kick();
        }, 400 + Math.random() * 800);
    }

    for (var i = 0; i < canvases.length; i++) initBandCanvas(canvases[i]);
})();
