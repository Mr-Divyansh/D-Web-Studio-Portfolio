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
            // The accessible name has to follow the state, not just aria-expanded:
            // left as "Open menu" the button announces the opposite of what it does
            // while the drawer is open.
            hamburger.setAttribute("aria-label", "Close menu");
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
            hamburger.setAttribute("aria-label", "Open menu");
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

        var reduceMotion = window.matchMedia
            ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
            : false;

        /* Height animation for the capability panels.

           `panel.hidden` is what keeps a closed panel out of the tab order, but
           flipping it switches the panel on and off in the same frame, so it
           snaps. The animation instead keeps `hidden` off for the duration and
           drives the visible height with an inline style:

             close  measure -> pin to that px -> flush reflow -> 0px -> hidden
             open   0px -> flush reflow -> measured px, then release to auto

           The two `void panel.offsetHeight` reads are not dead code. Reading a
           layout property is what forces the browser to register the starting
           height before the ending one is assigned; without it both assignments
           collapse into a single style recalc and there is nothing to animate
           between. On open the inline height is released at the end so the
           panel falls back to `height: auto` - the titles wrap to two lines at
           some viewport widths, and a hard-coded pixel height would clip the
           text the moment the window narrowed. */
        var setFeatureExpanded = function (item, expanded) {
            var toggle = item.querySelector(".feature-toggle");
            var panel = toggle ? document.getElementById(toggle.getAttribute("aria-controls")) : null;

            if (!toggle || !panel) return;

            toggle.setAttribute("aria-expanded", expanded ? "true" : "false");

            if (reduceMotion) {
                panel.hidden = !expanded;
                panel.style.height = "";
                item.classList.toggle("open", expanded);
                return;
            }

            // Drop whatever the previous toggle left running, or a quick
            // double-click would strand a stale height and a stray listener.
            if (panel._featureOnSettled) {
                panel.removeEventListener("transitionend", panel._featureOnSettled);
                panel._featureOnSettled = null;
            }
            if (panel._featureTimer) {
                clearTimeout(panel._featureTimer);
                panel._featureTimer = null;
            }

            var onSettled = function (event) {
                if (event && event.propertyName !== "height") return;

                panel.removeEventListener("transitionend", onSettled);
                panel._featureOnSettled = null;
                clearTimeout(panel._featureTimer);
                panel._featureTimer = null;
                panel.style.height = "";

                if (!expanded) panel.hidden = true;
            };

            // Backstop. If the transition never fires - the tab is backgrounded
            // mid-animation, or a transition is cancelled by a layout change -
            // the panel would otherwise be left stuck part-way.
            panel._featureTimer = setTimeout(onSettled, 600);

            if (expanded) {
                panel.hidden = false;
                panel.style.height = "0px";
                void panel.offsetHeight;
                item.classList.add("open");
                panel.style.height = panel.scrollHeight + "px";
            } else {
                item.classList.remove("open");
                panel.style.height = panel.scrollHeight + "px";
                void panel.offsetHeight;
                panel.style.height = "0px";
            }

            panel._featureOnSettled = onSettled;
            panel.addEventListener("transitionend", onSettled);
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

/* ---------- Mobile drawer entrance (anime.js) ----------
   Progressive enhancement, fully decoupled from openDrawer()/closeDrawer()
   above: it only *watches* #mobileDrawer's class attribute instead of
   hooking into those functions, so it can never fight their own state or
   transitions. No-ops completely if anime.js didn't load (CDN blocked, CSP,
   offline) or the visitor prefers reduced motion - the drawer still opens
   exactly as it always did, just without the stagger.

   Same readiness pattern as initLucideIcons() below: anime.js is loaded with
   `defer` in <head>, and this file is a plain synchronous <script> near the
   end of <body>, so it runs *before* deferred scripts do. Checking
   `window.anime` immediately would always see it as undefined - waiting for
   DOMContentLoaded (which fires only after every deferred script has run) is
   what makes the check meaningful. */
function initDrawerAnimation() {
    if (typeof window.anime === "undefined") return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    var drawer = document.getElementById("mobileDrawer");
    if (!drawer) return;

    var wasOpen = false;

    var animateDrawerContent = function () {
        var items = drawer.querySelectorAll(".mobile-nav-list a, .theme-option, .mobile-drawer-cta");
        if (!items.length) return;

        anime.remove(items);
        anime({
            targets: items,
            opacity: [0, 1],
            translateX: [18, 0],
            duration: 420,
            easing: "easeOutQuad",
            delay: anime.stagger(45, { start: 90 })
        });
    };

    var observer = new MutationObserver(function () {
        var isOpen = drawer.classList.contains("open");
        if (isOpen && !wasOpen) animateDrawerContent();
        wasOpen = isOpen;
    });

    observer.observe(drawer, { attributes: true, attributeFilter: ["class"] });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initDrawerAnimation);
} else {
    initDrawerAnimation();
}
