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


// ── POST /api/checkin ─────────────────────────────────────────────────────────
// Saves the employee's weekly check-in response.
// Body: { category: string, is_tech: boolean, submitted_at: ISO string }

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

    return res.status(201).json({ checkin: data });
  } catch (err) {
    console.error("[/api/checkin] error:", err.message);
    return res.status(500).json({ error: "Failed to save check-in" });
  }
});


// =============================================================================
// SECTION 3 — SQL migration (run in Supabase SQL editor — TRAINING project)
// =============================================================================
//
// -- Create checkin_responses table
// CREATE TABLE IF NOT EXISTS checkin_responses (
//   id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//   user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
