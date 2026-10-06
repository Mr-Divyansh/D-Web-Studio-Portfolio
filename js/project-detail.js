(function () {
    "use strict";
    var grid = document.getElementById("projects-grid");
    var detail = document.getElementById("project-detail");
    if (!grid || !detail) return;
    var EXTRA = {
        "attendx": { live: "https://attendx-ashy.vercel.app/", shots: ["img/ProjectImage/gallery/attendx-a.jpg", "img/ProjectImage/gallery/attendx-b.jpg", "img/ProjectImage/gallery/attendx-c.jpg"], captions: ["AttendX home view", "AttendX mid-page view", "AttendX lower-page view"], why: "Built to take attendance out of registers and spreadsheets, so students, teachers and role-based workflows live in one modern platform.", features: ["Role-based workflows for students and teachers", "Modern attendance management flow", "Full-stack data layer with Prisma and Postgres", "Responsive Tailwind interface"], facts: [["Type", "Web Application"], ["Status", "Live"], ["Stack", "Next.js, Tailwind, Prisma, Postgres"]] },
        "shadow-weaver": { live: "https://shadow-weaver.vercel.app/", shots: ["img/ProjectImage/gallery/shadow-weaver-a.jpg", "img/ProjectImage/gallery/shadow-weaver-b.jpg", "img/ProjectImage/gallery/shadow-weaver-c.jpg"], captions: ["Shadow-Weaver dashboard view", "Shadow-Weaver mid-page view", "Shadow-Weaver lower-page view"], why: "Built as a real-time AI cyber-defense SOC dashboard, so multiple agents, threat monitoring and a Gemini-powered analyst sit in one view.", features: ["Real-time SOC dashboard layout", "Multiple monitoring agents", "Threat monitoring views", "Gemini-powered analyst"], facts: [["Type", "Cybersecurity"], ["Status", "Live"], ["Stack", "React, TypeScript, Python, FastAPI"]] },
        "chika": { live: "", shots: ["img/ProjectImage/ChikaImage.jpg"], captions: ["CHIKA personal AI desktop companion preview"], why: "Built as a personal AI desktop companion around conversational interaction and Gemini Live, rather than another browser tab.", features: ["Conversational interaction", "Gemini Live integration", "Desktop companion experience", "Electron app shell"], facts: [["Type", "Desktop AI"], ["Status", "Desktop App"], ["Stack", "Electron, React, Vite, Gemini"]] },
        "dgymx": { live: "", shots: ["img/ProjectImage/DgymxImage.png"], captions: ["DGYMX gym management dashboard preview"], why: "A concept for a modern gym management system, focused on members, payments, records and day-to-day gym operations.", features: ["Member management concept", "Payments and records concept", "Day-to-day operations dashboard", "SaaS dashboard layout"], facts: [["Type", "SaaS Concept"], ["Status", "Concept, In Progress"], ["Stack", "React, Web, Dashboard, SaaS"]] },
        "gloom": { live: "https://gloom-hair-beauty.netlify.app/", shots: ["img/ProjectImage/gallery/gloom-hair-beauty-a.jpg", "img/ProjectImage/gallery/gloom-hair-beauty-b.jpg", "img/ProjectImage/gallery/gloom-hair-beauty-c.jpg"], captions: ["Gloom salon home view", "Gloom salon mid-page view", "Gloom salon lower-page view"], why: "Built to give a luxury salon a complete online presence: services, booking form, testimonials and a full pricing page in one site.", features: ["Services showcase", "Booking form", "Testimonials section", "Full pricing page"], facts: [["Type", "Salon"], ["Status", "Live"], ["Stack", "HTML, CSS, JavaScript, Booking Form"]] },
        "restaurant": { live: "https://divyansh-restaurant-studio.netlify.app/", shots: ["img/ProjectImage/gallery/divyansh-restaurant-a.jpg", "img/ProjectImage/gallery/divyansh-restaurant-b.jpg", "img/ProjectImage/gallery/divyansh-restaurant-c.jpg"], captions: ["Restaurant home view", "Restaurant mid-page view", "Restaurant lower-page view"], why: "Built as a complete restaurant site, so the full menu, about page, team section and contact form live together.", features: ["Full menu pages", "About page", "Team section", "Contact form"], facts: [["Type", "Restaurant"], ["Status", "Live"], ["Stack", "HTML, CSS, JavaScript, Menu"]] },
        "velour": { live: "https://divyanshladingpage.netlify.app/", shots: ["img/ProjectImage/gallery/velour-a.jpg", "img/ProjectImage/gallery/velour-b.jpg", "img/ProjectImage/gallery/velour-c.jpg"], captions: ["Velour home view", "Velour mid-page view", "Velour lower-page view"], why: "Built as a luxury clothing brand landing page, pairing a collection grid and testimonials with a clear discount call to action.", features: ["Collection grid", "Testimonials section", "Discount call to action", "Responsive landing layout"], facts: [["Type", "Landing Page"], ["Status", "Live"], ["Stack", "HTML, CSS, JavaScript, Responsive"]] },
        "d-web-studio": { live: "https://divywebstudio-portfolio.vercel.app/", shots: ["img/ProjectImage/gallery/d-web-studio-a.jpg", "img/ProjectImage/gallery/d-web-studio-b.jpg", "img/ProjectImage/gallery/d-web-studio-c.jpg"], captions: ["Studio home view", "Studio mid-page view", "Studio lower-page view"], why: "Built as a personal web studio portfolio to showcase development work, services, experience and ways to connect.", features: ["Work showcase", "Services section", "Experience section", "Contact entry points"], facts: [["Type", "Portfolio"], ["Status", "Live"], ["Stack", "HTML, CSS, JavaScript, Responsive"]] },
        "prime-fitness": { live: "https://prime-fitness-beta.vercel.app/", shots: ["img/ProjectImage/gallery/prime-fitness-a.jpg", "img/ProjectImage/gallery/prime-fitness-b.jpg", "img/ProjectImage/gallery/prime-fitness-c.jpg"], captions: ["Prime Fitness home view", "Prime Fitness mid-page view", "Prime Fitness lower-page view"], why: "Built as a modern gym and fitness website around plans, programs and member enquiries.", features: ["Plans showcase", "Programs showcase", "Member enquiry flow", "Responsive website layout"], facts: [["Type", "Fitness"], ["Status", "Live"], ["Stack", "Website, Responsive"]] }
    };
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
    var backEl = document.getElementById("project-detail-back");
    function setShot(src, alt) {
        shotEl.src = src;
        shotEl.alt = alt;
    }
    function openDetail(card) {
        var slug = card.getAttribute("data-project");
        var info = EXTRA[slug];
        if (!info) return;
        var nameNode = card.querySelector("h3");
        var rawName = nameNode ? nameNode.textContent : slug;
        titleEl.textContent = rawName.replace("↗", "").trim();
        var pillNode = card.querySelector(".tagpill");
        pillEl.textContent = pillNode ? pillNode.textContent.trim() : "Project";
        var aboutNode = card.querySelector(".project-body p");
        aboutEl.textContent = aboutNode ? aboutNode.textContent.replace(/\s+/g, " ").trim() : "";
        techEl.innerHTML = "";
        var techs = card.querySelectorAll(".tech-row .tech-tag");
        for (var ti = 0; ti < techs.length; ti++) {
            var chip = document.createElement("span");
            chip.className = "tech-tag";
            chip.textContent = techs[ti].textContent.trim();
            techEl.appendChild(chip);
        }
        whyEl.textContent = info.why;
        featsEl.innerHTML = "";
        for (var fi = 0; fi < info.features.length; fi++) {
            var fli = document.createElement("li");
            fli.textContent = info.features[fi];
            featsEl.appendChild(fli);
        }
        factsEl.innerHTML = "";
        for (var gi = 0; gi < info.facts.length; gi++) {
            var dt = document.createElement("dt");
            dt.textContent = info.facts[gi][0];
            var dd = document.createElement("dd");
            dd.textContent = info.facts[gi][1];
            factsEl.appendChild(dt);
            factsEl.appendChild(dd);
        }
        var mainImg = card.querySelector(".project-thumb img");
        var mainAlt = mainImg ? (mainImg.getAttribute("alt") || titleEl.textContent) : titleEl.textContent;
        setShot(info.shots[0], info.captions[0] || mainAlt);
        thumbsEl.innerHTML = "";
        for (var si = 0; si < info.shots.length; si++) {
            (function (src, cap, idx) {
                var b = document.createElement("button");
                b.type = "button";
                b.setAttribute("aria-label", "Show " + cap);
                b.setAttribute("aria-current", idx === 0 ? "true" : "false");
                var im = document.createElement("img");
                im.src = src;
                im.alt = cap;
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
            })(info.shots[si], info.captions[si] || mainAlt, si);
        }
        if (info.live) {
            liveEl.hidden = false;
            liveEl.href = info.live;
        } else {
            liveEl.hidden = true;
            liveEl.removeAttribute("href");
        }
        detail.hidden = false;
        detail.scrollIntoView({ behavior: "smooth", block: "start" });
        backEl.focus();
    }
    function closeDetail() {
        detail.hidden = true;
        grid.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    grid.addEventListener("click", function (event) {
        var card = event.target.closest ? event.target.closest("[data-project]") : null;
        if (!card || !grid.contains(card)) return;
        event.preventDefault();
        openDetail(card);
    });
    grid.addEventListener("keydown", function (event) {
        if (event.key !== "Enter" && event.key !== " ") return;
        var card = event.target.closest ? event.target.closest("[data-project]") : null;
        if (!card || !grid.contains(card)) return;
        if (event.target !== card) return;
        event.preventDefault();
        openDetail(card);
    });
    backEl.addEventListener("click", closeDetail);
    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && !detail.hidden) closeDetail();
    });
})();
