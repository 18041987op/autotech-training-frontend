// =============================================================================
// TRAINING BACKEND — server.js ADDITIONS
// =============================================================================
// Paste these three sections into your server.js:
//
//  SECTION 1 → Near the top, after your existing requires/env vars
//  SECTION 2 → After your existing route definitions (before app.listen)
//  SECTION 3 → SQL — run once in your Supabase SQL editor (training project)
// =============================================================================


// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — Environment variables (add these to Render + your .env)
// ─────────────────────────────────────────────────────────────────────────────
//
//   PAYROLL_API_KEY=<same key you put in the payroll portal>
//   PAYROLL_API_URL=https://your-payroll-portal.vercel.app
//
// The variables are already read below via process.env — no code change needed
// here, just make sure they're set in Render's Environment settings.


// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — Three new routes to add to server.js
// ─────────────────────────────────────────────────────────────────────────────

const PAYROLL_API_KEY = process.env.PAYROLL_API_KEY;
const PAYROLL_API_URL = process.env.PAYROLL_API_URL || "https://your-payroll-portal.vercel.app";

// ── GET /api/payroll-metrics ──────────────────────────────────────────────────
// Proxy call to the payroll portal's /api/employee-metrics endpoint.
// Uses the logged-in user's email as the lookup key.
// The API key never leaves the server.

app.get("/api/payroll-metrics", authenticateToken, async (req, res) => {
  try {
    if (!PAYROLL_API_KEY || !PAYROLL_API_URL) {
      return res.status(503).json({ error: "Payroll integration not configured" });
    }

    const email = (req.user?.email || "").toLowerCase().trim();
    if (!email) {
      return res.status(400).json({ error: "User email not found in token" });
    }

    const url = `${PAYROLL_API_URL}/api/employee-metrics?email=${encodeURIComponent(email)}`;

    const response = await fetch(url, {
      method:  "GET",
      headers: {
        Authorization: `Bearer ${PAYROLL_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      // Forward the error status so the frontend hook handles 404 gracefully
      return res.status(response.status).json(data);
    }

    return res.json(data);
  } catch (err) {
    console.error("[/api/payroll-metrics] error:", err.message);
    return res.status(500).json({ error: "Failed to fetch payroll metrics" });
  }
});


// ── GET /api/checkin/pending ──────────────────────────────────────────────────
// Returns { pending: true/false, role: string }
// pending = true when:
//   1. The payroll portal says checkin_needed = true (metrics below threshold)
//   2. AND the employee hasn't submitted a check-in in the last 7 days

app.get("/api/checkin/pending", authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    const email  = (req.user?.email || "").toLowerCase().trim();

    if (!userId || !email) {
      return res.status(400).json({ error: "Invalid token" });
    }

    // Step 1 — check if payroll says a check-in is needed
    let checkinNeeded = false;
    let isTech = true;

    if (PAYROLL_API_KEY && PAYROLL_API_URL) {
      try {
        const url = `${PAYROLL_API_URL}/api/employee-metrics?email=${encodeURIComponent(email)}`;
        const r   = await fetch(url, {
          headers: { Authorization: `Bearer ${PAYROLL_API_KEY}` },
        });
        if (r.ok) {
          const d    = await r.json();
          checkinNeeded = d.checkin_needed === true;
          isTech        = d.employee?.is_tech ?? true;
        }
      } catch {
        // Payroll unreachable — don't block the user
        checkinNeeded = false;
      }
    }

    if (!checkinNeeded) {
      return res.json({ pending: false, role: req.user?.role });
    }

    // Step 2 — check if already submitted within the last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: recentCheckin } = await supabase
      .from("checkin_responses")
      .select("id")
      .eq("user_id", userId)
      .gte("submitted_at", sevenDaysAgo)
      .limit(1)
      .single();

    const alreadySubmitted = !!recentCheckin;

    return res.json({
      pending: !alreadySubmitted,
      role:    req.user?.role,
      is_tech: isTech,
    });
  } catch (err) {
    console.error("[/api/checkin/pending] error:", err.message);
    return res.status(500).json({ error: "Failed to check check-in status" });
  }
});


// ── Category → module search keyword mapping ──────────────────────────────────
const CATEGORY_MODULE_KEYWORDS = {
  brakes:      ["brake", "brakes"],
  suspension:  ["suspension", "steering", "alignment"],
  diagnostics: ["diagnostic", "electronics", "electrical", "scan"],
  engine:      ["engine", "performance", "oil", "coolant"],
  maintenance: ["maintenance", "preventive", "inspection", "fluid"],
  presenting:  ["sales", "advisor", "customer", "presentation"],
  declined:    ["declined", "follow", "upsell", "sales"],
  estimates:   ["estimate", "pricing", "quote"],
  techComm:    ["communication", "teamwork"],
};

// Helper: find a relevant module from the DB matching a check-in category
async function findRecommendedModule(category) {
  // "other" or free-text → no specific recommendation
  if (!category || category === "other" || category.startsWith("other:")) return null;

  const keywords = CATEGORY_MODULE_KEYWORDS[category];
  if (!keywords || keywords.length === 0) return null;

  try {
    // Try to find a module matching any keyword (case-insensitive in title or category)
    for (const kw of keywords) {
      const { data: modules } = await supabase
        .from("modules")
        .select("id, title, category")
        .ilike("title", `%${kw}%`)
        .limit(1);

      if (modules && modules.length > 0) return modules[0];

      // Also try category field
      const { data: catModules } = await supabase
        .from("modules")
        .select("id, title, category")
        .ilike("category", `%${kw}%`)
        .limit(1);

      if (catModules && catModules.length > 0) return catModules[0];
    }
  } catch (e) {
    console.warn("[findRecommendedModule] error:", e.message);
  }
  return null;
}


// ── POST /api/checkin ─────────────────────────────────────────────────────────
// Saves the employee's weekly check-in response.
// Body: { category: string, is_tech: boolean, submitted_at: ISO string }
// Returns: { checkin, recommended_module? }

app.post("/api/checkin", authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    const email  = (req.user?.email || "").toLowerCase().trim();

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { category, is_tech, submitted_at } = req.body;

    if (!category) {
      return res.status(400).json({ error: "category is required" });
    }

    const { data, error } = await supabase
      .from("checkin_responses")
      .insert({
        user_id:      userId,
        email,
        category,
        is_tech:      is_tech ?? true,
        submitted_at: submitted_at || new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("[/api/checkin] supabase error:", error.message);
      return res.status(500).json({ error: error.message });
    }

    // Find a relevant module to recommend based on the selected category
    const recommendedModule = await findRecommendedModule(category);

    return res.status(201).json({
      checkin: data,
      ...(recommendedModule ? { recommended_module: recommendedModule } : {}),
    });
  } catch (err) {
    console.error("[/api/checkin] error:", err.message);
    return res.status(500).json({ error: "Failed to save check-in" });
  }
});


// ── GET /api/admin/suggestions ────────────────────────────────────────────────
// Returns all check-in responses with user names for the admin Suggestions tab.
// Admin only.

app.get("/api/admin/suggestions", authenticateToken, async (req, res) => {
  try {
    // Only admins can access this endpoint
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    // Fetch checkin_responses joined with user names
    // We use a join via the users table (user_id FK)
    const { data: responses, error } = await supabase
      .from("checkin_responses")
      .select("id, user_id, email, category, is_tech, submitted_at, module_created")
      .order("submitted_at", { ascending: false })
      .limit(200);

    if (error) {
      console.error("[/api/admin/suggestions] supabase error:", error.message);
      return res.status(500).json({ error: error.message });
    }

    // Fetch user names for the user_ids
    const userIds = [...new Set((responses ?? []).map((r) => r.user_id))];
    let userMap = {};

    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from("users")
        .select("id, name, email")
        .in("id", userIds);

      for (const u of users ?? []) {
        userMap[u.id] = u.name || u.email;
      }
    }

    // Merge names into responses
    const suggestions = (responses ?? []).map((r) => ({
      ...r,
      user_name: userMap[r.user_id] ?? r.email,
    }));

    return res.json({ suggestions, total: suggestions.length });
  } catch (err) {
    console.error("[/api/admin/suggestions] error:", err.message);
    return res.status(500).json({ error: "Failed to fetch suggestions" });
  }
});


// ── PATCH /api/admin/suggestions/:id/mark-created ────────────────────────────
// Marks a suggestion as "module created" so it shows as resolved in the UI.

app.patch("/api/admin/suggestions/:id/mark-created", authenticateToken, async (req, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { id } = req.params;

    const { error } = await supabase
      .from("checkin_responses")
      .update({ module_created: true })
      .eq("id", id);

    if (error) return res.status(500).json({ error: error.message });

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});


// =============================================================================
// SECTION 3 — SQL migration (run in Supabase SQL editor — TRAINING project)
// =============================================================================
//
// -- Create checkin_responses table
// CREATE TABLE IF NOT EXISTS checkin_responses (
//   id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//   user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
//   email        TEXT NOT NULL,
//   category     TEXT NOT NULL,
//   is_tech      BOOLEAN NOT NULL DEFAULT true,
//   submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
//   created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
// );
//
// -- Index for fast lookup (check if submitted in last 7 days)
// CREATE INDEX IF NOT EXISTS idx_checkin_responses_user_submitted
//   ON checkin_responses (user_id, submitted_at DESC);
//
// -- Index for analytics (which categories are most common)
// CREATE INDEX IF NOT EXISTS idx_checkin_responses_category
//   ON checkin_responses (category, is_tech);
//
// =============================================================================
