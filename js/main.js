(function () {
    "use strict";

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
            // restore focus only if the hamburger is actually visible
            // (it is display:none above 900px; also covers resize-while-open)
            if (returnFocus !== false && hamburger.offsetParent !== null) hamburger.focus();
        };

        hamburger.addEventListener("click", function () {
            drawer.classList.contains("open") ? closeDrawer() : openDrawer();
        });

        closeBtn.addEventListener("click", function () { closeDrawer(); });
        backdrop.addEventListener("click", function () { closeDrawer(); });

        drawer.querySelectorAll("a").forEach(function (link) {
            link.addEventListener("click", function () { closeDrawer(false); });
            // navigating: don't yank focus back to the hamburger mid-navigation
        });

        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape") closeDrawer();
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
