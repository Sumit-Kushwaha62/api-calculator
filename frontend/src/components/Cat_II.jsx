import React, { useState } from 'react';
import { PlusCircle, Trash2, Info } from 'lucide-react';

// ── UGC 2018 Cat II Rules ──────────────────────────────────────

const CAT2_I_ACTIVITIES = [
  { value: 'nss_ncc_officer',   label: 'NSS / NCC Programme Officer',           pts: 10 },
  { value: 'cultural_sports',   label: 'Cultural / Sports Coordinator',          pts: 7  },
  { value: 'counsellor',        label: 'Counsellor / Career Guidance / Mentor',  pts: 5  },
  { value: 'college_union',     label: 'College Union / Hostel Activities',      pts: 3  },
  { value: 'other_cocurricular',label: 'Any Other Co-curricular Activity',       pts: 2  },
];

const CAT2_II_ACTIVITIES = [
  { value: 'dean_director_hod', label: 'Dean / Director / Principal / HoD',     pts: 6 },
  { value: 'warden_proctor',    label: 'Warden / Chief Proctor',                 pts: 5 },
  { value: 'committee_coord',   label: 'Committee Coordinator / Convener',       pts: 3 },
  { value: 'committee_member',  label: 'Committee Member',                       pts: 2 },
];

const CAT2_III_ACTIVITIES = [
  { value: 'orientation',       label: 'Orientation / Induction Programme',      pts: 3 },
  { value: 'refresher',         label: 'Refresher Course',                       pts: 3 },
  { value: 'short_term',        label: 'Short Term Course (≥ 1 week)',           pts: 2 },
  { value: 'seminar_attended',  label: 'Seminar / Conference Attended',          pts: 1 },
];

const MAX = { i: 20, ii: 15, iii: 15, total: 50 };
const SEMINAR_MAX = 5; // max 5 pts from seminars attended

const emptyItem = (section) => ({
  id: Date.now() + Math.random(),
  section,
  activityType: section === 'i'
    ? CAT2_I_ACTIVITIES[0].value
    : section === 'ii'
    ? CAT2_II_ACTIVITIES[0].value
    : CAT2_III_ACTIVITIES[0].value,
  years: 1,
  count: 1,
});

// ── Score calculators ──────────────────────────────────────────

function scoreItem(item) {
  if (item.section === 'i') {
    const act = CAT2_I_ACTIVITIES.find((a) => a.value === item.activityType);
    return (act?.pts ?? 0) * (item.years || 1);
  }
  if (item.section === 'ii') {
    const act = CAT2_II_ACTIVITIES.find((a) => a.value === item.activityType);
    return (act?.pts ?? 0) * (item.years || 1);
  }
  if (item.section === 'iii') {
    const act = CAT2_III_ACTIVITIES.find((a) => a.value === item.activityType);
    const baseScore = (act?.pts ?? 0) * (item.count || 1);
    // seminars capped at 5 pts total
    if (item.activityType === 'seminar_attended') {
      return Math.min(baseScore, SEMINAR_MAX);
    }
    return baseScore;
  }
  return 0;
}

function sectionTotal(items, section) {
  return items
    .filter((i) => i.section === section)
    .reduce((s, i) => s + scoreItem(i), 0);
}

// ── Component ─────────────────────────────────────────────────

export default function CatII({ onChange }) {
  const [items, setItems] = useState([]);

  const notify = (updated) => {
    const raw_i   = sectionTotal(updated, 'i');
    const raw_ii  = sectionTotal(updated, 'ii');
    const raw_iii = sectionTotal(updated, 'iii');
    const total_cat2 = Math.min(
      Math.min(raw_i, MAX.i) + Math.min(raw_ii, MAX.ii) + Math.min(raw_iii, MAX.iii),
      MAX.total
    );
    onChange?.({ items: updated, total_cat2 });
  };

  const addItem = (section) => {
    const item = emptyItem(section);
    const updated = [...items, item];
    setItems(updated);
    notify(updated);
  };

  const removeItem = (id) => {
    const updated = items.filter((i) => i.id !== id);
    setItems(updated);
    notify(updated);
  };

  const updateItem = (id, field, value) => {
    const updated = items.map((i) =>
      i.id === id ? { ...i, [field]: value } : i
    );
    setItems(updated);
    notify(updated);
  };

  // Derived totals
  const raw_i   = sectionTotal(items, 'i');
  const raw_ii  = sectionTotal(items, 'ii');
  const raw_iii = sectionTotal(items, 'iii');
  const capped_i   = Math.min(raw_i,   MAX.i);
  const capped_ii  = Math.min(raw_ii,  MAX.ii);
  const capped_iii = Math.min(raw_iii, MAX.iii);
  const total_cat2 = Math.min(capped_i + capped_ii + capped_iii, MAX.total);

  const sectionItems = (s) => items.filter((i) => i.section === s);

  // ── Render helpers ─────────────────────────────────────────

  const SectionHeader = ({ label, sub, score, max, color }) => (
    <div className={`flex items-center justify-between rounded-xl px-4 py-3 ${color}`}>
      <div>
        <p className="font-semibold text-gray-800 text-sm">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
      </div>
      <div className="text-right">
        <p className="text-xl font-black text-indigo-700">{Math.min(score, max)}</p>
        <p className="text-xs text-gray-400">/ {max} pts</p>
        {score > max && (
          <p className="text-xs text-orange-500 font-medium">Capped at {max}</p>
        )}
      </div>
    </div>
  );

  const ItemRow = ({ item, activities, showYears = true }) => (
    <div className="flex flex-wrap gap-3 items-end bg-white border border-gray-100 rounded-xl p-3">
      {/* Activity select */}
      <div className="flex-1 min-w-[200px]">
        <label className="text-xs font-medium text-gray-500 mb-1 block">Activity</label>
        <select
          value={item.activityType}
          onChange={(e) => updateItem(item.id, 'activityType', e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/20 focus:border-indigo-400 bg-white"
        >
          {activities.map((a) => (
            <option key={a.value} value={a.value}>
              {a.label} ({a.pts} pts{showYears ? '/yr' : ' each'})
            </option>
          ))}
        </select>
      </div>

      {/* Years or Count */}
      {showYears ? (
        <div className="w-28">
          <label className="text-xs font-medium text-gray-500 mb-1 block">Years</label>
          <input
            type="number"
            min="1"
            max="10"
            value={item.years}
            onChange={(e) => updateItem(item.id, 'years', Number(e.target.value))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/20 focus:border-indigo-400 bg-white"
          />
        </div>
      ) : (
        <div className="w-28">
          <label className="text-xs font-medium text-gray-500 mb-1 block">Count</label>
          <input
            type="number"
            min="1"
            max="20"
            value={item.count}
            onChange={(e) => updateItem(item.id, 'count', Number(e.target.value))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/20 focus:border-indigo-400 bg-white"
          />
        </div>
      )}

      {/* Score badge */}
      <div className="w-20 text-center">
        <label className="text-xs font-medium text-gray-500 mb-1 block">Score</label>
        <div className="bg-indigo-50 rounded-lg py-2 text-sm font-bold text-indigo-700">
          {scoreItem(item)} pts
        </div>
      </div>

      {/* Remove */}
      <button
        type="button"
        onClick={() => removeItem(item.id)}
        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors mb-0.5"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Category II — Co-curricular & Professional Development
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">UGC 2018 · Max 50 pts total</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Cat II Total</p>
          <p className="text-3xl font-black text-indigo-700">{total_cat2}</p>
          <p className="text-xs text-gray-400">/ 50 pts</p>
        </div>
      </div>

      {/* Info */}
      <div className="flex items-start gap-2 bg-indigo-50 border border-indigo-100 rounded-lg px-4 py-3 text-xs text-indigo-800">
        <Info size={14} className="mt-0.5 shrink-0 text-indigo-400" />
        <span>
          Three sub-sections: <strong>II(i)</strong> Student Activities (max 20), <strong>II(ii)</strong> Admin Responsibilities (max 15), <strong>II(iii)</strong> Professional Development (max 15). Grand total capped at <strong>50 pts</strong>.
        </span>
      </div>

      {/* ── II(i) Student Co-curricular ── */}
      <div className="space-y-3">
        <SectionHeader
          label="II(i) — Student Co-curricular Activities"
          sub="NSS/NCC, Cultural, Sports, Counselling · Max 20 pts"
          score={raw_i}
          max={MAX.i}
          color="bg-blue-50"
        />
        {sectionItems('i').map((item) => (
          <ItemRow key={item.id} item={item} activities={CAT2_I_ACTIVITIES} showYears={true} />
        ))}
        <button
          type="button"
          onClick={() => addItem('i')}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed border-indigo-200 rounded-xl text-indigo-500 hover:border-indigo-400 hover:bg-indigo-50 transition-all text-sm font-medium"
        >
          <PlusCircle size={16} /> Add Activity
        </button>
      </div>

      {/* ── II(ii) Admin Responsibilities ── */}
      <div className="space-y-3">
        <SectionHeader
          label="II(ii) — Administrative Responsibilities"
          sub="Dean / HoD / Warden / Committee · Max 15 pts"
          score={raw_ii}
          max={MAX.ii}
          color="bg-purple-50"
        />
        {sectionItems('ii').map((item) => (
          <ItemRow key={item.id} item={item} activities={CAT2_II_ACTIVITIES} showYears={true} />
        ))}
        <button
          type="button"
          onClick={() => addItem('ii')}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed border-purple-200 rounded-xl text-purple-500 hover:border-purple-400 hover:bg-purple-50 transition-all text-sm font-medium"
        >
          <PlusCircle size={16} /> Add Responsibility
        </button>
      </div>

      {/* ── II(iii) Professional Development ── */}
      <div className="space-y-3">
        <SectionHeader
          label="II(iii) — Professional Development"
          sub="Orientation / Refresher / Short Course / Seminars · Max 15 pts"
          score={raw_iii}
          max={MAX.iii}
          color="bg-emerald-50"
        />
        <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-100 rounded-lg px-3 py-2 text-xs text-yellow-800">
          <Info size={13} className="mt-0.5 shrink-0" />
          <span>Seminars/Conferences attended: max <strong>5 pts</strong> total (1 pt each).</span>
        </div>
        {sectionItems('iii').map((item) => (
          <ItemRow key={item.id} item={item} activities={CAT2_III_ACTIVITIES} showYears={false} />
        ))}
        <button
          type="button"
          onClick={() => addItem('iii')}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed border-emerald-200 rounded-xl text-emerald-500 hover:border-emerald-400 hover:bg-emerald-50 transition-all text-sm font-medium"
        >
          <PlusCircle size={16} /> Add Programme
        </button>
      </div>

      {/* ── Total Summary ── */}
      <div className="bg-indigo-700 text-white rounded-xl px-5 py-4 space-y-2">
        <p className="text-sm font-semibold opacity-80 mb-2">Category II Summary</p>
        {[
          ['II(i) Student Activities',       capped_i,   MAX.i,   raw_i],
          ['II(ii) Admin Responsibilities',  capped_ii,  MAX.ii,  raw_ii],
          ['II(iii) Professional Dev.',      capped_iii, MAX.iii, raw_iii],
        ].map(([label, capped, max, raw]) => (
          <div key={label} className="flex justify-between text-sm">
            <span className="opacity-80">{label}</span>
            <span className="font-bold">
              {capped} pts {raw > max && <span className="text-yellow-300 text-xs">(capped from {raw})</span>}
            </span>
          </div>
        ))}
        <div className="flex justify-between font-black text-lg border-t border-white/20 pt-2 mt-1">
          <span>Total</span>
          <span>{total_cat2} / {MAX.total} pts</span>
        </div>
      </div>

    </div>
  );
}