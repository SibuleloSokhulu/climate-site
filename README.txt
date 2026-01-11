# Center For Global Climate Change — Web Platform

## Overview

The Center For Global Climate Change (CGCC) Web Platform is a full‑stack, content‑managed website designed to support a climate‑focused research and community organization. The site presents the organisation’s mission, research projects, news/events, and team members, while providing a secure, private admin console that allows non‑technical staff to manage content without modifying source code.

This project was built as a practical demonstration of front‑end engineering, UI/UX structure, and lightweight backend integration suitable for real‑world organisational use.

---

## Key Features

### Public‑Facing Website

* **Responsive design** built with Tailwind CSS, optimised for mobile, tablet, and desktop screens.
* **Clear information architecture**: purpose, work/projects, team, and contact sections.
* **Dynamic content rendering** for projects and news/events.
* **Accessible navigation** with keyboard‑friendly menus and skip‑to‑content support.
* **Modern UI patterns** including animated headers, card‑based layouts, and consistent branding.

### Team Page

* Dedicated team section showcasing organisational leadership and contributors.
* Profile cards include roles, qualifications, short personal statements, and contact links.
* Fully responsive grid layout that adapts cleanly across screen sizes.

### Admin Console (Private)

* **Hidden admin panel** not linked from the public site.
* Secure **login‑based access** using authenticated backend routes.
* Create, edit, and delete:

  * Projects
  * News and events
* Upload and manage multiple images per item.
* Edit metadata such as dates, authors, categories, tags, and featured status.
* Inline editing with immediate visual feedback.

This admin system demonstrates practical CRUD operations and real‑world content workflows.

---

## Technology Stack

### Frontend

* **HTML5** for semantic structure
* **Tailwind CSS (CDN)** for styling and responsive design
* **Vanilla JavaScript** for interactivity and state handling

### Backend (Integration‑Ready)

* REST‑style API endpoints (e.g. `/api/projects`, `/api/news`)
* Authentication routes (`/auth/login`, `/auth/logout`)
* Designed to work with a Node.js/Express backend
* Cookie‑based session handling for admin authentication

### Assets

* Local image storage for uploaded media
* Graceful fallbacks for missing images

```


## Usage

### Public Access

Visitors can browse the website freely to:

* Learn about the organisation’s purpose and climate initiatives
* View ongoing and past projects
* Read news and event updates
* Explore the team behind the organisation

### Admin Access

The admin panel is intended for authorised users only:

* Navigate directly to `admin.html`
* Log in using valid admin credentials
* Manage content without touching code

This separation reflects common production‑grade security and content‑management practices.

---

## Design & Development Goals

* Demonstrate **clean, maintainable front‑end code** without heavy frameworks
* Apply **realistic organisational requirements**, not toy examples
* Balance visual polish with performance and clarity
* Showcase ability to design both **public interfaces** and **internal tools**

---

## Intended Audience

This project is suitable for:

* Employers reviewing front‑end or junior full‑stack development skills
* Organisations needing a lightweight, custom CMS‑style website
* Developers learning practical CRUD‑based admin dashboards

---

## Author

Developed by **Sibulelo Sokhulu** as part of a broader web development and software engineering portfolio.

The project demonstrates practical skills in UI design, JavaScript logic, content management workflows, and system organisation.

---

## Notes for Reviewers

* The admin panel is intentionally hidden from public navigation.
* Styling is handled entirely with Tailwind CSS for clarity and scalability.
* No external JavaScript frameworks were used, by design.
* The project can be extended easily with database persistence, role‑based access, or deployment tooling.

---

Thank you for reviewing this project.
