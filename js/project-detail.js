/* project.html?slug= renderer.
 *
 * The cards on index.html / work.html link here with a shareable slug, so
 * this file is a page renderer, not an overlay controller: it reads the
 * slug from location.search and fills the detail sections of project.html.
 * The data is self-contained (name, copy, stack included) because the page
 * has no card markup to read those from. `live: ""` means the project has
 * no public URL (desktop app / concept), so View Live stays hidden. */
(function () {
    "use strict";
    var PROJECTS = {
        "attendx": { name: "AttendX", pill: "Web Application", about: "A modern attendance management platform designed around students, teachers and role-based workflows.", tech: ["Next.js", "Tailwind", "Prisma", "Postgres"], live: "https://attendx-ashy.vercel.app/", shots: ["img/ProjectImage/gallery/attendx-a.jpg", "img/ProjectImage/gallery/attendx-b.jpg", "img/ProjectImage/gallery/attendx-c.jpg"], captions: ["AttendX home view", "AttendX mid-page view", "AttendX lower-page view"], why: "Built to take attendance out of registers and spreadsheets, so students, teachers and role-based workflows live in one modern platform.", features: ["Role-based workflows for students and teachers", "Modern attendance management flow", "Full-stack data layer with Prisma and Postgres", "Responsive Tailwind interface"], facts: [["Type", "Web Application"], ["Status", "Live"], ["Stack", "Next.js, Tailwind, Prisma, Postgres"]] },
        "shadow-weaver": { name: "Shadow-Weaver", pill: "Cybersecurity", about: "Real-time AI cyber-defense SOC dashboard with multiple agents, threat monitoring and a Gemini-powered analyst.", tech: ["React", "TypeScript", "Python", "FastAPI"], live: "https://shadow-weaver.vercel.app/", shots: ["img/ProjectImage/gallery/shadow-weaver-a.jpg", "img/ProjectImage/gallery/shadow-weaver-b.jpg", "img/ProjectImage/gallery/shadow-weaver-c.jpg"], captions: ["Shadow-Weaver dashboard view", "Shadow-Weaver mid-page view", "Shadow-Weaver lower-page view"], why: "Built as a real-time AI cyber-defense SOC dashboard, so multiple agents, threat monitoring and a Gemini-powered analyst sit in one view.", features: ["Real-time SOC dashboard layout", "Multiple monitoring agents", "Threat monitoring views", "Gemini-powered analyst"], facts: [["Type", "Cybersecurity"], ["Status", "Live"], ["Stack", "React, TypeScript, Python, FastAPI"]] },
        "chika": { name: "CHIKA", pill: "Desktop AI", about: "A personal AI desktop companion built around conversational interaction and Gemini Live.", tech: ["Electron", "React", "Vite", "Gemini"], live: "", shots: ["img/ProjectImage/ChikaImage.jpg"], captions: ["CHIKA personal AI desktop companion preview"], why: "Built as a personal AI desktop companion around conversational interaction and Gemini Live, rather than another browser tab.", features: ["Conversational interaction", "Gemini Live integration", "Desktop companion experience", "Electron app shell"], facts: [["Type", "Desktop AI"], ["Status", "Desktop App"], ["Stack", "Electron, React, Vite, Gemini"]] },
        "dgymx": { name: "DGYMX", pill: "SaaS Concept", about: "A modern gym management system concept focused on members, payments, records and day-to-day gym operations.", tech: ["React", "Web", "Dashboard", "SaaS"], live: "", shots: ["img/ProjectImage/DgymxImage.png"], captions: ["DGYMX gym management dashboard preview"], why: "A concept for a modern gym management system, focused on members, payments, records and day-to-day gym operations.", features: ["Member management concept", "Payments and records concept", "Day-to-day operations dashboard", "SaaS dashboard layout"], facts: [["Type", "SaaS Concept"], ["Status", "Concept, In Progress"], ["Stack", "React, Web, Dashboard, SaaS"]] },
        "gloom": { name: "Gloom Hair & Beauty", pill: "Salon", about: "A luxury salon website with services, booking form, testimonials and a full pricing page.", tech: ["HTML", "CSS", "JavaScript", "Booking Form"], live: "https://gloom-hair-beauty.netlify.app/", shots: ["img/ProjectImage/gallery/gloom-hair-beauty-a.jpg", "img/ProjectImage/gallery/gloom-hair-beauty-b.jpg", "img/ProjectImage/gallery/gloom-hair-beauty-c.jpg"], captions: ["Gloom salon home view", "Gloom salon mid-page view", "Gloom salon lower-page view"], why: "Built to give a luxury salon a complete online presence: services, booking form, testimonials and a full pricing page in one site.", features: ["Services showcase", "Booking form", "Testimonials section", "Full pricing page"], facts: [["Type", "Salon"], ["Status", "Live"], ["Stack", "HTML, CSS, JavaScript, Booking Form"]] },
        "restaurant": { name: "Divyansh Restaurant", pill: "Restaurant", about: "A complete restaurant site with full menu, about page, team section and contact form.", tech: ["HTML", "CSS", "JavaScript", "Menu"], live: "https://divyansh-restaurant-studio.netlify.app/", shots: ["img/ProjectImage/gallery/divyansh-restaurant-a.jpg", "img/ProjectImage/gallery/divyansh-restaurant-b.jpg", "img/ProjectImage/gallery/divyansh-restaurant-c.jpg"], captions: ["Restaurant home view", "Restaurant mid-page view", "Restaurant lower-page view"], why: "Built as a complete restaurant site, so the full menu, about page, team section and contact form live together.", features: ["Full menu pages", "About page", "Team section", "Contact form"], facts: [["Type", "Restaurant"], ["Status", "Live"], ["Stack", "HTML, CSS, JavaScript, Menu"]] },
        "velour": { name: "VELOUR — New Collection", pill: "Landing Page", about: "A luxury clothing brand landing page with collection grid, testimonials and discount CTA.", tech: ["HTML", "CSS", "JavaScript", "Responsive"], live: "https://divyanshladingpage.netlify.app/", shots: ["img/ProjectImage/gallery/velour-a.jpg", "img/ProjectImage/gallery/velour-b.jpg", "img/ProjectImage/gallery/velour-c.jpg"], captions: ["Velour home view", "Velour mid-page view", "Velour lower-page view"], why: "Built as a luxury clothing brand landing page, pairing a collection grid and testimonials with a clear discount call to action.", features: ["Collection grid", "Testimonials section", "Discount call to action", "Responsive landing layout"], facts: [["Type", "Landing Page"], ["Status", "Live"], ["Stack", "HTML, CSS, JavaScript, Responsive"]] },
        "d-web-studio": { name: "D Web Studio", pill: "Portfolio", about: "A personal web studio portfolio designed to showcase development work, services, experience and ways to connect.", tech: ["HTML", "CSS", "JavaScript", "Responsive"], live: "https://divywebstudio-portfolio.vercel.app/", shots: ["img/ProjectImage/gallery/d-web-studio-a.jpg", "img/ProjectImage/gallery/d-web-studio-b.jpg", "img/ProjectImage/gallery/d-web-studio-c.jpg"], captions: ["Studio home view", "Studio mid-page view", "Studio lower-page view"], why: "Built as a personal web studio portfolio to showcase development work, services, experience and ways to connect.", features: ["Work showcase", "Services section", "Experience section", "Contact entry points"], facts: [["Type", "Portfolio"], ["Status", "Live"], ["Stack", "HTML, CSS, JavaScript, Responsive"]] },
        "prime-fitness": { name: "PRIME FITNESS", pill: "Fitness", about: "A modern gym & fitness website built around plans, programs and member enquiries.", tech: ["Website", "Responsive"], live: "https://prime-fitness-beta.vercel.app/", shots: ["img/ProjectImage/gallery/prime-fitness-a.jpg", "img/ProjectImage/gallery/prime-fitness-b.jpg", "img/ProjectImage/gallery/prime-fitness-c.jpg"], captions: ["Prime Fitness home view", "Prime Fitness mid-page view", "Prime Fitness lower-page view"], why: "Built as a modern gym and fitness website around plans, programs and member enquiries.", features: ["Plans showcase", "Programs showcase", "Member enquiry flow", "Responsive website layout"], facts: [["Type", "Fitness"], ["Status", "Live"], ["Stack", "Website, Responsive"]] },
        "himachal-tourism": { name: "Himachal Pradesh Tourism", pill: "Travel & Tourism", about: "A travel agency website for Himachal Pradesh — packages, destinations, photo gallery, reviews and trip enquiries.", tech: ["HTML", "CSS", "JavaScript", "Responsive"], live: "https://traveling-website-iota.vercel.app/", shots: ["img/ProjectImage/gallery/himachal-tourism-a.jpg", "img/ProjectImage/gallery/himachal-tourism-b.jpg", "img/ProjectImage/gallery/himachal-tourism-c.jpg"], captions: ["Himachal Tourism packages and destinations view", "Himachal Tourism reviews and FAQ view", "Himachal Tourism story and gallery view"], why: "Built as a complete online presence for a travel agency, so packages, destinations, reviews and ways to get in touch live in one site.", features: ["Packages and destinations pages", "Photo gallery with lightbox", "Reviews and FAQ sections", "Trip enquiry form"], facts: [["Type", "Travel & Tourism"], ["Status", "Live"], ["Stack", "HTML, CSS, JavaScript, Responsive"]] }
    };

    var h1El = document.getElementById("project-h1");
    var detailEl = document.getElementById("project-detail");
    var missingEl = document.getElementById("project-missing");
    var titleEl = document.getElementById("project-detail-title");
    var pillEl = document.getElementById("project-detail-pill");
    var aboutEl = document.getElementById("project-detail-about");
    var techEl = document.getElementById("project-detail-tech");
    var shotEl = document.getElementById("project-detail-shot");
    var thumbsEl = document.getElementById("project-detail-thumbs");
    var whyEl = document.getElementById("project-detail-why");
    var featsEl = document.getElementById("project-detail-features");
    var factsEl = document.getElementById("project-detail-facts");
    var liveEl = document.getElementById("project-detail-live");

    function setText(el, value) {
        if (el) el.textContent = value;
    }

    function setMeta(selector, value) {
        var el = document.querySelector(selector);
        if (el) el.setAttribute("content", value);
    }

    function showMissing() {
        if (detailEl) detailEl.hidden = true;
        if (missingEl) missingEl.hidden = false;
        setText(h1El, "Project not found.");
        document.title = "Project not found | D Web Studio";
    }

    var slug = new URLSearchParams(window.location.search).get("slug") || "";
    slug = slug.trim().toLowerCase();
    var info = PROJECTS[slug];
    if (!info) {
        showMissing();
        return;
    }

    // Head: page title, SEO tags and the detail header.
    var fullName = info.name + " \u2014 Project Case Study | D Web Studio";
    setText(h1El, info.name);
    document.title = fullName;
    setMeta('meta[property="og:title"]', fullName);
    setMeta('meta[property="og:description"]', info.about);
    setMeta('meta[name="description"]', info.about);
    setText(titleEl, info.name);
    setText(pillEl, info.pill);
    setText(aboutEl, info.about);
    // Stack chips.
    if (techEl) {
        techEl.innerHTML = "";
        for (var ti = 0; ti < info.tech.length; ti++) {
            var chip = document.createElement("span");
            chip.className = "tech-tag";
            chip.textContent = info.tech[ti];
            techEl.appendChild(chip);
        }
    }

    setText(whyEl, info.why);

    if (featsEl) {
        featsEl.innerHTML = "";
        for (var fi = 0; fi < info.features.length; fi++) {
            var fli = document.createElement("li");
            fli.textContent = info.features[fi];
            featsEl.appendChild(fli);
        }
    }

    if (factsEl) {
        factsEl.innerHTML = "";
        for (var gi = 0; gi < info.facts.length; gi++) {
            var dt = document.createElement("dt");
            dt.textContent = info.facts[gi][0];
            var dd = document.createElement("dd");
            dd.textContent = info.facts[gi][1];
            factsEl.appendChild(dt);
            factsEl.appendChild(dd);
        }
    }

    // Gallery: one large shot plus a thumbnail strip that swaps it.
    function setShot(src, alt) {
        if (!shotEl) return;
        shotEl.src = src;
        shotEl.alt = alt;
    }

    setShot(info.shots[0], info.captions[0] || info.name + " preview");

    if (thumbsEl) {
        thumbsEl.innerHTML = "";
        for (var si = 0; si < info.shots.length; si++) {
            (function (src, cap, idx) {
                var b = document.createElement("button");
                b.type = "button";
                b.setAttribute("aria-label", "Show " + cap);
                b.setAttribute("aria-current", idx === 0 ? "true" : "false");
                var im = document.createElement("img");
                im.src = src;
                im.alt = "";
                im.loading = "lazy";
                im.decoding = "async";
                im.width = 1440;
                im.height = 900;
                b.appendChild(im);
                b.addEventListener("click", function () {
                    setShot(src, cap);
                    var all = thumbsEl.querySelectorAll("button");
                    for (var k = 0; k < all.length; k++) all[k].setAttribute("aria-current", "false");
                    b.setAttribute("aria-current", "true");
                });
                thumbsEl.appendChild(b);
            })(info.shots[si], info.captions[si] || info.name + " preview", si);
        }
    }

    // Live link only when the project has a public URL.
    if (liveEl) {
        if (info.live) {
            liveEl.href = info.live;
            liveEl.hidden = false;
        } else {
            liveEl.hidden = true;
            liveEl.removeAttribute("href");
        }
    }

    if (detailEl) detailEl.hidden = false;
})();
