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

        /* setFeatureExpanded on its own snaps, because `hidden` goes straight
           from display:none to display:block. This wrapper animates instead:
           pin the start height, flush a reflow so the browser registers it as
           the starting frame, then hand the final height to the CSS transition
           and drop the inline height once it lands - so a later resize can
           re-measure instead of being stuck at a stale pixel value.

           Keep FEATURE_ANIM_MS at or just above the height transition in
           .feature-panel (0.42s); it is the fallback that still runs if the
           transition is interrupted or never fires. */
        var FEATURE_ANIM_MS = 460;
        var featureMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
        var featureSettleTimers = new WeakMap();

        var animateFeatureExpanded = function (item, expanded) {
            var toggle = item.querySelector(".feature-toggle");
            var panel = toggle ? document.getElementById(toggle.getAttribute("aria-controls")) : null;

            if (!toggle || !panel) return;

            /* A click landing mid-animation cancels the previous settle, which
               is what makes fast clicking work: the interrupted state is simply
               used as the new starting height. */
            var pending = featureSettleTimers.get(panel);
            if (pending) {
                clearTimeout(pending);
                featureSettleTimers.delete(panel);
            }

            if (featureMotion.matches) {
                panel.style.height = "";
                panel.style.opacity = "";
                setFeatureExpanded(item, expanded);
                return;
            }

            if (expanded) {
                /* Un-hide while still collapsed, so scrollHeight can be read
                   and the grow has a 0px frame to start from. */
                setFeatureExpanded(item, true);
                var full = panel.scrollHeight;

                panel.style.height = "0px";
                panel.style.opacity = "0";
                void panel.offsetHeight;
                panel.style.height = full + "px";
                panel.style.opacity = "1";
            } else {
                /* Freeze wherever the grow had reached, then collapse from
                   there. aria-expanded and .open flip immediately so the card
                   styling matches; `hidden` waits for the end of the collapse
                   in the settle callback. */
                var current = panel.scrollHeight;

                panel.style.height = current + "px";
                panel.style.opacity = "1";
                void panel.offsetHeight;
                panel.style.height = "0px";
                panel.style.opacity = "0";
                item.classList.remove("open");
                toggle.setAttribute("aria-expanded", "false");
            }

            featureSettleTimers.set(panel, setTimeout(function () {
                featureSettleTimers.delete(panel);
                panel.style.height = "";
                panel.style.opacity = "";
                if (!expanded) setFeatureExpanded(item, false);
            }, FEATURE_ANIM_MS));
        };

        featureItems.forEach(function (item) {
            var toggle = item.querySelector(".feature-toggle");
            if (!toggle) return;

            toggle.addEventListener("click", function () {
                var shouldOpen = toggle.getAttribute("aria-expanded") !== "true";

                /* One at a time: close every sibling, then toggle this one.
                   `item` is skipped in the loop so a closed card never plays a
                   collapse it is about to undo. */
                featureItems.forEach(function (currentItem) {
                    if (currentItem === item) return;
                    animateFeatureExpanded(currentItem, false);
                });

                animateFeatureExpanded(item, shouldOpen);
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
