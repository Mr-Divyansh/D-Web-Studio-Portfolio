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
        drawer.inert = true;

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
            drawer.inert = false;
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
            drawer.inert = true;
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

        /* Placing the panel (index.html's capability cards only).

           The panel is a sibling of the cards, never a child: placeFeaturePanel
           moves it into .features-row as a full-width row directly below the
           row of the card that opened it, and grid auto-placement drops the
           remaining cards underneath. Column count is read from the resolved
           tracks so the placement is right at every breakpoint (4-up, 2-up,
           stacked). The anchor marks where the parent card sits above the
           panel, for the gradient notch on the panel's top edge. */
        var featureColumnCount = function (row) {
            var tracks = window.getComputedStyle(row).gridTemplateColumns;
            if (!tracks || tracks === "none") return 1;
            var count = tracks.split(" ").filter(Boolean).length;
            return count > 0 ? count : 1;
        };

        var placeFeaturePanel = function (item, panel) {
            var row = item.parentNode;
            var cards = Array.prototype.filter.call(row.children, function (el) {
                return el.classList && el.classList.contains("feature-item");
            });
            var index = cards.indexOf(item);
            if (index < 0) return;

            var cols = featureColumnCount(row);
            var lastInRow = Math.min(cards.length - 1, Math.floor(index / cols) * cols + cols - 1);
            var after = cards[lastInRow];
            if (panel.previousElementSibling !== after) {
                row.insertBefore(panel, after.nextSibling);
            }

            var cardBox = item.getBoundingClientRect();
            var panelBox = panel.getBoundingClientRect();
            var anchor = cardBox.left + cardBox.width / 2 - panelBox.left;
            anchor = Math.max(40, Math.min(panelBox.width - 40, anchor));
            panel.style.setProperty("--feature-anchor", Math.round(anchor) + "px");
        };

        /* Height animation for the capability panels.

           `panel.hidden` is what keeps a closed panel out of the tab order, but
           flipping it switches the panel on and off in the same frame, so it
           snaps. The animation instead keeps `hidden` off for the duration and
           drives the visible height with an inline style:

             close  measure -> pin to that px -> flush reflow -> 0px -> hidden
             open   0px -> flush reflow -> measured px, then release to auto

           The `void panel.offsetHeight` reads are not dead code. Reading a
           layout property is what forces the browser to register the starting
           height before the ending one is assigned; without it both assignments
           collapse into a single style recalc and there is nothing to animate
           between. The open target is measured with the panel at `height: auto`
           so the border is part of it and releasing the inline height at the
           end cannot pop; on release the panel falls back to `height: auto` -
           the copy re-wraps at some viewport widths, and a hard-coded pixel
           height would clip it the moment the window narrowed. */
        var setFeatureExpanded = function (item, expanded) {
            var toggle = item.querySelector(".feature-toggle");
            var panel = toggle ? document.getElementById(toggle.getAttribute("aria-controls")) : null;

            if (!toggle || !panel) return;

            toggle.setAttribute("aria-expanded", expanded ? "true" : "false");

            // Move the panel into the grid before measuring it: its width, and
            // therefore its text wrap, only exist once it sits unhidden in the
            // row (a [hidden] panel reports a zero rect, which would park the
            // anchor notch at the panel's left edge).
            if (expanded) {
                panel.hidden = false;
                placeFeaturePanel(item, panel);
            }

            if (reduceMotion) {
                panel.hidden = !expanded;
                panel.style.height = "";
                panel.classList.toggle("open", expanded);
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
                panel.style.height = "auto";
                var target = panel.offsetHeight;
                panel.style.height = "0px";
                void panel.offsetHeight;
                item.classList.add("open");
                panel.classList.add("open");
                panel.style.height = target + "px";
            } else {
                item.classList.remove("open");
                panel.classList.remove("open");
                panel.style.height = panel.offsetHeight + "px";
                void panel.offsetHeight;
                panel.style.height = "0px";
            }

            panel._featureOnSettled = onSettled;
            panel.addEventListener("transitionend", onSettled);
        };

        featureItems.forEach(function (item) {
            var toggle = item.querySelector(".feature-toggle");
            if (!toggle) return;

            // The whole card is the click target: a click that did not start
            // on the button (card padding, heading, icon chip) is forwarded to
            // it. The guard keeps the event from looping back through this
            // listener, so the button's own click never fires twice.
            item.addEventListener("click", function (event) {
                if (event.target.closest && event.target.closest(".feature-toggle")) return;
                toggle.click();
            });

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
                } else if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
                    setFeatureExpanded(item, false);
                    return;
                }

                if (nextIndex !== null) {
                    event.preventDefault();
                    featureToggles[nextIndex].focus();
                }
            });
        });

        // The row an open panel sits in changes with the column count, so a
        // resize has to re-place it and re-aim the notch under its card.
        var repositionFeaturePanel = function () {
            for (var i = 0; i < featureItems.length; i++) {
                var openToggle = featureItems[i].querySelector(".feature-toggle");
                if (openToggle && openToggle.getAttribute("aria-expanded") === "true") {
                    var openPanel = document.getElementById(openToggle.getAttribute("aria-controls"));
                    if (openPanel) placeFeaturePanel(featureItems[i], openPanel);
                    break;
                }
            }
        };
        var repositionTimer = null;
        window.addEventListener("resize", function () {
            clearTimeout(repositionTimer);
            repositionTimer = setTimeout(repositionFeaturePanel, 150);
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
