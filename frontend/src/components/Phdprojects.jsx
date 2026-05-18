import React, { useState } from 'react';
import { PlusCircle, Trash2, Info, ChevronDown, GraduationCap, Briefcase } from 'lucide-react';

// UGC 2018 — Appendix II Table 2 exact scores
const PHD_SCORES = {
  // PhD Awarded
  phd_awarded_single:    10,
  phd_awarded_joint_sup: 7,
  phd_awarded_joint_co:  7,
  // PhD Submitted
  phd_submitted_single:    5,
  phd_submitted_joint_sup: 3.5,
  phd_submitted_joint_co:  3.5,
  // MPhil / PG Dissertation
  mphil_single:    2,
  mphil_joint_sup: 1.4,
  mphil_joint_co:  1.4,
};

const PROJECT_SCORES = {
  // Completed > 10 Lakhs
  completed_major_single: 10,
  completed_major_pi:     5,
  completed_major_co:     5,
  // Completed < 10 Lakhs
  completed_minor_single: 5,
  completed_minor_pi:     2.5,
  completed_minor_co:     2.5,
  // Ongoing > 10 Lakhs
  ongoing_major_single: 5,
  ongoing_major_pi:     2.5,
  ongoing_major_co:     2.5,
  // Ongoing < 10 Lakhs
  ongoing_minor_single: 2,
  ongoing_minor_pi:     1,
  ongoing_minor_co:     1,
};

const PHD_TYPES = [
  { value: 'phd_awarded_single',    label: 'Ph.D. Awarded — Single Supervisor',           score: 10  },
  { value: 'phd_awarded_joint_sup', label: 'Ph.D. Awarded — Supervisor (Joint Guidance)', score: 7   },
  { value: 'phd_awarded_joint_co',  label: 'Ph.D. Awarded — Co-Supervisor (Joint)',       score: 7   },
  { value: 'phd_submitted_single',  label: 'Ph.D. Submitted — Single Supervisor',         score: 5   },
  { value: 'phd_submitted_joint_sup', label: 'Ph.D. Submitted — Supervisor (Joint)',      score: 3.5 },
  { value: 'phd_submitted_joint_co',  label: 'Ph.D. Submitted — Co-Supervisor (Joint)',   score: 3.5 },
  { value: 'mphil_single',          label: 'M.Phil./PG Dissertation — Single Supervisor', score: 2   },
  { value: 'mphil_joint_sup',       label: 'M.Phil./PG Dissertation — Supervisor (Joint)', score: 1.4 },
  { value: 'mphil_joint_co',        label: 'M.Phil./PG Dissertation — Co-Supervisor',     score: 1.4 },
];

const PROJECT_TYPES = [
  { value: 'completed_major_single', label: 'Completed (>10L) — Single Investigator',    score: 10  },
  { value: 'completed_major_pi',     label: 'Completed (>10L) — Principal Investigator', score: 5   },
  { value: 'completed_major_co',     label: 'Completed (>10L) — Co-Investigator',        score: 5   },
  { value: 'completed_minor_single', label: 'Completed (<10L) — Single Investigator',    score: 5   },
  { value: 'completed_minor_pi',     label: 'Completed (<10L) — Principal Investigator', score: 2.5 },
  { value: 'completed_minor_co',     label: 'Completed (<10L) — Co-Investigator',        score: 2.5 },
  { value: 'ongoing_major_single',   label: 'Ongoing (>10L) — Single Investigator',      score: 5   },
  { value: 'ongoing_major_pi',       label: 'Ongoing (>10L) — Principal Investigator',   score: 2.5 },
  { value: 'ongoing_major_co',       label: 'Ongoing (>10L) — Co-Investigator',          score: 2.5 },
  { value: 'ongoing_minor_single',   label: 'Ongoing (<10L) — Single Investigator',      score: 2   },
  { value: 'ongoing_minor_pi',       label: 'Ongoing (<10L) — Principal Investigator',   score: 1   },
  { value: 'ongoing_minor_co',       label: 'Ongoing (<10L) — Co-Investigator',          score: 1   },
];

const emptyItem = (section) => ({
  id: Date.now() + Math.random(),
  section,
  title: '',
  type: section === 'phd' ? 'phd_awarded_single' : 'completed_major_single',
  score: section === 'phd' ? PHD_SCORES['phd_awarded_single'] : PROJECT_SCORES['completed_major_single'],
});

export default function PhdProjects({ onChange }) {
  const [items, setItems] = useState([]);
  const [expanded, setExpanded] = useState({});

  const updateItem = (id, fields) => {
    const updated = items.map((item) => {
      if (item.id !== id) return item;
      const next = { ...item, ...fields };
      const table = next.section === 'phd' ? PHD_SCORES : PROJECT_SCORES;
      next.score = table[next.type] ?? 0;
      return next;
    });
    setItems(updated);
    onChange?.(updated);
  };

  const addItem = (section) => {
    const item = emptyItem(section);
    const updated = [...items, item];
    setItems(updated);
    setExpanded((e) => ({ ...e, [item.id]: true }));
    onChange?.(updated);
  };

  const removeItem = (id) => {
    const updated = items.filter((i) => i.id !== id);
    setItems(updated);
    onChange?.(updated);
  };

  const toggleExpand = (id) =>
    setExpanded((e) => ({ ...e, [id]: !e[id] }));

  const phdItems = items.filter((i) => i.section === 'phd');
  const projectItems = items.filter((i) => i.section === 'project');
  const total = items.reduce((s, i) => s + (i.score || 0), 0);

  const renderItem = (item, idx) => {
    const typeOptions = item.section === 'phd' ? PHD_TYPES : PROJECT_TYPES;
    const selectedType = typeOptions.find((t) => t.value === item.type);
    const color = item.section === 'phd' ? 'violet' : 'amber';

    return (
      <div key={item.id} className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
        <div
          className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => toggleExpand(item.id)}
        >
          <div className="flex items-center gap-3">
            <span className={`w-6 h-6 rounded-full bg-${color}-100 text-${color}-700 text-xs font-bold flex items-center justify-center shrink-0`}>
              {idx + 1}
            </span>
            <span className="text-sm text-gray-700 font-medium truncate max-w-xs">
              {item.title || (item.section === 'phd' ? `PhD/MPhil Entry ${idx + 1}` : `Project ${idx + 1}`)}
            </span>
            <span className="hidden md:inline text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full truncate max-w-[160px]">
              {selectedType?.label}
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className={`text-sm font-bold text-${color}-700 min-w-[48px] text-right`}>
              {item.score > 0 ? `+${item.score}` : '—'}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 size={15} />
            </button>
            <ChevronDown
              size={16}
              className={`text-gray-400 transition-transform duration-200 ${expanded[item.id] ? 'rotate-180' : ''}`}
            />
          </div>
        </div>

        {expanded[item.id] && (
          <div className="px-4 pb-4 pt-1 border-t border-gray-100 bg-gray-50 space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                {item.section === 'phd' ? 'Scholar Name' : 'Project Title'}{' '}
                <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                value={item.title}
                onChange={(e) => updateItem(item.id, { title: e.target.value })}
                placeholder={item.section === 'phd' ? 'e.g. Mr. Rahul Sharma...' : 'e.g. DST funded project on...'}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                {item.section === 'phd' ? 'Guidance Type' : 'Project Type & Role'}
              </label>
              <select
                value={item.type}
                onChange={(e) => updateItem(item.id, { type: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 bg-white"
              >
                {typeOptions.map((t) => (
                  <option key={t.value} value={t.value}>{t.label} — {t.score} pts</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between bg-white border border-violet-100 rounded-lg px-4 py-2.5">
              <span className="text-xs text-gray-500">Score for this entry</span>
              <span className="text-base font-bold text-violet-700">
                {item.score > 0 ? `${item.score} pts` : '—'}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            PhD Guidance & Research Projects
            <span className="ml-2 text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              Section 3 · Cat III
            </span>
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            PhD / M.Phil. guidance + completed / ongoing research projects
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Total Score</p>
          <p className="text-2xl font-black text-violet-700">{total.toFixed(2)}</p>
        </div>
      </div>

      {/* Info */}
      <div className="flex items-start gap-2 bg-violet-50 border border-violet-100 rounded-lg px-4 py-3 text-xs text-violet-800">
        <Info size={14} className="mt-0.5 shrink-0 text-violet-500" />
        <span>
          For <strong>joint PhD supervision</strong>: both Supervisor and Co-Supervisor get 70% each (not 50%).
          For <strong>joint projects</strong>: PI and Co-Investigator each get 50%.
          PhD Submitted = thesis submitted but not yet awarded.
        </span>
      </div>

      {/* PhD Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <GraduationCap size={16} className="text-violet-600" />
          <h4 className="text-sm font-semibold text-gray-700">PhD / M.Phil. Guidance</h4>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {phdItems.length} entr{phdItems.length === 1 ? 'y' : 'ies'}
          </span>
        </div>
        {phdItems.map((item, idx) => renderItem(item, idx))}
        <button
          type="button"
          onClick={() => addItem('phd')}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-violet-200 rounded-xl text-violet-600 hover:border-violet-400 hover:bg-violet-50 transition-all text-sm font-medium"
        >
          <PlusCircle size={18} />
          Add PhD / M.Phil. Entry
        </button>
      </div>

      {/* Projects Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Briefcase size={16} className="text-amber-600" />
          <h4 className="text-sm font-semibold text-gray-700">Research Projects</h4>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {projectItems.length} entr{projectItems.length === 1 ? 'y' : 'ies'}
          </span>
        </div>
        {projectItems.map((item, idx) => renderItem(item, idx))}
        <button
          type="button"
          onClick={() => addItem('project')}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-amber-200 rounded-xl text-amber-600 hover:border-amber-400 hover:bg-amber-50 transition-all text-sm font-medium"
        >
          <PlusCircle size={18} />
          Add Research Project
        </button>
      </div>

      {/* Total */}
      {total > 0 && (
        <div className="flex items-center justify-between bg-violet-700 text-white rounded-xl px-5 py-3">
          <span className="text-sm font-medium opacity-90">
            Total from {items.length} entr{items.length === 1 ? 'y' : 'ies'}
          </span>
          <span className="text-xl font-black">{total.toFixed(2)} pts</span>
        </div>
      )}
    </div>
  );
}