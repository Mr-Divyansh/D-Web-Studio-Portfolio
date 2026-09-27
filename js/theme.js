(function () {
    "use strict";

    var storageKey = "dweb-theme";
    var systemQuery = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;

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

    function applyTheme(theme, persist) {
        var resolvedTheme = resolveTheme(theme);
        document.documentElement.setAttribute("data-theme", resolvedTheme);
        document.documentElement.setAttribute("data-theme-preference", theme);
        updateThemeMeta(resolvedTheme);
        updateThemeButtons(theme);

        if (persist) saveTheme(theme);
    }

    function setUpThemeControls() {
        applyTheme(getSavedTheme(), false);

        document.querySelectorAll("[data-theme-choice]").forEach(function (button) {
            button.addEventListener("click", function () {
                applyTheme(button.getAttribute("data-theme-choice"), true);
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
