(function () {
    "use strict";

    var yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    var nav = document.getElementById("siteNav");

    if (nav) {
        var onScroll = function () {
            nav.classList.toggle("scrolled", window.scrollY > 30);
        };
        document.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
    }

    var hamburger = document.getElementById("hamburger");
    var drawer = document.getElementById("mobileDrawer");
    var backdrop = document.getElementById("mobileBackdrop");
    var closeBtn = document.getElementById("drawerClose");

    if (hamburger && drawer && backdrop && closeBtn) {
        var pageContent = null;

        var inertPage = function (inert) {
            if (!pageContent) {
                pageContent = [];
                var skip = function (el) { return el === drawer || el === backdrop || drawer.contains(el); };
                [document.body.children].forEach(function (children) {
                    for (var i = 0; i < children.length; i++) {
                        if (!skip(children[i])) pageContent.push(children[i]);
                    }
                });
            }
            pageContent.forEach(function (el) {
                if (inert) {
                    el.setAttribute("inert", "");
                } else {
                    el.removeAttribute("inert");
                }
            });
        };

        var openDrawer = function () {
            drawer.classList.add("open");
            backdrop.classList.add("open");
            hamburger.classList.add("active");
            hamburger.setAttribute("aria-expanded", "true");
            drawer.setAttribute("aria-hidden", "false");
            document.body.classList.add("menu-open");
            inertPage(true);
            var first = drawer.querySelector("a, button");
            if (first) first.focus();
        };

        var closeDrawer = function (returnFocus) {
            if (!drawer.classList.contains("open")) return;
            drawer.classList.remove("open");
            backdrop.classList.remove("open");
            hamburger.classList.remove("active");
            hamburger.setAttribute("aria-expanded", "false");
            drawer.setAttribute("aria-hidden", "true");
            document.body.classList.remove("menu-open");
            inertPage(false);
            if (returnFocus !== false && hamburger.offsetParent !== null) hamburger.focus();
        };

        hamburger.addEventListener("click", function () {
            drawer.classList.contains("open") ? closeDrawer() : openDrawer();
        });

        closeBtn.addEventListener("click", function () { closeDrawer(); });
        backdrop.addEventListener("click", function () { closeDrawer(); });

        drawer.querySelectorAll("a").forEach(function (link) {
            link.addEventListener("click", function () { closeDrawer(false); });
        });

        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape") closeDrawer();
        });
    }

    var featureItems = document.querySelectorAll(".feature-item");

    if (featureItems.length) {
        var featureToggles = document.querySelectorAll(".feature-toggle");

        var setFeatureExpanded = function (item, expanded) {
            var toggle = item.querySelector(".feature-toggle");
            var panel = toggle ? document.getElementById(toggle.getAttribute("aria-controls")) : null;

            if (!toggle || !panel) return;

            toggle.setAttribute("aria-expanded", expanded ? "true" : "false");
            panel.hidden = !expanded;
            item.classList.toggle("open", expanded);
        };

        featureItems.forEach(function (item) {
            var toggle = item.querySelector(".feature-toggle");
            if (!toggle) return;

            toggle.addEventListener("click", function () {
                var shouldOpen = toggle.getAttribute("aria-expanded") !== "true";

                featureItems.forEach(function (currentItem) {
                    setFeatureExpanded(currentItem, false);
                });

                if (shouldOpen) setFeatureExpanded(item, true);
            });

            toggle.addEventListener("keydown", function (event) {
                var currentIndex = Array.prototype.indexOf.call(featureToggles, toggle);
                var nextIndex = null;

                if (event.key === "ArrowDown" || event.key === "ArrowRight") {
                    nextIndex = (currentIndex + 1) % featureToggles.length;
                } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
                    nextIndex = (currentIndex - 1 + featureToggles.length) % featureToggles.length;
                } else if (event.key === "Home") {
                    nextIndex = 0;
                } else if (event.key === "End") {
                    nextIndex = featureToggles.length - 1;
                }

                if (nextIndex !== null) {
                    event.preventDefault();
                    featureToggles[nextIndex].focus();
                }
            });
        });
    }

    var revealEls = document.querySelectorAll(".reveal");

    if (revealEls.length) {
        if ("IntersectionObserver" in window) {
            var observer = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("in");
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });

            revealEls.forEach(function (el) {
                observer.observe(el);
            });
        } else {
            revealEls.forEach(function (el) {
                el.classList.add("in");
            });
        }
    }
})();

function initLucideIcons() {
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initLucideIcons);
} else {
    initLucideIcons();
}
