# Fergus 3P — Weekly Goal Tracker

A weekly goal tracker built with Bun (server) and vanilla JavaScript (frontend), stored in JSON files.

---

## Contents

1. [What this app does](#what-this-app-does)
2. [Tech stack](#tech-stack)
3. [Running locally](#running-locally)
4. [Deploying to Railway — overview](#deploying-to-railway--overview)
5. [Step 1 — Push to GitHub](#step-1--push-to-github)
6. [Step 2 — Create a Railway project](#step-2--create-a-railway-project)
7. [Step 3 — Set up the Production environment](#step-3--set-up-the-production-environment)
8. [Step 4 — Add a Staging environment](#step-4--add-a-staging-environment)
9. [Step 5 — Verify both environments](#step-5--verify-both-environments)
10. [Day-to-day deployment workflow](#day-to-day-deployment-workflow)
11. [Project file structure](#project-file-structure)
12. [Known limitations](#known-limitations)

---

## What this app does

- Log in with a username and password (stored in `data/users.json`)
- Add goals for the current week
- Mark goals complete / incomplete
- Delete goals
- Progress bar showing % complete

---

## Tech stack

| Layer | Technology |
|---|---|
| Runtime | [Bun](https://bun.sh) (like Node.js, but faster to install and run) |
| Server | Bun's built-in HTTP server (`Bun.serve`) |
| Frontend | Vanilla HTML + CSS + JavaScript (no framework) |
| Storage | JSON files on disk (`data/users.json`, `data/goals.json`) |
| Hosting | [Railway](https://railway.app) |
| Source control | GitHub |

---

## Running locally

**Prerequisites:** Bun installed (`curl -fsSL https://bun.sh/install | bash`, then reopen terminal)

```bash
# from the project root
bun server.js
```

Then open `http://localhost:3000` in your browser.

Default test accounts (defined in `data/users.json`):

| Username | Password |
|---|---|
| `fergus` | `password123` |
| `admin` | `admin` |

---

## Deploying to Railway — overview

Railway uses a concept called **Environments** inside a single **Project**.

```
Railway Project: fergus-3p
├── Environment: production   ← linked to the "main" GitHub branch
└── Environment: staging      ← linked to the "staging" GitHub branch
```

Each environment gets its own public URL and is completely independent.

**The basic rule:**
- Push code to the `staging` branch → Railway automatically deploys to your **staging** URL
- Merge `staging` into `main` → Railway automatically deploys to your **production** URL

You test on staging first. When happy, promote to production by merging.

**Accounts you need (both free):**
- [GitHub](https://github.com) — stores your code
- [Railway](https://railway.app) — sign up with "Login with GitHub" so the two are linked

---

## Step 1 — Push to GitHub

### 1a. Create the GitHub repository

1. Go to [github.com](https://github.com) and log in
2. Click the **+** icon (top right) → **New repository**
3. Name it `fergus-3p` (or anything you like)
4. Set to **Public** or **Private** — either works
5. **Do not** tick "Add a README" or "Add .gitignore" — the repo must start empty
6. Click **Create repository**
7. Copy the repo URL shown on screen (looks like `https://github.com/YOUR-USERNAME/fergus-3p.git`)

### 1b. Initialise git locally and push

Run these commands from your project folder (`/home/twhelan/PROJECTS/FERGUS_3P`):

```bash
# Initialise a git repo in this folder
git init

# Stage all files for the first commit
git add .

# Create the first commit
git commit -m "Initial commit — working local app"

# Rename the default branch to "main" (GitHub's standard)
git branch -M main

# Connect your local repo to GitHub (replace with your actual URL)
git remote add origin https://github.com/YOUR-USERNAME/fergus-3p.git

# Push the main branch to GitHub
git push -u origin main
```

Reload your GitHub repo page — you should see all your files there.

### 1c. Create and push the staging branch

```bash
# Create a "staging" branch from main and switch to it
git checkout -b staging

# Push the staging branch to GitHub
git push -u origin staging
```

You now have two branches on GitHub: `main` and `staging`. Both contain identical code at this point.

---

## Step 2 — Create a Railway project

1. Go to [railway.app](https://railway.app) and log in (use "Login with GitHub")
2. Click **New Project**
3. Choose **Deploy from GitHub repo**
4. Authorise Railway to access your GitHub account if prompted
5. Select your `fergus-3p` repository from the list
6. Railway will show you a deployment screen — **do not click Deploy yet**, continue to the next step first

---

## Step 3 — Set up the Production environment

When Railway detects a Bun project it will ask how to run it. Configure it as follows:

### 3a. Set the start command

In the Railway service settings, find **Start Command** and set it to:

```
bun server.js
```

> Railway reads the `PORT` environment variable automatically and passes it to your app. The server already uses `process.env.PORT || 3000`, so this just works.

### 3b. Link to the main branch

In the Railway service settings, find **Source** → **Branch** and set it to `main`.

### 3c. Deploy

Click **Deploy**. Railway will:
1. Pull your code from the `main` branch on GitHub
2. Install dependencies (none needed for this app)
3. Run `bun server.js`
4. Give you a public URL (e.g. `https://fergus-3p-production.up.railway.app`)

### 3d. Get the production URL

In the Railway dashboard, click your service → **Settings** → **Networking** → **Generate Domain**.

Copy this URL — this is your **production URL**.

### 3e. Verify production works

Open the production URL in a browser. You should see the login page. Log in with `fergus` / `password123` and confirm the app works end-to-end.

---

## Step 4 — Add a Staging environment

### 4a. Create the staging environment

1. In your Railway project dashboard, look at the top of the page for an **environment selector** (it may say "production")
2. Click it → **New Environment**
3. Name it `staging`
4. Click **Create**

Railway switches you into the staging environment view. It will be empty — you need to add your service here too.

### 4b. Add the service to staging

1. Click **+ New** → **GitHub Repo**
2. Select your `fergus-3p` repository again
3. Set **Start Command** to `bun server.js` (same as production)
4. Set **Branch** to `staging`
5. Click **Deploy**

### 4c. Get the staging URL

In the staging environment, click your service → **Settings** → **Networking** → **Generate Domain**.

Copy this URL — this is your **staging URL**.

### 4d. Verify staging works

Open the staging URL. You should see the same login page. Log in and confirm it works.

> At this point both environments serve identical code because `main` and `staging` branches are identical. This is correct — staging is your test lane before changes reach production.

---

## Step 5 — Verify both environments

Quick checklist for each URL:

- [ ] Login page loads
- [ ] Login works with `fergus` / `password123`
- [ ] Goals page loads after login
- [ ] Can add a goal
- [ ] Can tick a goal complete (progress bar updates)
- [ ] Can delete a goal
- [ ] Logging out returns to login page

Both URLs should pass this checklist independently.

---

## Day-to-day deployment workflow

Once both environments are live, this is the normal process for shipping a change:

```
1. Make your code change locally
2. Test it locally with "bun server.js"
3. Commit and push to the staging branch:

     git add .
     git commit -m "describe your change"
     git push origin staging

4. Railway automatically deploys to the staging URL (takes ~1 minute)
5. Open the staging URL and test the change works
6. When satisfied, merge staging into main:

     git checkout main
     git merge staging
     git push origin main

7. Railway automatically deploys to the production URL (takes ~1 minute)
8. Verify the production URL looks correct
```

**Why this pattern?**
- `staging` is your safety net — you can break it freely while testing
- `production` only receives code that has been tested on staging first
- Railway handles all the "restart the server" work automatically on every push

---

## Project file structure

```
fergus-3p/
├── server.js          # Bun HTTP server — all API routes live here
├── package.json       # Project name and npm scripts (start, dev)
├── public/
│   ├── login.html     # Login page (served at /login)
│   └── index.html     # Goals page (served at /)
└── data/
    ├── users.json     # List of valid usernames and passwords
    └── goals.json     # Goals stored per username
```

### API routes (defined in server.js)

| Method | Path | What it does |
|---|---|---|
| GET | `/login` | Serves the login page |
| GET | `/` | Serves the goals page |
| POST | `/api/login` | Validates credentials, sets session cookie |
| POST | `/api/logout` | Clears session cookie |
| GET | `/api/me` | Returns the logged-in username (or 401) |
| GET | `/api/goals` | Returns all goals for the logged-in user |
| POST | `/api/goals` | Adds a new goal |
| POST | `/api/goals/:index/toggle` | Toggles done/undone on a goal |
| DELETE | `/api/goals/:index` | Deletes a goal |

---

## Known limitations

These are intentional simplifications for a learning project:

| Limitation | Why it exists | What you'd do in production |
|---|---|---|
| Passwords stored in plain text | Simplicity | Hash passwords with bcrypt |
| Sessions stored in memory | Simplicity | Use a database or Redis |
| Sessions reset on server restart | Follows from above | Persistent session store |
| Goals reset if Railway redeploys | JSON files on ephemeral filesystem | Use a real database (e.g. PostgreSQL) |
| No HTTPS enforced in code | Railway adds HTTPS automatically | Already handled by Railway |

---

*Built as a learning project — Bun + Vanilla JS + Railway.*
