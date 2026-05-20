import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Save, ChevronLeft, ChevronRight, Info,
  MapPin, GraduationCap, ArrowRight
} from 'lucide-react';
import ResearchPapers from '../components/ResearchPapers';
import Books from '../components/Books';
import PhdProjects from '../components/PhdProjects';
import PatentsAwards from '../components/PatentsAwards';
import Lectures from '../components/Lectures';
import CatII from '../components/Cat_II';
import { calculateAPI } from '../services/api';

// ─── Minimums per regulation + designation ────────────────────
// FIX 1: regulation-aware minimums (was hardcoded 75/15 for all)
const MINIMUMS_BY_REG = {
  '2010': {
    'Assistant Professor (Stage 1)': { cat1: 75, cat2: 15, cat3: 10 },
    'Assistant Professor (Stage 2)': { cat1: 75, cat2: 15, cat3: 20 },
    'Assistant Professor (Stage 3)': { cat1: 75, cat2: 15, cat3: 30 },
    'Associate Professor':           { cat1: 75, cat2: 15, cat3: 40 },
    'Professor':                     { cat1: 75, cat2: 15, cat3: 50 },
  },
  '2016': {
    'Assistant Professor (Stage 1)': { cat1: 75, cat2: 15, cat3: 10 },
    'Assistant Professor (Stage 2)': { cat1: 75, cat2: 15, cat3: 20 },
    'Assistant Professor (Stage 3)': { cat1: 75, cat2: 15, cat3: 30 },
    'Associate Professor':           { cat1: 75, cat2: 15, cat3: 40 },
    'Professor':                     { cat1: 75, cat2: 15, cat3: 50 },
  },
  '2018': {
    'Assistant Professor (Stage 1)': { cat1: 75, cat2: 15, cat3: 10 },
    'Assistant Professor (Stage 2)': { cat1: 75, cat2: 15, cat3: 20 },
    'Assistant Professor (Stage 3)': { cat1: 75, cat2: 15, cat3: 30 },
    'Associate Professor':           { cat1: 75, cat2: 15, cat3: 40 },
    'Professor':                     { cat1: 75, cat2: 15, cat3: 50 },
  },
  '2025': {
    // FIX 1: Cat I raised, Cat II = 0 (not mandatory in 2025)
    'Assistant Professor (Stage 1)': { cat1: 100, cat2: 0, cat3: 10 },
    'Assistant Professor (Stage 2)': { cat1: 100, cat2: 0, cat3: 20 },
    'Assistant Professor (Stage 3)': { cat1: 100, cat2: 0, cat3: 30 },
    'Associate Professor':           { cat1: 90,  cat2: 0, cat3: 40 },
    'Professor':                     { cat1: 80,  cat2: 0, cat3: 50 },
  },
};
// 2013 = same as 2010
MINIMUMS_BY_REG['2013'] = MINIMUMS_BY_REG['2010'];

// ─── Cat I rules per regulation year ─────────────────────────
const CAT1_RULES = {
  '2010': { i: 60,  ii: 20, iii: 20, iv: 25, total: 120 },
  '2013': { i: 60,  ii: 20, iii: 20, iv: 25, total: 120 },
  '2016': { i: 100, ii: 30, iii: 10, iv: 20, total: 100 },
  '2018': { i: 100, ii: 30, iii: 10, iv: 20, total: 100 },
  '2025': { i: 100, ii: 30, iii: 10, iv: 20, total: 100 },
};

// ─── Cat III preview calc — regulation-aware ─────────────────
// FIX 2: 2010 uses % sub-caps, 2025 uses no cap, 2016/2018 uses 30% cap
function calcCat3Total(formData) {
  const reg = formData.regulation || '2018';

  const papersTotal        = (formData.research_papers || []).reduce((s, p) => s + (p.score || 0), 0);
  const booksTotal         = (formData.books || []).reduce((s, b) => s + (b.score || 0), 0);
  const phdTotal           = (formData.phd_projects || []).reduce((s, p) => s + (p.score || 0), 0);
  const patentItems        = formData.patents_awards || [];
  const policyDocTotal     = patentItems.filter((i) => i.type === 'policy_document').reduce((s, i) => s + (i.score || 0), 0);
  const patentsAwardsTotal = patentItems.filter((i) => i.type !== 'policy_document').reduce((s, i) => s + (i.score || 0), 0);
  const lecturesTotal      = (formData.lectures || []).reduce((s, l) => s + (l.score || 0), 0);
  const rawTotal = papersTotal + booksTotal + phdTotal + patentsAwardsTotal + policyDocTotal + lecturesTotal;

  // 2025 — no cap at all
  if (reg === '2025') {
    return {
      papersTotal, booksTotal, phdTotal, patentsAwardsTotal,
      policyDocTotal, lecturesTotal, rawTotal,
      capApplied: false, cap30: 0, excess: 0,
      capType: 'none',
      total: rawTotal,
    };
  }

  // 2010/2013 — % sub-caps
  if (reg === '2010' || reg === '2013') {
    const maxPapers   = Math.round(rawTotal * 0.55);
    const maxProjects = Math.round(rawTotal * 0.20);
    const maxGuidance = Math.round(rawTotal * 0.10);
    const maxTraining = Math.round(rawTotal * 0.15);
    const cappedPapers   = Math.min(papersTotal + booksTotal, maxPapers);
    const cappedProjects = Math.min(patentsAwardsTotal, maxProjects);
    const cappedGuidance = Math.min(phdTotal, maxGuidance);
    const cappedTraining = Math.min(lecturesTotal, maxTraining);
    const cappedTotal = cappedPapers + cappedProjects + cappedGuidance + cappedTraining;
    return {
      papersTotal, booksTotal, phdTotal, patentsAwardsTotal,
      policyDocTotal, lecturesTotal, rawTotal,
      capApplied: cappedTotal < rawTotal,
      cap30: 0, excess: rawTotal - cappedTotal,
      capType: 'pct_2010',
      total: cappedTotal,
    };
  }

  // 2016/2018 — 30% cap on policy+lectures
  const combinedPL = policyDocTotal + lecturesTotal;
  const cap30  = rawTotal * 0.3;
  const excess = combinedPL > cap30 ? combinedPL - cap30 : 0;
  return {
    papersTotal, booksTotal, phdTotal, patentsAwardsTotal,
    policyDocTotal, lecturesTotal, rawTotal,
    capApplied: excess > 0, cap30, excess,
    capType: 'policy_lecture_30pct',
    total: rawTotal - excess,
  };
}

// ─── Score badge ──────────────────────────────────────────────
function ScoreBadge({ label, score, max, min, color = 'blue' }) {
  const pct = max ? Math.min((score / max) * 100, 100) : 0;
  const c = {
    blue:    { bg: 'bg-blue-50',    text: 'text-blue-700',    bar: 'bg-blue-600'    },
    indigo:  { bg: 'bg-indigo-50',  text: 'text-indigo-700',  bar: 'bg-indigo-600'  },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', bar: 'bg-emerald-600' },
  }[color] || { bg: 'bg-blue-50', text: 'text-blue-700', bar: 'bg-blue-600' };

  return (
    <div className={`${c.bg} rounded-xl p-4`}>
      <p className={`text-xs font-medium mb-1 ${c.text}`}>{label}</p>
      <p className={`text-3xl font-black ${c.text}`}>{typeof score === 'number' ? score.toFixed(2) : score}</p>
      {max && <p className={`text-xs mt-1 opacity-60 ${c.text}`}>/ {max} pts</p>}
      {max && <div className="mt-2 w-full bg-white/60 rounded-full h-1.5"><div className={`${c.bar} h-1.5 rounded-full`} style={{ width: `${pct}%` }} /></div>}
      {min != null && score < min && <p className="text-xs text-red-500 mt-1 font-semibold">⚠ Min {min} required</p>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
const Calculator = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [mode, setMode] = useState('select');
  const [ugcStep, setUgcStep] = useState('setup');
  const [cat3Step, setCat3Step] = useState('papers');

  const [formData, setFormData] = useState({
    regulation: '2018', discipline: 'Science',
    designation: 'Assistant Professor (Stage 1)',
    institutionType: 'University', purpose: 'CAS Promotion',
    cat1_i_allotted: 0, cat1_i_undertaken: 0,
    cat1_ii_hours: 0, cat1_iii_score: 0, cat1_iv_hours: 0,
    cat2_total: 0, cat2_items: [],
    research_papers: [], books: [], phd_projects: [], patents_awards: [], lectures: [],
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  // ── Derived scores ─────────────────────────────────────────
  const reg = formData.regulation;
  const r1 = CAT1_RULES[reg] || CAT1_RULES['2018'];

  // FIX 1: mins now comes from regulation-aware object
  const regMins = MINIMUMS_BY_REG[reg] || MINIMUMS_BY_REG['2018'];
  const mins = regMins[formData.designation] || {};

  const cat1_i   = formData.cat1_i_allotted > 0 ? Math.min(Math.round((formData.cat1_i_undertaken / formData.cat1_i_allotted) * r1.i), r1.i) : 0;
  const cat1_ii  = Math.min(Math.round(Number(formData.cat1_ii_hours) / 10), r1.ii);
  const cat1_iii = Math.min(Number(formData.cat1_iii_score), r1.iii);
  const cat1_iv  = Math.min(Math.round(Number(formData.cat1_iv_hours) / 10), r1.iv);
  const total_cat1 = Math.min(cat1_i + cat1_ii + cat1_iii + cat1_iv, r1.total);

  const total_cat2 = Number(formData.cat2_total ?? 0);

  const cat3 = calcCat3Total(formData);
  const grand_total = total_cat1 + total_cat2 + cat3.total;
  const policyDocTotal = (formData.patents_awards || []).filter((i) => i.type === 'policy_document').reduce((s, i) => s + (i.score || 0), 0);

  const UGC_STEPS  = ['setup', 'cat1', 'cat2', 'cat3', 'review'];
  const ugcIdx     = UGC_STEPS.indexOf(ugcStep);
  const UGC_LABELS = ['Setup', 'Category I', 'Category II', 'Category III', 'Review'];
  const CAT3_STEPS  = ['papers', 'books', 'phd', 'patents', 'lectures'];
  const CAT3_LABELS = { papers: 'Research Papers', books: 'Books & Translation', phd: 'PhD & Projects', patents: 'Patents & Awards', lectures: 'Lectures' };

  const goNext = () => setUgcStep(UGC_STEPS[ugcIdx + 1]);
  const goBack = () => ugcIdx === 0 ? setMode('select') : setUgcStep(UGC_STEPS[ugcIdx - 1]);

  const handleSubmit = async () => {
    setSubmitting(true); setSubmitError('');
    try {
      const payload = { ...formData, total_cat1, total_cat2, total_cat3: cat3.total, grand_total };
      const res = await calculateAPI.submit(payload);
      localStorage.setItem('last_calc', JSON.stringify({ ...payload, ...res.data, cat3_breakdown: res.data?.breakdown?.cat3 }));
      navigate('/result');
    } catch (err) {
      setSubmitError(err.response?.data?.error || 'Calculation failed. Please try again.');
      setSubmitting(false);
    }
  };

  // ══ MODE SELECT ══════════════════════════════════════════════
  if (mode === 'select') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-gray-900">API Score Calculator</h1>
          <p className="text-gray-500 mt-2">Choose what you want to calculate</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button onClick={() => { setMode('ugc'); setUgcStep('setup'); }}
            className="group text-left border-2 border-gray-200 hover:border-blue-500 rounded-2xl p-6 transition-all hover:shadow-lg bg-white">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-colors">
              <GraduationCap size={24} className="text-blue-600 group-hover:text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">UGC Standard API</h2>
            <p className="text-sm text-gray-500 mb-4">CAS Promotion, Direct Recruitment, or PBAS submission as per UGC regulations.</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {['2010/2013', '2016', '2018', '2025'].map((y) => (
                <span key={y} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium">UGC {y}</span>
              ))}
            </div>
            <div className="flex items-center text-blue-600 font-semibold text-sm group-hover:translate-x-1 transition-transform">
              Select <ArrowRight size={16} className="ml-1" />
            </div>
          </button>

          <div className="text-left border-2 border-gray-200 rounded-2xl p-6 bg-white relative opacity-60">
            <div className="absolute top-4 right-4 text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full font-medium">Coming Soon</div>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
              <MapPin size={24} className="text-orange-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">State PSC Merit Score</h2>
            <p className="text-sm text-gray-500 mb-4">State-level recruitment merit score — JPSC, MPPSC, UPPSC, BPSC, RPSC and more.</p>
            <div className="flex flex-wrap gap-2">
              {['JPSC', 'MPPSC', 'UPPSC', 'BPSC', 'RPSC'].map((s) => (
                <span key={s} className="text-xs bg-orange-50 text-orange-600 px-2 py-1 rounded-full font-medium">{s}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══ UGC FLOW ═════════════════════════════════════════════════
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <button onClick={() => setMode('select')} className="text-sm text-gray-500 hover:text-blue-600 flex items-center gap-1 mb-4">
          <ChevronLeft size={16} /> Back to mode selection
        </button>
        <h1 className="text-3xl font-bold text-gray-900">UGC API Calculator</h1>
        <p className="text-gray-500 text-sm mt-1">UGC {formData.regulation} · {formData.discipline} · {formData.designation}</p>
      </div>

      {/* Step bar */}
      <div className="flex items-center mb-8 bg-white p-4 rounded-xl shadow-sm overflow-x-auto gap-2">
        {UGC_LABELS.map((label, idx) => (
          <div key={idx} className="flex items-center flex-1 last:flex-none min-w-0">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${ugcIdx === idx ? 'bg-blue-700 text-white' : ugcIdx > idx ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>{idx + 1}</div>
            <span className={`px-1 text-xs truncate hidden sm:block ${ugcIdx === idx ? 'text-blue-700 font-semibold' : 'text-gray-400'}`}>{label}</span>
            {idx < UGC_LABELS.length - 1 && <div className="flex-1 h-px bg-gray-200 mx-1 min-w-[8px]" />}
          </div>
        ))}
      </div>

      <div className="card">

        {/* SETUP */}
        {ugcStep === 'setup' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold border-b pb-2">Setup — Academic Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Regulation Year</label>
                {/* FIX 3: 2013 added as separate option */}
                <select name="regulation" value={formData.regulation} onChange={handleChange} className="input-field">
                  <option value="2010">2010 / 2013</option>
                  <option value="2016">2016</option>
                  <option value="2018">2018</option>
                  <option value="2025">2025</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Discipline Group</label>
                <select name="discipline" value={formData.discipline} onChange={handleChange} className="input-field">
                  <option value="Science">Science / Engineering / Agriculture / Medical</option>
                  <option value="Arts">Languages / Arts / Humanities / Social Sciences / Commerce</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Current Designation</label>
                <select name="designation" value={formData.designation} onChange={handleChange} className="input-field">
                  <option>Assistant Professor (Stage 1)</option>
                  <option>Assistant Professor (Stage 2)</option>
                  <option>Assistant Professor (Stage 3)</option>
                  <option>Associate Professor</option>
                  <option>Professor</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Institution Type</label>
                <select name="institutionType" value={formData.institutionType} onChange={handleChange} className="input-field">
                  <option>University</option><option>Constituent College</option><option>Affiliated College</option>
                </select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Purpose</label>
                <select name="purpose" value={formData.purpose} onChange={handleChange} className="input-field">
                  <option>CAS Promotion</option><option>Direct Recruitment</option><option>PBAS Submission</option><option>Eligibility Check</option>
                </select>
              </div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 flex items-start gap-3">
              <Info size={16} className="text-blue-500 mt-0.5 shrink-0" />
              <p className="text-xs text-blue-700">
                For <strong>{formData.designation}</strong> under UGC {reg} — Minimum required: Cat I ≥ {mins.cat1},
                {mins.cat2 > 0 ? ` Cat II ≥ ${mins.cat2},` : ' Cat II not mandatory,'} Cat III ≥ {mins.cat3} pts.
              </p>
            </div>
            {/* 2025 special note */}
            {reg === '2025' && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                <Info size={14} className="text-amber-500 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700">
                  <strong>UGC 2025:</strong> Category II is not mandatory. Category I minimum is higher ({mins.cat1} pts). No cap on Cat III sub-categories.
                </p>
              </div>
            )}
          </div>
        )}

        {/* CAT I */}
        {ugcStep === 'cat1' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b pb-2">
              <h2 className="text-xl font-semibold">Category I — Teaching, Learning & Evaluation</h2>
              <span className="text-sm font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full">{total_cat1} / {r1.total} pts</span>
            </div>

            {/* I(i) */}
            <div className="bg-gray-50 rounded-xl p-5 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-800">I(i) — Lectures, Tutorials & Practicals</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Score = (Undertaken ÷ Allotted) × {r1.i} · Max {r1.i} pts</p>
                </div>
                <span className="text-sm font-bold text-blue-600 shrink-0 ml-2">{cat1_i} pts</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Hours Allotted (per year)</label>
                  <input type="number" name="cat1_i_allotted" value={formData.cat1_i_allotted} onChange={handleChange} min="0" className="input-field" placeholder="e.g. 320" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Hours Actually Undertaken</label>
                  <input type="number" name="cat1_i_undertaken" value={formData.cat1_i_undertaken} onChange={handleChange} min="0" className="input-field" placeholder="e.g. 290" />
                </div>
              </div>
            </div>

            {/* I(ii) */}
            <div className="bg-gray-50 rounded-xl p-5 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-800">I(ii) — Research Supervision</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Max 1 hr/student/week · Score = hours ÷ 10 · Max {r1.ii} pts</p>
                </div>
                <span className="text-sm font-bold text-blue-600 shrink-0 ml-2">{cat1_ii} pts</span>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Hours spent on research supervision (per year)</label>
                <input type="number" name="cat1_ii_hours" value={formData.cat1_ii_hours} onChange={handleChange} min="0" className="input-field" placeholder="e.g. 120" />
              </div>
            </div>

            {/* I(iii) */}
            <div className="bg-gray-50 rounded-xl p-5 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-800">I(iii) — Teaching Innovation & Course Improvement</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Assessed by screening committee · Max {r1.iii} pts</p>
                </div>
                <span className="text-sm font-bold text-blue-600 shrink-0 ml-2">{cat1_iii} pts</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[['Outstanding', r1.iii], ['Very Good', Math.round(r1.iii * 0.7)], ['Good', Math.round(r1.iii * 0.5)], ['Average', Math.round(r1.iii * 0.3)], ['Modest', 1]].map(([label, val]) => (
                  <button key={label} type="button" onClick={() => setFormData((p) => ({ ...p, cat1_iii_score: val }))}
                    className={`px-2 py-2 rounded-lg text-xs font-medium border transition-all ${Number(formData.cat1_iii_score) === val ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}>
                    {label}<br /><span className="font-bold">{val} pts</span>
                  </button>
                ))}
              </div>
            </div>

            {/* I(iv) */}
            <div className="bg-gray-50 rounded-xl p-5 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-800">I(iv) — Examination Duties</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Invigilation + paper setting + evaluation · Score = hours ÷ 10 · Max {r1.iv} pts</p>
                </div>
                <span className="text-sm font-bold text-blue-600 shrink-0 ml-2">{cat1_iv} pts</span>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Total hours on exam duties (per year)</label>
                <input type="number" name="cat1_iv_hours" value={formData.cat1_iv_hours} onChange={handleChange} min="0" className="input-field" placeholder="e.g. 80" />
              </div>
            </div>

            <div className="flex items-center justify-between bg-blue-700 text-white rounded-xl px-5 py-4">
              <div><p className="text-sm opacity-80">Category I Total</p><p className="text-xs opacity-60">Min: {mins.cat1} pts</p></div>
              <div className="text-right"><p className="text-4xl font-black">{total_cat1}</p><p className="text-xs opacity-60">/ {r1.total} pts</p></div>
            </div>
            {total_cat1 < mins.cat1 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                ⚠ Need <strong>{mins.cat1 - total_cat1} more pts</strong> in Cat I.
              </div>
            )}
          </div>
        )}

        {/* CAT II */}
        {ugcStep === 'cat2' && (
          <>
            {reg === '2025' && (
              <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700 flex items-start gap-2">
                <Info size={14} className="mt-0.5 shrink-0" />
                <span><strong>UGC 2025:</strong> Category II is not mandatory. You may skip this step.</span>
              </div>
            )}
            <CatII onChange={({ items, total_cat2 }) =>
              setFormData((p) => ({ ...p, cat2_items: items, cat2_total: total_cat2 }))
            } />
          </>
        )}

        {/* CAT III */}
        {ugcStep === 'cat3' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b pb-2">
              <h2 className="text-xl font-semibold">Category III — Research & Academic Contributions</h2>
              <span className="text-sm font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">{cat3.total.toFixed(2)} pts</span>
            </div>

            {/* Sub-step tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {CAT3_STEPS.map((s) => (
                <button key={s} type="button" onClick={() => setCat3Step(s)}
                  className={`shrink-0 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${cat3Step === s ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {CAT3_LABELS[s]}
                </button>
              ))}
            </div>

            {cat3Step === 'papers'   && <ResearchPapers discipline={formData.discipline} data={formData.research_papers} onChange={(papers) => setFormData((p) => ({ ...p, research_papers: papers }))} />}
            {cat3Step === 'books'    && <Books data={formData.books} onChange={(items) => setFormData((p) => ({ ...p, books: items }))} />}
            {cat3Step === 'phd'      && <PhdProjects data={formData.phd_projects} onChange={(items) => setFormData((p) => ({ ...p, phd_projects: items }))} />}
            {cat3Step === 'patents'  && <PatentsAwards data={formData.patents_awards} onChange={({ patents_awards }) => setFormData((p) => ({ ...p, patents_awards }))} />}
            {cat3Step === 'lectures' && <Lectures data={formData.lectures} policyDocTotal={policyDocTotal} totalResearch={cat3.rawTotal} onChange={({ lectures }) => setFormData((p) => ({ ...p, lectures }))} />}

            {/* Cat III summary */}
            <div className="bg-emerald-50 rounded-xl p-4 space-y-2 border border-emerald-100">
              <p className="text-sm font-semibold text-emerald-800 mb-2">Category III Summary</p>
              {[
                ['Research Papers', cat3.papersTotal], ['Books & Translation', cat3.booksTotal],
                ['PhD & Projects', cat3.phdTotal], ['Patents & Awards', cat3.patentsAwardsTotal],
                ['Policy Documents', cat3.policyDocTotal], ['Invited Lectures', cat3.lecturesTotal],
              ].filter(([, v]) => v > 0).map(([l, v]) => (
                <div key={l} className="flex justify-between text-sm">
                  <span className="text-gray-600">{l}</span>
                  <span className="font-semibold text-emerald-700">{Number(v).toFixed(2)} pts</span>
                </div>
              ))}
              {cat3.capApplied && cat3.capType === 'policy_lecture_30pct' && (
                <div className="flex justify-between text-sm text-red-600 border-t pt-2">
                  <span>30% Cap Deduction (Policy Docs + Lectures)</span>
                  <span>- {cat3.excess.toFixed(2)} pts</span>
                </div>
              )}
              {cat3.capApplied && cat3.capType === 'pct_2010' && (
                <div className="flex justify-between text-sm text-red-600 border-t pt-2">
                  <span>UGC 2010 Sub-category Cap Applied</span>
                  <span>- {cat3.excess.toFixed(2)} pts</span>
                </div>
              )}
              {!cat3.capApplied && reg === '2025' && (
                <div className="text-xs text-emerald-600 border-t pt-2">✓ No cap applied (UGC 2025)</div>
              )}
              <div className="flex justify-between font-bold text-emerald-800 border-t pt-2">
                <span>Total</span><span>{cat3.total.toFixed(2)} pts</span>
              </div>
            </div>
          </div>
        )}

        {/* REVIEW */}
        {ugcStep === 'review' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold border-b pb-2">Review & Submit</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ScoreBadge label="Category I" score={total_cat1} max={r1.total} min={mins.cat1} color="blue" />
              <ScoreBadge label="Category II" score={total_cat2} max={50} min={mins.cat2} color="indigo" />
              <ScoreBadge label="Category III" score={cat3.total} min={mins.cat3} color="emerald" />
            </div>
            <div className="bg-gray-900 text-white rounded-xl p-6 text-center">
              <p className="text-sm opacity-60 mb-1">Grand Total</p>
              <p className="text-6xl font-black">{grand_total.toFixed(2)}</p>
              <p className="text-xs opacity-40 mt-2">{formData.designation} · UGC {formData.regulation} · {formData.discipline}</p>
            </div>
            {(() => {
              const gaps = [];
              if (total_cat1 < (mins.cat1 || 0)) gaps.push(`Cat I: need ${mins.cat1 - total_cat1} more pts`);
              if (mins.cat2 > 0 && total_cat2 < mins.cat2) gaps.push(`Cat II: need ${mins.cat2 - total_cat2} more pts`);
              if (cat3.total < (mins.cat3 || 0)) gaps.push(`Cat III: need ${(mins.cat3 - cat3.total).toFixed(2)} more pts`);
              return gaps.length === 0
                ? <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center text-green-700 font-semibold">✅ Eligible for {formData.purpose}</div>
                : <div className="bg-red-50 border border-red-200 rounded-lg p-4"><p className="text-red-700 font-semibold mb-2">❌ Not yet eligible — Gap Analysis:</p><ul className="text-sm text-red-600 space-y-1">{gaps.map((g) => <li key={g}>• {g}</li>)}</ul></div>;
            })()}
            {submitError && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm text-center">{submitError}</div>}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-10 pt-6 border-t">
          <button type="button" onClick={goBack}
            className="flex items-center px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium">
            <ChevronLeft size={20} className="mr-1" />{ugcIdx === 0 ? 'Change Mode' : 'Back'}
          </button>
          {ugcStep !== 'review'
            ? <button type="button" onClick={goNext} className="btn-primary flex items-center px-8">Next <ChevronRight size={20} className="ml-1" /></button>
            : <button type="button" onClick={handleSubmit} disabled={submitting}
                className="flex items-center gap-2 px-8 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium disabled:opacity-50 transition-all">
                {submitting
                  ? <><svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Saving...</>
                  : <><Save size={20} /> Calculate & Save</>}
              </button>
          }
        </div>
      </div>
    </div>
  );
};

export default Calculator;