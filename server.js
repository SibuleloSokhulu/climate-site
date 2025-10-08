
/**
 * Minimal admin backend for "climate-site"
 * - Serves your existing static files (index.html, projects.html, etc.)
 * - Hidden admin panel at /admin
 * - Admin login at POST /auth/login (creates httpOnly cookie)
 * - Add/Edit projects via JSON storage + image upload
 *
 * HOW TO RUN (after copying into your climate-site folder):
 *   1) npm init -y
 *   2) npm install express multer cookie-parser jsonwebtoken dotenv uuid
 *   3) Copy .env.example to .env and set ADMIN_EMAIL, ADMIN_PASSWORD, JWT_SECRET
 *   4) node server.js
 *   5) Open http://localhost:3000/admin
 */

const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const { v4: uuidv4 } = require("uuid");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret_now";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "ChangeMe123!";

const siteRoot = __dirname; // should be the climate-site folder
const projectsFile = path.join(siteRoot, "projects.json");
const uploadsDir = path.join(siteRoot, "assets", "images", "projects");

fs.mkdirSync(uploadsDir, { recursive: true });

// Ensure projects.json exists
if (!fs.existsSync(projectsFile)) {
  fs.writeFileSync(projectsFile, "[]", "utf-8");
}

function readProjects() {
  try {
    const raw = fs.readFileSync(projectsFile, "utf-8");
    const data = JSON.parse(raw);
    // Migrate legacy `image` -> `images`, ensure images array exists
    return data.map((p) => {
      if (p.image && !p.images) {
        p.images = Array.isArray(p.image) ? p.image : [p.image];
        delete p.image;
      }
      p.images = p.images || [];
      return p;
    });
  } catch (e) {
    return [];
  }
}

function writeProjects(list) {
  fs.writeFileSync(projectsFile, JSON.stringify(list, null, 2), "utf-8");
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve your existing assets and pages statically from the same folder
app.use("/assets", express.static(path.join(siteRoot, "assets")));
app.use(express.static(siteRoot));

// ---- MULTER SETUP FOR IMAGE UPLOADS ----
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = `project-${Date.now()}-${uuidv4()}${ext}`;
    cb(null, name);
  },
});
const upload = multer({ storage });

// ---- AUTH HELPERS ----
function requireAuth(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ message: "Unauthorized" });
  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ message: "Unauthorized" });
  }
}

// Hidden admin page (served file)
app.get("/admin", (req, res) => {
  res.sendFile(path.join(siteRoot, "admin.html"));
});

// Login endpoint -> sets httpOnly cookie
app.post("/auth/login", (req, res) => {
  const { email, password } = req.body || {};
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    const token = jwt.sign({ role: "admin", email }, JWT_SECRET, {
      expiresIn: "2h",
    });
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "Lax",
      // secure: true, // enable if serving over https
      maxAge: 2 * 60 * 60 * 1000, // 2 hours
    });
    return res.json({ ok: true });
  }
  return res.status(401).json({ ok: false, message: "Invalid credentials" });
});

app.post("/auth/logout", (req, res) => {
  res.clearCookie("token", { httpOnly: true, sameSite: "Lax" });
  res.json({ ok: true });
});

// ---- API: PUBLIC ----
app.get("/api/projects", (req, res) => {
  const list = readProjects();
  // Sort newest first by date (fall back to createdAt)
  list.sort((a, b) => {
    const da = new Date(a.date || a.createdAt || 0).getTime();
    const db = new Date(b.date || b.createdAt || 0).getTime();
    return db - da;
  });
  res.json(list);
});

app.get("/api/projects/:id", (req, res) => {
  const list = readProjects();
  const item = list.find((p) => p.id === req.params.id);
  if (!item) return res.status(404).json({ message: "Not found" });
  res.json(item);
});

// ---- API: ADMIN (ADD/EDIT) ----
app.post("/api/projects", requireAuth, upload.array("images", 10), (req, res) => {
  const { title, summary, date, outcomes, results, purpose } = req.body;
  if (!title || !summary || !date || !results) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const files = req.files || [];
  const images = files.map((f) =>
    path.join("assets", "images", "projects", f.filename).replace(/\\/g, "/")
  );

  const list = readProjects();
  const id = uuidv4();

  const outcomesArray = (outcomes || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  const item = {
    id,
    title,
    images,           // <-- array
    summary,
    date,
    outcomes: outcomesArray, // will be shown as Project Leaders
    results,
    purpose: purpose || "",
    createdAt: new Date().toISOString(),
  };

  list.push(item);
  writeProjects(list);

  res.json({ ok: true, project: item });
});

// --- REPLACE your PUT /api/projects/:id route with this (handle add/remove/append/makePrimary) ---
app.put("/api/projects/:id", requireAuth, upload.array("images", 10), (req, res) => {
  const list = readProjects();
  const idx = list.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: "Not found" });

  const { title, summary, date, outcomes, results, purpose } = req.body;

  if (typeof title === "string") list[idx].title = title;
  if (typeof summary === "string") list[idx].summary = summary;
  if (typeof date === "string") list[idx].date = date;
  if (typeof results === "string") list[idx].results = results;
  if (typeof purpose === "string") list[idx].purpose = purpose;

  if (typeof outcomes === "string") {
    list[idx].outcomes = outcomes
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  // -- handle removal of images --
  if (req.body.removeImages) {
    let removeList = [];
    try {
      removeList = JSON.parse(req.body.removeImages);
      if (!Array.isArray(removeList)) removeList = [];
    } catch (e) {
      removeList = String(req.body.removeImages)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    removeList.forEach((rem) => {
      // rem can be a full web path or filename -> match by endsWith or equality
      const imgIndex = (list[idx].images || []).findIndex(
        (img) => img === rem || img.endsWith(rem)
      );
      if (imgIndex !== -1) {
        const removed = list[idx].images.splice(imgIndex, 1)[0];
        // delete file from disk if exists
        const fileOnDisk = path.join(siteRoot, removed);
        try {
          if (fs.existsSync(fileOnDisk)) fs.unlinkSync(fileOnDisk);
        } catch (err) {
          // ignore deletion errors
        }
      }
    });
  }

  // -- handle new uploaded files (append) --
  if (req.files && req.files.length) {
    list[idx].images = list[idx].images || [];
    req.files.forEach((f) => {
      const webPath = path
        .join("assets", "images", "projects", f.filename)
        .replace(/\\/g, "/");
      list[idx].images.push(webPath);
    });
  }

  // -- handle set primary (makePrimary can be index or filename) --
  if (req.body.makePrimary) {
    const mp = req.body.makePrimary;
    let targetIndex = -1;
    const asInt = parseInt(mp, 10);
    if (!Number.isNaN(asInt) && asInt >= 0 && asInt < list[idx].images.length) {
      targetIndex = asInt;
    } else {
      targetIndex = list[idx].images.findIndex(
        (img) => img === mp || img.endsWith(mp)
      );
    }
    if (targetIndex > 0) {
      const [img] = list[idx].images.splice(targetIndex, 1);
      list[idx].images.unshift(img);
    }
  }

  writeProjects(list);
  res.json({ ok: true, project: list[idx] });
});

// --- MODIFY your DELETE /api/projects/:id handler to also remove image files from disk ---
app.delete("/api/projects/:id", requireAuth, (req, res) => {
  const list = readProjects();
  const idx = list.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: "Not found" });

  const removed = list.splice(idx, 1)[0];

  // remove associated image files
  if (removed.images && removed.images.length) {
    removed.images.forEach((img) => {
      const fileOnDisk = path.join(siteRoot, img);
      try {
        if (fs.existsSync(fileOnDisk)) fs.unlinkSync(fileOnDisk);
      } catch (err) {
        // ignore
      }
    });
  }

  writeProjects(list);

  res.json({ ok: true, deleted: removed });
})



/**
 * Dynamic project page (no change to your existing static pages).
 * View any project at /project/:id with the same style as your project-1.html
 */
// Replace the existing app.get('/project/:id', ...) HTML generation with this updated template body
app.get("/project/:id", (req, res) => {
  const list = readProjects();
  const item = list.find((p) => p.id === req.params.id);
  if (!item) return res.status(404).send("Project not found");

  const safe = (s) =>
    String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const outcomesHtml = (item.outcomes || [])
    .map((o) => `<li>${safe(o)}</li>`)
    .join("");

  const images = item.images || [];
  const primary = images[0] || ""; // may be empty — frontend JS will handle placeholder

  const imagesJson = JSON.stringify(images);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${safe(item.title)} — Project — CGC</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = { theme: { extend: { colors: { brandGreen: '#16a34a', brandBlue: '#2563eb', brandRed: '#ef4444' }, boxShadow: { soft: '0 10px 30px rgba(0,0,0,0.10)' } } } }
  </script>
  <style>
    #site-header { background-color: #7b584e; transition: background-color .3s ease, box-shadow .3s ease, padding .3s ease; padding: 20px 0; }
    #site-header.scrolled { background-color: #9d847d; box-shadow: 0 4px 15px rgba(0,0,0,.1); padding: 12px 0; }
    #site-header a { position: relative; transition: color .3s ease; color: white; }
    #site-header a::after { content:''; position:absolute; width:0%; height:2px; left:0; bottom:-3px; background-color:currentColor; transition:width .3s ease; }
    #site-header a:hover::after { width:100%; }
    .dot { width:12px; height:12px; border-radius:9999px; border:2px solid rgba(0,0,0,0.12); display:inline-block; cursor:pointer; }
    .dot.active { background-color: rgba(0,0,0,0.8); border-color: rgba(0,0,0,0.8); }
  </style>
</head>
<body class="bg-white text-slate-800">
  <header id="site-header" class="fixed top-0 inset-x-0 z-50 bg-[#bababa] py-3 transition-colors duration-500">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between">
        <a href="/index.html" class="flex items-center gap-2">
          <img src="/assets/images/logo.png" alt="CGC Logo" class="h-10 w-10 sm:h-12 sm:w-12 object-contain" />
          <span class="text-lg sm:text-xl font-semibold">Center For Global Climate Change</span>
        </a>
        <nav aria-label="Primary" class="hidden md:flex items-center gap-6 text-[15px]">
          <a href="/index.html#about" class="text-slate-800 hover:text-slate-900">About</a>
          <a href="/index.html#work" class="text-slate-800 hover:text-slate-900">Our Work</a>
          <a href="/index.html#team" class="text-slate-800 hover:text-slate-900">Team</a>
          <a href="/index.html#contact" class="text-slate-800 hover:text-slate-900">Contact</a>
        </nav>
      </div>
    </div>
  </header>

  <main class="mt-[100px] max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <a href="/projects.html" class="text-sm text-brandBlue hover:underline">← Back to all projects</a>
    <h1 class="mt-6 text-3xl font-bold">${safe(item.title)}</h1>

    <div class="relative mt-8 rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
      <img id="mainProjectImage" src="${primary ? "/" + safe(primary) : "/assets/images/placeholder.png"}" alt="Project image" class="w-full h-72 object-cover" loading="lazy" />

      <!-- Prev Button -->
      <button id="prevBtn" class="absolute top-1/2 left-3 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-[#EECCA0] border border-black text-black font-bold text-lg">
        &lt;
      </button>

      <!-- Next Button -->
      <button id="nextBtn" class="absolute top-1/2 right-3 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-[#EECCA0] border border-black text-black font-bold text-lg">
        &gt;
      </button>
    </div>

    <div id="galleryDots" class="mt-3 flex gap-2 justify-center"></div>

    <p class="mt-2 text-slate-500">${safe(item.date || "")}</p>

    <section class="mt-8 space-y-4 text-slate-700">
      <h2 class="text-xl font-semibold">Summary</h2>
      <p>${safe(item.summary)}</p>

      <h2 class="text-xl font-semibold mt-6">Project Leaders</h2>
      <ul class="list-disc pl-5">
        ${outcomesHtml}
      </ul>

      <h2 class="text-xl font-semibold mt-6">The purpose of the project</h2>
      <p>${safe(item.purpose || "")}</p>

      <h2 class="text-xl font-semibold mt-6">Results</h2>
      <p>${safe(item.results || "")}</p>
    </section>
  </main>

  <footer class="border-t border-slate-200 py-8 text-center text-sm text-slate-500">
    © <span id="year"></span> Center For Global Climate Change. All rights reserved.
  </footer>

  <script>
    document.getElementById('year').textContent = new Date().getFullYear();

    // client-side gallery logic
    (function(){
      const images = ${imagesJson};
      const main = document.getElementById('mainProjectImage');
      const dots = document.getElementById('galleryDots');
      const prevBtn = document.getElementById('prevBtn');
      const nextBtn = document.getElementById('nextBtn');
      let cur = 0;

      function setImage(i){
        cur = i;
        const src = images[i] ? '/' + images[i].replace(/^\\/+/, '') : '/assets/images/placeholder.png';
        main.src = src;
        renderDots();
      }

      function renderDots(){
        dots.innerHTML = '';
        if (!images || images.length <= 1) return; // no dots for 0 or 1 image
        images.forEach((img, i) => {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'dot ' + (i === cur ? 'active' : '');
          b.setAttribute('aria-label', 'Show image ' + (i+1));
          b.addEventListener('click', () => setImage(i));
          dots.appendChild(b);
        });
      }

      function prevImage() {
        if (!images.length) return;
        const i = (cur - 1 + images.length) % images.length;
        setImage(i);
      }

      function nextImage() {
        if (!images.length) return;
        const i = (cur + 1) % images.length;
        setImage(i);
      }

      if (prevBtn) prevBtn.addEventListener("click", prevImage);
      if (nextBtn) nextBtn.addEventListener("click", nextImage);

      // Init
      if (images && images.length) {
        setImage(0);
      } else {
        main.src = '/assets/images/placeholder.png';
      }
    })();
  </script>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(html);
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log(`   Admin panel: http://localhost:${PORT}/admin`);
});
