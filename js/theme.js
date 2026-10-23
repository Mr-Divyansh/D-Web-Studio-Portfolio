(function () {
    "use strict";

    var storageKey = "dweb-theme";

    function saveTheme(theme) {
        try {
            window.localStorage.setItem(storageKey, theme);
        } catch (error) {
            // The selected theme still applies when storage is unavailable.
        }
    }

    function getSavedTheme() {
        try {
            var savedTheme = window.localStorage.getItem(storageKey);
            // Always default to 'system' if nothing saved - keeps OS sync working
            return savedTheme || "system";
        } catch (error) {
            return "system";
        }
    }

    function applyTheme(theme, persist) {
        var resolvedTheme = theme;
        document.documentElement.setAttribute("data-theme", resolvedTheme);
        document.documentElement.setAttribute("data-theme-preference", theme);
        // Update meta theme-color to match --ink in CSS
        var themeColor = document.querySelector('meta[name="theme-color"]');
        if (themeColor) themeColor.content = "#0B0E13";
        // Update color-scheme meta tag
        var colorScheme = document.querySelector('meta[name="color-scheme"]');
        if (colorScheme) colorScheme.content = "dark";

        if (persist) saveTheme(theme);
    }

    // This script is loaded in <head>, so the correct theme is ready before first paint.
    applyTheme("system", true);

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", function () {
            applyTheme(getSavedTheme(), false);
        });
    } else {
        applyTheme(getSavedTheme(), false);
    }
})();
