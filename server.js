import { join } from "path";

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = join(import.meta.dir, "public");
const DATA_DIR   = join(import.meta.dir, "data");

// ---------- simple in-memory session store ----------
// Maps sessionId -> username. Resets on server restart (fine for learning).
const sessions = {};

function makeSessionId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function getSessionUser(req) {
  const cookie = req.headers.get("cookie") || "";
  const match  = cookie.match(/session=([^;]+)/);
  return match ? sessions[match[1]] : null;
}

// ---------- JSON file helpers ----------
async function readJSON(filename) {
  const file = Bun.file(join(DATA_DIR, filename));
  return await file.json();
}

async function writeJSON(filename, data) {
  await Bun.write(join(DATA_DIR, filename), JSON.stringify(data, null, 2));
}

// ---------- server ----------
Bun.serve({
  port: PORT,

  async fetch(req) {
    const url    = new URL(req.url);
    const path   = url.pathname;
    const method = req.method;

    // ---- HTML pages ----
    if (path === "/login" && method === "GET") {
      return serveFile(join(PUBLIC_DIR, "login.html"));
    }
    if ((path === "/" || path === "/index.html") && method === "GET") {
      return serveFile(join(PUBLIC_DIR, "index.html"));
    }

    // ---- API: login ----
    if (path === "/api/login" && method === "POST") {
      const { username, password } = await req.json();
      const users = await readJSON("users.json");
      const user  = users.find(u => u.username === username && u.password === password);

      if (!user) return json({ error: "Invalid credentials" }, 401);

      const sessionId = makeSessionId();
      sessions[sessionId] = username;

      return json({ ok: true }, 200, {
        "Set-Cookie": `session=${sessionId}; HttpOnly; Path=/`,
      });
    }

    // ---- API: logout ----
    if (path === "/api/logout" && method === "POST") {
      const cookie = req.headers.get("cookie") || "";
      const match  = cookie.match(/session=([^;]+)/);
      if (match) delete sessions[match[1]];
      return json({ ok: true }, 200, {
        "Set-Cookie": "session=; HttpOnly; Path=/; Max-Age=0",
      });
    }

    // ---- API: who am I? ----
    if (path === "/api/me" && method === "GET") {
      const username = getSessionUser(req);
      if (!username) return json({ error: "Not logged in" }, 401);
      return json({ username });
    }

    // ---- API: get goals ----
    if (path === "/api/goals" && method === "GET") {
      const username = getSessionUser(req);
      if (!username) return json({ error: "Not logged in" }, 401);

      const allGoals = await readJSON("goals.json");
      return json(allGoals[username] || []);
    }

    // ---- API: add goal ----
    if (path === "/api/goals" && method === "POST") {
      const username = getSessionUser(req);
      if (!username) return json({ error: "Not logged in" }, 401);

      const { text } = await req.json();
      if (!text?.trim()) return json({ error: "Goal text required" }, 400);

      const allGoals = await readJSON("goals.json");
      if (!allGoals[username]) allGoals[username] = [];
      allGoals[username].push({ text: text.trim(), done: false });
      await writeJSON("goals.json", allGoals);

      return json({ ok: true });
    }

    // ---- API: toggle goal done/undone ----
    const toggleMatch = path.match(/^\/api\/goals\/(\d+)\/toggle$/);
    if (toggleMatch && method === "POST") {
      const username = getSessionUser(req);
      if (!username) return json({ error: "Not logged in" }, 401);

      const index    = parseInt(toggleMatch[1]);
      const allGoals = await readJSON("goals.json");
      const goals    = allGoals[username] || [];

      if (!goals[index]) return json({ error: "Goal not found" }, 404);
      goals[index].done = !goals[index].done;
      await writeJSON("goals.json", allGoals);

      return json({ ok: true });
    }

    // ---- API: delete goal ----
    const deleteMatch = path.match(/^\/api\/goals\/(\d+)$/);
    if (deleteMatch && method === "DELETE") {
      const username = getSessionUser(req);
      if (!username) return json({ error: "Not logged in" }, 401);

      const index    = parseInt(deleteMatch[1]);
      const allGoals = await readJSON("goals.json");
      const goals    = allGoals[username] || [];

      if (!goals[index]) return json({ error: "Goal not found" }, 404);
      goals.splice(index, 1);
      await writeJSON("goals.json", allGoals);

      return json({ ok: true });
    }

    return new Response("Not found", { status: 404 });
  },
});

console.log(`Server running at http://localhost:${PORT}`);

// ---------- helpers ----------
function serveFile(filePath) {
  const file = Bun.file(filePath);
  return new Response(file, { headers: { "Content-Type": "text/html" } });
}

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...extraHeaders },
  });
}
