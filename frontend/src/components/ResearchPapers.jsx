import React, { useState } from 'react';
import { PlusCircle, Trash2, Info, ChevronDown } from 'lucide-react';

// UGC 2018 scoring rules — Arts/Humanities group
// Science group scores are ~25% higher (multiply by 1.25)
const SCORES = {
  'non_refereed_no_if': { single: 10, two: 7, first: 7, joint: 3 },
  'refereed_no_if': { single: 15, two: 10.5, first: 10.5, joint: 4.5 },
  'if_below_1': { single: 20, two: 14, first: 14, joint: 6 },
  'if_1_2': { single: 25, two: 17.5, first: 17.5, joint: 7.5 },
  'if_2_5': { single: 30, two: 21, first: 21, joint: 9 },
  'if_5_10': { single: 35, two: 24.5, first: 24.5, joint: 10.5 },
  'if_above_10': { single: 40, two: 28, first: 28, joint: 12 },
};

const SCIENCE_MULTIPLIER = 1.25;

const JOURNAL_TYPES = [
  { value: 'non_refereed_no_if', label: 'UGC Listed / Non-Refereed (No Impact Factor)' },
  { value: 'refereed_no_if', label: 'Peer-Reviewed / Refereed (No Impact Factor)' },
  { value: 'if_below_1', label: 'Impact Factor < 1' },
  { value: 'if_1_2', label: 'Impact Factor 1–2' },
  { value: 'if_2_5', label: 'Impact Factor 2–5' },
  { value: 'if_5_10', label: 'Impact Factor 5–10' },
  { value: 'if_above_10', label: 'Impact Factor > 10' },
];

const AUTHOR_TYPES = [
  { value: 'single', label: 'Single Author' },
  { value: 'two', label: 'Two Authors (70% each)' },
  { value: 'first', label: 'First / Principal / Corresponding Author (3+ Authors)' },
  { value: 'joint', label: 'Joint Author (3+ Authors, 30% share)' },
];

const emptyPaper = () => ({
  id: Date.now() + Math.random(),
  title: '',
  journalType: 'refereed_no_if',
  authorType: 'single',
  score: 0,
});

function calcScore(journalType, authorType, discipline) {
  const base = SCORES[journalType]?.[authorType] ?? 0;
  return discipline === 'Science' ? +(base * SCIENCE_MULTIPLIER).toFixed(2) : base;
}

// export default function ResearchPapers({ discipline = 'Arts', onChange }) {
//   const [papers, setPapers] = useState([emptyPaper()]);
// const [expanded, setExpanded] = useState({});
// const firstPaper = papers[0];

export default function ResearchPapers({ discipline = 'Arts', onChange }) {
  const initialPaper = emptyPaper();
  initialPaper.score = calcScore(initialPaper.journalType, initialPaper.authorType, discipline);
  const [papers, setPapers] = useState([initialPaper]);
  const [expanded, setExpanded] = useState({ [initialPaper.id]: true }); // firstPaper.id → initialPaper.id

  React.useEffect(() => {
    onChange?.([initialPaper]);
  }, []); // eslint-disable-line



  const updatePaper = (id, field, value) => {
    const updated = papers.map((p) => {
      if (p.id !== id) return p;
      const next = { ...p, [field]: value };
      next.score = calcScore(
        field === 'journalType' ? value : next.journalType,
        field === 'authorType' ? value : next.authorType,
        discipline
      );
      return next;
    });
    setPapers(updated);
    onChange?.(updated);
  };

  const addPaper = () => {
    const paper = emptyPaper();
    paper.score = calcScore(paper.journalType, paper.authorType, discipline);
    const updated = [...papers, paper];
    setPapers(updated);
    setExpanded((e) => ({ ...e, [paper.id]: true }));
    onChange?.(updated);
  };

  const removePaper = (id) => {
    const updated = papers.filter((p) => p.id !== id);
    setPapers(updated);
    onChange?.(updated);
  };

  const toggleExpand = (id) =>
    setExpanded((e) => ({ ...e, [id]: !e[id] }));

  const total = papers.reduce((sum, p) => sum + (p.score || 0), 0);

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Research Papers
            <span className="ml-2 text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              Section 1 · Cat III
            </span>
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Peer-Reviewed / UGC Listed Journals · {discipline} group scoring
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Total Score</p>
          <p className="text-2xl font-black text-blue-700">{total.toFixed(2)}</p>
        </div>
      </div>

      {/* Info box */}
      <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-xs text-blue-800">
        <Info size={14} className="mt-0.5 shrink-0 text-blue-500" />
        <span>
          For <strong>2 authors</strong>: each gets 70% of base score. For <strong>3+ authors</strong>: First/Corresponding = 70%, Joint = 30%.
          {discipline === 'Science' && <> &nbsp;Science group scores are <strong>25% higher</strong> than Arts group.</>}
          &nbsp;Impact Factor must be from <strong>Thomson Reuters / Clarivate</strong> only.
        </span>
      </div>

      {/* Paper rows */}
      <div className="space-y-3">
        {papers.map((paper, idx) => (
          <div
            key={paper.id}
            className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm"
          >
            {/* Row header */}
            <div
              className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => toggleExpand(paper.id)}
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <span className="text-sm text-gray-700 font-medium truncate max-w-xs">
                  {paper.title || `Paper ${idx + 1}`}
                </span>
                {paper.journalType && (
                  <span className="hidden md:inline text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full truncate max-w-[160px]">
                    {JOURNAL_TYPES.find((j) => j.value === paper.journalType)?.label}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-sm font-bold text-blue-700 min-w-[48px] text-right">
                  {paper.score > 0 ? `+${paper.score}` : '—'}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); removePaper(paper.id); }}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remove"
                >
                  <Trash2 size={15} />
                </button>
                <ChevronDown
                  size={16}
                  className={`text-gray-400 transition-transform duration-200 ${expanded[paper.id] ? 'rotate-180' : ''}`}
                />
              </div>
            </div>

            {/* Expanded fields */}
            {expanded[paper.id] && (
              <div className="px-4 pb-4 pt-1 border-t border-gray-100 bg-gray-50 space-y-4">
                {/* Paper title */}
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">
                    Paper Title <span className="text-gray-400">(optional, for your reference)</span>
                  </label>
                  <input
                    type="text"
                    value={paper.title}
                    onChange={(e) => updatePaper(paper.id, 'title', e.target.value)}
                    placeholder="e.g. A Study on Machine Learning Applications..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Journal type */}
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">
                      Journal Type / Impact Factor
                    </label>
                    <select
                      value={paper.journalType}
                      onChange={(e) => updatePaper(paper.id, 'journalType', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
                    >
                      {JOURNAL_TYPES.map((j) => (
                        <option key={j.value} value={j.value}>{j.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Author type */}
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">
                      Your Author Position
                    </label>
                    <select
                      value={paper.authorType}
                      onChange={(e) => updatePaper(paper.id, 'authorType', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
                    >
                      {AUTHOR_TYPES.map((a) => (
                        <option key={a.value} value={a.value}>{a.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Score preview for this paper */}
                <div className="flex items-center justify-between bg-white border border-blue-100 rounded-lg px-4 py-2.5">
                  <span className="text-xs text-gray-500">Score for this paper</span>
                  <span className="text-base font-bold text-blue-700">
                    {paper.score > 0 ? `${paper.score} pts` : '—'}
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add paper button */}
      <button
        type="button"
        onClick={addPaper}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-blue-200 rounded-xl text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-all text-sm font-medium"
      >
        <PlusCircle size={18} />
        Add Research Paper
      </button>

      {/* Total summary */}
      {papers.length > 1 && (
        <div className="flex items-center justify-between bg-blue-700 text-white rounded-xl px-5 py-3">
          <span className="text-sm font-medium opacity-90">
            Total from {papers.length} paper{papers.length > 1 ? 's' : ''}
          </span>
          <span className="text-xl font-black">{total.toFixed(2)} pts</span>
        </div>
      )}
    </div>
  );
}