# D Web Studio — Architecture

## 1. Architecture Goal

Keep the project simple, scalable, and easy to maintain.

The website should be structured so that new projects, services, pricing packages, and sections can be added without redesigning the entire application.

---

## 2. High-Level Structure

```text
D-Web-Studio-Portfolio/
│
├── index.html
│
├── assets/
│   ├── images/
│   ├── icons/
│   └── branding/
│
├── components/
│   ├── navbar
│   ├── hero
│   ├── services
│   ├── pricing
│   ├── why-website
│   ├── portfolio
│   ├── about
│   └── contact
│
├── data/
│   ├── projects
│   ├── services
│   └── pricing
│
└── documentation/
    ├── prd.md
    ├── architecture.md
    ├── phases.md
    ├── design.md
    ├── rules.md
    └── memory.md