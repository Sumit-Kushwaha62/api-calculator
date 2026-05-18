// backend/routes/calculate.js
// UGC 2018 API Score Calculation Engine
// POST /api/calculate — requires JWT auth

const express = require("express");
const router = express.Router();
const pool = require("../db");
const { verifyToken } = require("../middleware/auth"); // adjust path if needed

// ─────────────────────────────────────────────
// CONSTANTS — UGC 2018
// ─────────────────────────────────────────────

const MINIMUMS = {
  "Assistant Professor (Stage 1)": { cat1: 75, cat2: 15, cat3: 10, min_cat3_categories: 0 },
  "Assistant Professor (Stage 2)": { cat1: 75, cat2: 15, cat3: 20, min_cat3_categories: 0 },
  "Assistant Professor (Stage 3)": { cat1: 75, cat2: 15, cat3: 30, min_cat3_categories: 3 },
  "Associate Professor":           { cat1: 75, cat2: 15, cat3: 40, min_cat3_categories: 3 },
  "Professor":                     { cat1: 75, cat2: 15, cat3: 50, min_cat3_categories: 3 },
};

// Research paper scores — Arts group. Science = Arts * 1.25
const PAPER_SCORES_ARTS = {
  "non_refereed":    2,
  "refereed":        5,
  "if_lt_1":         8,
  "if_1_2":         10,
  "if_2_5":         12,
  "if_5_10":        15,
  "if_gt_10":       20,
};

// Author-type multipliers for papers
function paperAuthorMultiplier(authorType) {
  switch (authorType) {
    case "single":   return 1.0;
    case "two":      return 0.70;
    case "first":    return 0.70;
    case "joint":    return 0.30;
    default:         return 1.0;
  }
}

// ─────────────────────────────────────────────
// CALCULATION HELPERS
// ─────────────────────────────────────────────

function calcResearchPapers(papers = [], discipline) {
  const isScience = discipline === "Science";
  let total = 0;
  const breakdown = [];

  for (const p of papers) {
    const base = PAPER_SCORES_ARTS[p.journalType] ?? 0;
    const multiplier = paperAuthorMultiplier(p.authorType);
    let score = base * multiplier;
    if (isScience) score *= 1.25;
    score = Math.round(score * 100) / 100;
    total += score;
    breakdown.push({ ...p, score });
  }

  return { total: Math.round(total * 100) / 100, breakdown };
}

function calcBooks(books = []) {
  const BOOK_SCORES = {
    "book_international": 12,
    "book_national":       8,
    "chapter":             5,
    "editor_international": 10,
    "editor_national":      8,
    "translation_chapter":  3,
    "translation_book":     8,
  };

  let total = 0;
  const breakdown = [];

  for (const b of books) {
    const score = BOOK_SCORES[b.type] ?? 0;
    total += score;
    breakdown.push({ ...b, score });
  }

  return { total, breakdown };
}

function calcPhdProjects(items = []) {
  const PHD_SCORES = {
    "phd_awarded_single":   10,
    "phd_awarded_joint":     7,
    "phd_awarded_cosup":     3,
    "phd_submitted_single":  7,
    "phd_submitted_joint":   5,
    "phd_submitted_cosup":   3,
    "mphil":                  3,
    "pg_dissertation":        2,
    "project_major_single":  10,
    "project_major_pi":       8,
    "project_major_copi":     5,
    "project_minor_single":   5,
    "project_minor_pi":       4,
    "project_minor_copi":     3,
    "project_ongoing_major":  5,
    "project_ongoing_minor":  2,
  };

  let total = 0;
  const breakdown = [];

  for (const item of items) {
    const score = PHD_SCORES[item.type] ?? 0;
    total += score;
    breakdown.push({ ...item, score });
  }

  return { total, breakdown };
}

function calcPatentsAwards(items = []) {
  const SCORES = {
    patent_international:       10,
    patent_national:             7,
    policy_document_international: 10,
    policy_document_national:    7,
    policy_document_state:       4,
    award_international:         7,
    award_national:              5,
  };

  let patentsTotal = 0;
  let policyDocTotal = 0;
  let awardsTotal = 0;
  const breakdown = [];

  for (const item of items) {
    const key = `${item.type}_${item.level}`;
    const score = SCORES[key] ?? item.score ?? 0;
    breakdown.push({ ...item, score });

    if (item.type === "patent")          patentsTotal += score;
    if (item.type === "policy_document") policyDocTotal += score;
    if (item.type === "award")           awardsTotal += score;
  }

  return {
    total: patentsTotal + policyDocTotal + awardsTotal,
    patentsTotal,
    policyDocTotal,
    awardsTotal,
    breakdown,
  };
}

function calcLectures(items = []) {
  const SCORES = {
    "international_abroad":  7,
    "international_within":  5,
    "national":              3,
    "state_university":      2,
  };

  let total = 0;
  const breakdown = [];

  for (const item of items) {
    const score = SCORES[item.level] ?? item.score ?? 0;
    total += score;
    breakdown.push({ ...item, score });
  }

  return { total, breakdown };
}

// Cat I — Teaching Score (UGC 2018 formula)
// Each entry: { allotted, actual, type: 'lecture_tutorial' | 'practical' }
function calcCatI(teachingData = []) {
  // If frontend sends pre-calculated score (manual input mode), use it
  if (typeof teachingData === "number") return teachingData;

  // Otherwise calculate
  let score = 0;
  for (const t of teachingData) {
    if (!t.allotted || t.allotted === 0) continue;
    if (t.type === "practical") {
      score += (t.actual / t.allotted) * (60 / 105) * 100;
    } else {
      score += (t.actual / t.allotted) * (100 / 105) * 100;
    }
  }

  return Math.min(Math.round(score * 100) / 100, 100); // max 100
}

// ─────────────────────────────────────────────
// MAIN ROUTE: POST /api/calculate
// ─────────────────────────────────────────────

router.post("/", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      regulation,
      discipline,
      designation,
      institutionType,
      statePSC,
      purpose,

      // Cat I — can be number (manual) or array (detailed)
      cat1_teaching,
      cat1_admin,

      // Cat II
      cat2_co_curricular,

      // Cat III sections
      research_papers,
      books,
      phd_projects,
      patents_awards,
      lectures,
      moocs,
    } = req.body;

    // ── Cat I ──────────────────────────────────
    const teachingScore = calcCatI(cat1_teaching ?? 0);
    const adminScore = typeof cat1_admin === "number" ? cat1_admin : 0;
    const total_cat1 = Math.min(teachingScore + adminScore, 100);

    // ── Cat II ─────────────────────────────────
    const total_cat2 = typeof cat2_co_curricular === "number"
      ? cat2_co_curricular
      : 0;

    // ── Cat III ────────────────────────────────
    const papersResult   = calcResearchPapers(research_papers, discipline);
    const booksResult    = calcBooks(books);
    const phdResult      = calcPhdProjects(phd_projects);
    const patentsResult  = calcPatentsAwards(patents_awards);
    const lecturesResult = calcLectures(lectures);

    // MOOCS — basic passthrough for now (TODO: full formula)
    const moocsTotal = moocs?.reduce((s, m) => s + (m.score ?? 0), 0) ?? 0;

    // Raw Cat III total before 30% cap
    const rawCat3 =
      papersResult.total +
      booksResult.total +
      phdResult.total +
      patentsResult.total +
      lecturesResult.total +
      moocsTotal;

    // ── 30% Cap on Policy Docs + Lectures ──────
    const combinedPolicyLectures =
      patentsResult.policyDocTotal + lecturesResult.total;
    const cap30 = Math.round(rawCat3 * 0.3);
    const capApplied = combinedPolicyLectures > cap30;
    const excessCap = capApplied
      ? combinedPolicyLectures - cap30
      : 0;
    const total_cat3 = rawCat3 - excessCap;

    // ── Minimum 3 categories check ─────────────
    const categoriesUsed = [
      papersResult.total > 0,
      booksResult.total > 0,
      phdResult.total > 0,
      patentsResult.total > 0,
      lecturesResult.total > 0,
      moocsTotal > 0,
    ].filter(Boolean).length;

    const minRequired = MINIMUMS[designation] ?? {};
    const minCat3Categories = minRequired.min_cat3_categories ?? 0;
    const meets3CategoryRule =
      minCat3Categories === 0 || categoriesUsed >= minCat3Categories;

    // ── Gap Analysis ───────────────────────────
    const gaps = {};
    if (total_cat1 < (minRequired.cat1 ?? 0)) {
      gaps.cat1 = {
        required: minRequired.cat1,
        current: total_cat1,
        gap: minRequired.cat1 - total_cat1,
      };
    }
    if (total_cat2 < (minRequired.cat2 ?? 0)) {
      gaps.cat2 = {
        required: minRequired.cat2,
        current: total_cat2,
        gap: minRequired.cat2 - total_cat2,
      };
    }
    if (total_cat3 < (minRequired.cat3 ?? 0)) {
      gaps.cat3 = {
        required: minRequired.cat3,
        current: total_cat3,
        gap: minRequired.cat3 - total_cat3,
      };
    }

    const eligible =
      Object.keys(gaps).length === 0 && meets3CategoryRule;

    // ── Build result object ────────────────────
    const scoreBreakdown = {
      cat1: {
        teaching: teachingScore,
        admin: adminScore,
        total: total_cat1,
      },
      cat2: {
        total: total_cat2,
      },
      cat3: {
        research_papers: papersResult,
        books: booksResult,
        phd_projects: phdResult,
        patents_awards: patentsResult,
        lectures: lecturesResult,
        moocs: { total: moocsTotal },
        raw_total: rawCat3,
        cap_applied: capApplied,
        cap_excess: excessCap,
        total: total_cat3,
        categories_used: categoriesUsed,
        meets_3category_rule: meets3CategoryRule,
      },
      grand_total: total_cat1 + total_cat2 + total_cat3,
    };

    // ── Save to DB ─────────────────────────────
    const dbResult = await pool.query(
      `INSERT INTO calculations
         (user_id, calc_type, inputs, score_total, score_breakdown, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id`,
      [
        userId,
        purpose ?? "CAS Promotion",
        JSON.stringify(req.body),
        scoreBreakdown.grand_total,
        JSON.stringify(scoreBreakdown),
      ]
    );

    res.json({
      success: true,
      calculation_id: dbResult.rows[0].id,
      total_cat1,
      total_cat2,
      total_cat3,
      grand_total: scoreBreakdown.grand_total,
      breakdown: scoreBreakdown,
      eligible,
      gaps,
      warnings: capApplied
        ? [
            `Policy Documents + Lectures capped at 30% of research score (${cap30} pts). Excess ${excessCap} pts removed.`,
          ]
        : [],
    });
  } catch (err) {
    console.error("Calculate error:", err);
    res.status(500).json({ success: false, error: "Calculation failed" });
  }
});

// ─────────────────────────────────────────────
// GET /api/history — fetch user's past calculations
// ─────────────────────────────────────────────
router.get("/history", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      `SELECT id, calc_type, score_total, score_breakdown, created_at
       FROM calculations
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [userId]
    );

    res.json({ success: true, calculations: result.rows });
  } catch (err) {
    console.error("History error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch history" });
  }
});

module.exports = router;