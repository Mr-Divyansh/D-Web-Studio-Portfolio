(function () {
    "use strict";

    var storageKey = "dweb-theme";
    var systemQuery = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
    var reducedMotionQuery = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
    var reducedMotion = reducedMotionQuery && reducedMotionQuery.matches;

    function isValidTheme(theme) {
        return theme === "light" || theme === "dark" || theme === "system";
    }

    function getSavedTheme() {
        try {
            var savedTheme = window.localStorage.getItem(storageKey);
            return isValidTheme(savedTheme) ? savedTheme : "system";
        } catch (error) {
            return "system";
        }
    }

    function saveTheme(theme) {
        try {
            window.localStorage.setItem(storageKey, theme);
        } catch (error) {
            // The selected theme still applies when storage is unavailable.
        }
    }

    function resolveTheme(theme) {
        if (theme === "system") {
            return systemQuery && systemQuery.matches ? "dark" : "light";
        }

        return theme;
    }

    // Apply theme immediately, regardless of animation
    function applyThemeImmediately(resolvedTheme, theme) {
        document.documentElement.setAttribute("data-theme", resolvedTheme);
        document.documentElement.setAttribute("data-theme-preference", resolvedTheme === "dark" || resolvedTheme === "light" ? theme : resolvedTheme);
        updateThemeMeta(resolvedTheme);
        updateThemeButtons(theme);
    }

    // Check reduced motion state reactively
    function isReducedMotion() {
        return reducedMotionQuery && reducedMotionQuery.matches;
    }

    // Create the wipe overlay element
    function createWipeOverlay() {
        var overlay = document.createElement("div");
        overlay.className = "wipe-overlay";
        overlay.setAttribute("aria-hidden", "true");
        document.body.appendChild(overlay);
        return overlay;
    }

    // Get the position of the toggle button relative to the viewport
    function getButtonPosition(button) {
        var rect = button.getBoundingClientRect();
        return {
            x: rect.left + window.pageXOffset,
            y: rect.top + window.pageYOffset
        };
    }

    // Calculate the farthest corner distance from the button position
    function getMaxRadius(buttonPos) {
        var docEl = document.documentElement;
        var clientWidth = docEl.clientWidth;
        var clientHeight = docEl.clientHeight;

        var corners = [
            { x: 0, y: 0 },
            { x: clientWidth, y: 0 },
            { x: clientWidth, y: clientHeight },
            { x: 0, y: clientHeight }
        ];

        var maxDist = 0;
        corners.forEach(function (corner) {
            var dist = Math.hypot(corner.x - buttonPos.x, corner.y - buttonPos.y);
            if (dist > maxDist) maxDist = dist;
        });
        return maxDist;
    }

    // The values here must track --ink in css/style.css, or the browser UI
    // (Android address bar, iOS safe area) paints a colour that matches neither
    // theme. Kept as literals rather than read from CSS because the meta tag
    // has to be written in JS, before the stylesheet is available.
    function updateThemeMeta(theme) {
        var themeColor = document.querySelector('meta[name="theme-color"]');
        var colorScheme = document.querySelector('meta[name="color-scheme"]');

        if (themeColor) themeColor.content = theme === "light" ? "#F1F5FB" : "#0B0E13";
        if (colorScheme) colorScheme.content = theme;
    }

    function updateThemeButtons(theme) {
        document.querySelectorAll("[data-theme-choice]").forEach(function (button) {
            button.setAttribute("aria-pressed", button.getAttribute("data-theme-choice") === theme ? "true" : "false");
        });
    }

    function applyTheme(theme, persist, toggleButton) {
        var resolvedTheme = resolveTheme(theme);
        // Always apply theme immediately - the wipe animation is visual only
        applyThemeImmediately(resolvedTheme, theme);

        if (persist) saveTheme(theme);

        // If reduced motion is preferred, skip the wipe and flip instantly
        if (isReducedMotion()) {
            if (toggleButton) {
                toggleButton.setAttribute("data-phase", "instant");
            }
            return;
        }

        // Create or reuse the wipe overlay
        var overlay = document.querySelector(".wipe-overlay");
        if (!overlay) {
            overlay = createWipeOverlay();
        }

        // Position the overlay over the toggle button
        var buttonPos = getButtonPosition(toggleButton);
        overlay.style.left = buttonPos.x + "px";
        overlay.style.top = buttonPos.y + "px";

        // Calculate the max radius for the wipe to reach all corners
        var maxRadius = getMaxRadius(buttonPos);
        var finalRadius = maxRadius * 2;

        // Trigger the wipe animation - grow circle from button position
        overlay.style.transition = "clip-path 0.6s var(--ease), opacity 0.6s var(--ease)";
        overlay.style.opacity = "1";

        // Set initial clip (small circle at button position)
        var startClip = "circle(0px at " + buttonPos.x + "px " + buttonPos.y + "px)";
        overlay.style.clipPath = startClip;

        // Force reflow to start the animation from the initial state
        void overlay.offsetWidth;

        // Animate to the final clip-path
        var endClip = "circle(" + finalRadius + "px at " + buttonPos.x + "px " + buttonPos.y + "px)";
        overlay.style.clipPath = endClip;

        // Swap the theme during the animation (at 30% of duration)
        // Note: theme is already applied immediately via applyThemeImmediately,
        // this just ensures persistence and button state sync
        setTimeout(function () {
            document.documentElement.setAttribute("data-theme", resolvedTheme);
            document.documentElement.setAttribute("data-theme-preference", resolvedTheme);
            updateThemeMeta(resolvedTheme);
            updateThemeButtons(theme);
            if (persist) saveTheme(theme);
        }, 0.6 * 1000 * 0.3);

        // Remove the overlay after the animation completes
        setTimeout(function () {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        }, 600 + 100);
    }

    function setUpThemeControls() {
        applyTheme(getSavedTheme(), false);

        document.querySelectorAll("[data-theme-choice]").forEach(function (button) {
            button.addEventListener("click", function () {
                var nextTheme = this.getAttribute("data-theme-choice");
                applyTheme(nextTheme, true, this);
            });
        });

        if (systemQuery) {
            var onSystemThemeChange = function () {
                if (getSavedTheme() === "system") applyTheme("system", false);
            };

            if (systemQuery.addEventListener) {
                systemQuery.addEventListener("change", onSystemThemeChange);
            } else {
                systemQuery.addListener(onSystemThemeChange);
            }
        }

        window.addEventListener("storage", function (event) {
            if (event.key === storageKey) applyTheme(getSavedTheme(), false);
        });
    }

    // This script is loaded in <head>, so the correct theme is ready before first paint.
    applyTheme(getSavedTheme(), false);

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", setUpThemeControls);
    } else {
        setUpThemeControls();
    }
})();
