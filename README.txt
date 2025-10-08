CLIMATE-SITE — ADMIN BACKEND STARTER
====================================

This folder contains files you can copy into your existing "climate-site" folder on your Desktop.
It adds a hidden admin panel and JSON storage for projects without changing your public pages.

FILES
-----
- server.js        -> The Node/Express server
- projects.json    -> Where project data is stored
- admin.html       -> Hidden admin panel (open at http://localhost:3000/admin)
- .env.example     -> Copy to .env and set your admin email, password, and JWT secret

BABY STEPS (Windows)
--------------------
1) Make a backup of your "climate-site" folder (right-click > Copy, then Paste somewhere safe).

2) Install Node.js (if you don't have it):
   - Go to https://nodejs.org and install the LTS version.
   - Open "Command Prompt" and type:  node -v   (you should see a version number)

3) Copy the files:
   - Open this starter folder and copy ALL the files (server.js, admin.html, projects.json, .env.example)
   - Paste them into your "climate-site" folder on your Desktop.

4) Open Command Prompt:
   - Type:  cd Sibulelo.Sokhulu\Desktop\climate-site
   - Type:  npm init -y
   - Type:  npm install express multer cookie-parser jsonwebtoken dotenv uuid

5) Create your .env:
   - In the "climate-site" folder, duplicate ".env.example" and rename it to ".env"
   - Open ".env" and set:
       ADMIN_EMAIL=your@email.com
       ADMIN_PASSWORD=YourStrongPassword123!
       JWT_SECRET=MakeThisALongRandomString

6) Start the server:
   - Type:  node server.js
   - If you see "Server running at http://localhost:3000", you're good.

7) Open the Admin Panel:
   - In your browser go to:  http://localhost:3000/admin
   - Log in using the email and password you set in .env

8) Add a project:
   - Fill in the Title, Image, Summary, Date, Outcomes (one per line), Results.
   - Click "Add Project".
   - You can see and edit projects on the same page.

9) View a project page:
   - Click "View page" on any project in the admin list.
   - It will open a full project page at:  http://localhost:3000/project/<id>

OPTIONAL — Show new projects in your projects.html list:
--------------------------------------------------------
Later, when you're ready, I can give you a one-line script to include in your existing projects.html to auto-list all projects from projects.json. For now, your existing static cards will still show.
