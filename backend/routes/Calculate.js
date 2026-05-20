// backend/routes/calculate.js
// UGC API Score Calculation Engine — supports 2010, 2018 (2016 & 2025 coming)
// POST /api/calculate — requires JWT auth

const express = require("express");
const router = express.Router();
const pool = require("../db");
const { verifyToken } = require("../middleware/auth");

// ─────────────────────────────────────────────
// UGC RULES — regulation-wise
// ─────────────────────────────────────────────

const UGC_RULES = {

  // ── UGC 2010 ──────────────────────────────
  "2010": {
    minimums: {
      "Assistant Professor (Stage 1)": { cat1: 75, cat2: 15, cat3: 10, min_cat3_categories: 0 },
      "Assistant Professor (Stage 2)": { cat1: 75, cat2: 15, cat3: 20, min_cat3_categories: 0 },
      "Assistant Professor (Stage 3)": { cat1: 75, cat2: 15, cat3: 30, min_cat3_categories: 0 },
      "Associate Professor":           { cat1: 75, cat2: 15, cat3: 40, min_cat3_categories: 0 },
      "Professor":                     { cat1: 75, cat2: 15, cat3: 50, min_cat3_categories: 0 },
    },
    // Research papers — same for all disciplines in 2010
    paper_scores: {
      "non_refereed_no_if": 15,  // refereed journal/periodical
      "refereed_no_if":     15,  // refereed journal with ISSN
      "if_below_1":         15,  // no IF distinction in 2010
      "if_1_2":             15,
      "if_2_5":             15,
      "if_5_10":            15,
      "if_above_10":        15,
      "conference_proceedings": 10, // full paper in conf proceedings
    },
    science_multiplier: 1.0, // no discipline distinction in 2010
    book_scores: {
      "authored_international": 40, // sole author
      "authored_national":      30, // co-author
      "chapter":                10,
      "editor_international":   20, // sole editor
      "editor_national":        10, // co-editor
      "translation_chapter":    10, // chapter translated
      "translation_book":       20, // sole translator / 10 co-translator
    },
    phd_scores: {
      "phd_awarded_single":    10,
      "phd_awarded_joint":      7,
      "phd_awarded_cosup":      3,
      "phd_submitted_single":   7,
      "phd_submitted_joint":    5,
      "phd_submitted_cosup":    3,
      "mphil":                   3,
      "pg_dissertation":         2,
      "project_major_single":   20, // major project PI
      "project_major_pi":       10, // major project co-PI
      "project_minor_single":   15, // minor project
      "project_minor_pi":        8,
      "project_minor_copi":      8,
      "project_major_copi":     10,
      "project_ongoing_major":   5,
      "project_ongoing_minor":   2,
      "consultancy":            10, // min 10L mobilized
    },
    // Cat III sub-caps (2010 uses % caps)
    cat3_subcaps: {
      papers_pct:    0.55, // 55% max from research papers
      projects_pct:  0.20, // 20% max from projects
      guidance_pct:  0.10, // 10% max from research guidance
      training_pct:  0.15, // 15% max from training/conferences
    },
    use_pct_caps: true, // 2010 uses % caps, not 30% policy+lecture cap
  },

  // ── UGC 2018 ──────────────────────────────
  "2018": {
    minimums: {
      "Assistant Professor (Stage 1)": { cat1: 75, cat2: 15, cat3: 10, min_cat3_categories: 0 },
      "Assistant Professor (Stage 2)": { cat1: 75, cat2: 15, cat3: 20, min_cat3_categories: 0 },
      "Assistant Professor (Stage 3)": { cat1: 75, cat2: 15, cat3: 30, min_cat3_categories: 3 },
      "Associate Professor":           { cat1: 75, cat2: 15, cat3: 40, min_cat3_categories: 3 },
      "Professor":                     { cat1: 75, cat2: 15, cat3: 50, min_cat3_categories: 3 },
    },
    paper_scores: {
      "non_refereed_no_if": 10,
      "refereed_no_if":     15,
      "if_below_1":         20,
      "if_1_2":             25,
      "if_2_5":             30,
      "if_5_10":            35,
      "if_above_10":        40,
    },
    science_multiplier: 1.25, // Science = Arts * 1.25
    book_scores: {
      "authored_international": 12,
      "authored_national":       8,
      "chapter":                 5,
      "editor_international":   10,
      "editor_national":         8,
      "translation_chapter":     3,
      "translation_book":        8,
    },
    phd_scores: {
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
    },
    use_pct_caps: false, // 2018 uses 30% cap on policy+lectures only
  },

  // ── UGC 2016 (4th Amendment, 11 July 2016) ────
  "2016": {
    minimums: {
      "Assistant Professor (Stage 1)": { cat1: 75, cat2: 15, cat3: 10, min_cat3_categories: 0 },
      "Assistant Professor (Stage 2)": { cat1: 75, cat2: 15, cat3: 20, min_cat3_categories: 0 },
      "Assistant Professor (Stage 3)": { cat1: 75, cat2: 15, cat3: 30, min_cat3_categories: 3 },
      "Associate Professor":           { cat1: 75, cat2: 15, cat3: 40, min_cat3_categories: 3 },
      "Professor":                     { cat1: 75, cat2: 15, cat3: 50, min_cat3_categories: 3 },
    },
    paper_scores: {
      "non_refereed_no_if": 25,
      "refereed_no_if":     25,
      "if_below_1":         30,
      "if_1_2":             35,
      "if_2_5":             40,
      "if_5_10":            45,
      "if_above_10":        50,
    },
    science_multiplier: 1.0, // NO discipline multiplier in 2016
    book_scores: {
      "authored_international": 12,
      "authored_national":       8,
      "chapter":                 5,
      "editor_international":   10,
      "editor_national":         8,
      "translation_chapter":     3,
      "translation_book":        8,
    },
    phd_scores: {
      "phd_awarded_single":   10,
      "phd_awarded_joint":     7,
      "phd_awarded_cosup":     3,
      "phd_submitted_single":  7,
      "phd_submitted_joint":   5,
      "phd_submitted_cosup":   3,
      "mphil":                  3,
      "pg_dissertation":        2,
      "project_major_single":  20,
      "project_major_pi":      10,
      "project_major_copi":    10,
      "project_minor_single":  10,
      "project_minor_pi":       8,
      "project_minor_copi":     8,
      "project_ongoing_major":  5,
      "project_ongoing_minor":  2,
    },
    use_pct_caps: false,
  },

  // ── UGC 2025 (4th Amendment to 2018, 2024) ───
  "2025": {
    minimums: {
      "Assistant Professor (Stage 1)": { cat1: 100, cat2: 0, cat3: 10, min_cat3_categories: 0 },
      "Assistant Professor (Stage 2)": { cat1: 100, cat2: 0, cat3: 20, min_cat3_categories: 0 },
      "Assistant Professor (Stage 3)": { cat1: 100, cat2: 0, cat3: 30, min_cat3_categories: 0 },
      "Associate Professor":           { cat1: 90,  cat2: 0, cat3: 40, min_cat3_categories: 0 },
      "Professor":                     { cat1: 80,  cat2: 0, cat3: 50, min_cat3_categories: 0 },
    },
    paper_scores: {
      "non_refereed_no_if":  8,
      "refereed_no_if":      8,
      "if_below_1":         10,
      "if_1_2":             15,
      "if_2_5":             20,
      "if_5_10":            25,
      "if_above_10":        30,
    },
    science_multiplier: 1.25,
    book_scores: {
      "authored_international": 12,
      "authored_national":      10,
      "chapter":                 5,
      "editor_international":   10,
      "editor_national":         8,
      "translation_chapter":     3,
      "translation_book":        8,
    },
    phd_scores: {
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
    },
    use_pct_caps: false,
    no_cat3_cap: true, // 2025 has NO cap on any sub-category
  },
};

// 2013 = 2010 amendment, same rules
UGC_RULES["2013"] = UGC_RULES["2010"];

// ─────────────────────────────────────────────
// AUTHOR MULTIPLIERS
// ─────────────────────────────────────────────
function paperAuthorMultiplier(authorType) {
  switch (authorType) {
    case "single": return 1.0;
    case "two":    return 0.70;
    case "first":  return 0.70;
    case "joint":  return 0.30;
    default:       return 1.0;
  }
}

// ─────────────────────────────────────────────
// CALCULATION HELPERS
// ─────────────────────────────────────────────

function calcResearchPapers(papers = [], discipline, rules) {
  const isScience = discipline === "Science";
  const multiplier = isScience ? (rules.science_multiplier ?? 1.0) : 1.0;
  let total = 0;
  const breakdown = [];

  for (const p of papers) {
    const base = rules.paper_scores[p.journalType] ?? 0;
    const authorMult = paperAuthorMultiplier(p.authorType);
    let score = base * authorMult * multiplier;
    score = Math.round(score * 100) / 100;
    total += score;
    breakdown.push({ ...p, score });
  }

  return { total: Math.round(total * 100) / 100, breakdown };
}

function calcBooks(books = [], rules) {
  let total = 0;
  const breakdown = [];

  for (const b of books) {
    // Books.jsx sends section+type — map to rule key
    const typeKey = b.type ?? b.bookType ?? "";
    const score = rules.book_scores[typeKey] ?? b.score ?? 0;
    total += score;
    breakdown.push({ ...b, score });
  }

  return { total, breakdown };
}

function calcPhdProjects(items = [], rules) {
  let total = 0;
  const breakdown = [];

  for (const item of items) {
    const score = rules.phd_scores[item.type] ?? item.score ?? 0;
    total += score;
    breakdown.push({ ...item, score });
  }

  return { total, breakdown };
}

function calcPatentsAwards(items = []) {
  const SCORES = {
    "patent_international":            10,
    "patent_national":                  7,
    "policy_document_international":   10,
    "policy_document_national":         7,
    "policy_document_state":            4,
    "award_international":              7,
    "award_national":                   5,
  };

  let patentsTotal = 0, policyDocTotal = 0, awardsTotal = 0;
  const breakdown = [];

  for (const item of items) {
    const key = `${item.type}_${item.level}`;
    const score = SCORES[key] ?? item.score ?? 0;
    breakdown.push({ ...item, score });
    if (item.type === "patent")           patentsTotal  += score;
    if (item.type === "policy_document")  policyDocTotal += score;
    if (item.type === "award")            awardsTotal   += score;
  }

  return {
    total: patentsTotal + policyDocTotal + awardsTotal,
    patentsTotal, policyDocTotal, awardsTotal, breakdown,
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

// ─────────────────────────────────────────────
// CAT III CAP LOGIC
// ─────────────────────────────────────────────
function applyCat3Cap(rawCat3, papersTotal, booksTotal, phdTotal,
                      patentsAwardsTotal, policyDocTotal, lecturesTotal,
                      moocsTotal, rules) {

  // UGC 2025 — no cap at all
  if (rules.no_cat3_cap) {
    return {
      total: Math.round(rawCat3 * 100) / 100,
      capApplied: false,
      capType: "none_2025",
      excessCap: 0,
    };
  }

  if (rules.use_pct_caps) {
    // UGC 2010 — sub-category % caps
    const caps = rules.cat3_subcaps;
    const maxPapers   = Math.round(rawCat3 * caps.papers_pct);
    const maxProjects = Math.round(rawCat3 * caps.projects_pct);
    const maxGuidance = Math.round(rawCat3 * caps.guidance_pct);
    const maxTraining = Math.round(rawCat3 * caps.training_pct);

    const cappedPapers   = Math.min(papersTotal + booksTotal, maxPapers);
    const cappedProjects = Math.min(patentsAwardsTotal, maxProjects);
    const cappedGuidance = Math.min(phdTotal, maxGuidance);
    const cappedTraining = Math.min(lecturesTotal + moocsTotal, maxTraining);

    const total = cappedPapers + cappedProjects + cappedGuidance + cappedTraining;
    return {
      total: Math.round(total * 100) / 100,
      capApplied: true,
      capType: "percentage_2010",
      excessCap: rawCat3 - total,
    };
  } else {
    // UGC 2018 — 30% cap on policy_docs + lectures combined
    const combinedPL = policyDocTotal + lecturesTotal;
    const cap30 = rawCat3 * 0.3;
    const capApplied = combinedPL > cap30;
    const excessCap = capApplied ? combinedPL - cap30 : 0;
    return {
      total: Math.round((rawCat3 - excessCap) * 100) / 100,
      capApplied,
      capType: "policy_lecture_30pct",
      excessCap: Math.round(excessCap * 100) / 100,
      cap30: Math.round(cap30 * 100) / 100,
    };
  }
}

// ─────────────────────────────────────────────
// MAIN ROUTE: POST /api/calculate
// ─────────────────────────────────────────────
router.post("/", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      regulation = "2018",
      discipline,
      designation,
      purpose,
      research_papers,
      books,
      phd_projects,
      patents_awards,
      lectures,
      moocs,
    } = req.body;

    // Get rules for this regulation
    const rules = UGC_RULES[regulation] ?? UGC_RULES["2018"];
    const minRequired = rules.minimums[designation] ?? {};

    // ── Cat I & II — frontend pre-calculated ──
    const total_cat1 = Number(req.body.total_cat1 ?? 0);
    const total_cat2 = Number(req.body.total_cat2 ?? 0);

    // ── Cat III ────────────────────────────────
    const papersResult  = calcResearchPapers(research_papers, discipline, rules);
    const booksResult   = calcBooks(books, rules);
    const phdResult     = calcPhdProjects(phd_projects, rules);
    const patentsResult = calcPatentsAwards(patents_awards);
    const lecturesResult= calcLectures(lectures);
    const moocsTotal    = (moocs ?? []).reduce((s, m) => s + (m.score ?? 0), 0);

    const rawCat3 = papersResult.total + booksResult.total + phdResult.total +
                    patentsResult.total + lecturesResult.total + moocsTotal;

    const capResult = applyCat3Cap(
      rawCat3,
      papersResult.total, booksResult.total, phdResult.total,
      patentsResult.patentsTotal + patentsResult.awardsTotal,
      patentsResult.policyDocTotal, lecturesResult.total,
      moocsTotal, rules
    );

    const total_cat3 = capResult.total;

    // ── Min 3 categories check ─────────────────
    const categoriesUsed = [
      papersResult.total > 0, booksResult.total > 0,
      phdResult.total > 0, patentsResult.total > 0,
      lecturesResult.total > 0, moocsTotal > 0,
    ].filter(Boolean).length;

    const minCat3Categories = minRequired.min_cat3_categories ?? 0;
    const meets3CategoryRule = minCat3Categories === 0 || categoriesUsed >= minCat3Categories;

    // ── Gap Analysis ───────────────────────────
    const gaps = {};
    if (total_cat1 < (minRequired.cat1 ?? 0))
      gaps.cat1 = { required: minRequired.cat1, current: total_cat1, gap: minRequired.cat1 - total_cat1 };
    if (total_cat2 < (minRequired.cat2 ?? 0))
      gaps.cat2 = { required: minRequired.cat2, current: total_cat2, gap: minRequired.cat2 - total_cat2 };
    if (total_cat3 < (minRequired.cat3 ?? 0))
      gaps.cat3 = { required: minRequired.cat3, current: total_cat3, gap: minRequired.cat3 - total_cat3 };

    const eligible = Object.keys(gaps).length === 0 && meets3CategoryRule;

    // ── Build result ───────────────────────────
    const scoreBreakdown = {
      regulation,
      cat1: { total: total_cat1 },
      cat2: { total: total_cat2 },
      cat3: {
        research_papers: papersResult,
        books: booksResult,
        phd_projects: phdResult,
        patents_awards: patentsResult,
        lectures: lecturesResult,
        moocs: { total: moocsTotal },
        raw_total: rawCat3,
        cap_result: capResult,
        total: total_cat3,
        categories_used: categoriesUsed,
        meets_3category_rule: meets3CategoryRule,
      },
      grand_total: total_cat1 + total_cat2 + total_cat3,
    };

    // ── Save to DB ─────────────────────────────
    const dbResult = await pool.query(
      `INSERT INTO calculations (user_id, calc_type, inputs, score_total, score_breakdown, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id`,
      [
        userId,
        `${purpose ?? "CAS Promotion"} (UGC ${regulation})`,
        JSON.stringify(req.body),
        scoreBreakdown.grand_total,
        JSON.stringify(scoreBreakdown),
      ]
    );

    const warnings = [];
    if (capResult.capApplied) {
      if (capResult.capType === "policy_lecture_30pct") {
        warnings.push(`Policy Documents + Lectures capped at 30% (${capResult.cap30} pts). Excess ${capResult.excessCap} pts removed.`);
      } else {
        warnings.push(`UGC 2010 sub-category caps applied. Total adjusted from ${rawCat3} to ${total_cat3} pts.`);
      }
    }
    if (!meets3CategoryRule) {
      warnings.push(`UGC requires contributions from at least ${minCat3Categories} Cat III sub-categories.`);
    }

    res.json({
      success: true,
      calculation_id: dbResult.rows[0].id,
      regulation,
      total_cat1, total_cat2, total_cat3,
      grand_total: scoreBreakdown.grand_total,
      breakdown: scoreBreakdown,
      eligible, gaps, warnings,
    });

  } catch (err) {
    console.error("Calculate error:", err);
    res.status(500).json({ success: false, error: "Calculation failed" });
  }
});

// ─────────────────────────────────────────────
// GET /api/calculate/history
// ─────────────────────────────────────────────
router.get("/history", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      `SELECT id, calc_type, score_total, score_breakdown, created_at
       FROM calculations WHERE user_id = $1
       ORDER BY created_at DESC LIMIT 50`,
      [userId]
    );
    res.json({ success: true, calculations: result.rows });
  } catch (err) {
    console.error("History error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch history" });
  }
});

module.exports = router;