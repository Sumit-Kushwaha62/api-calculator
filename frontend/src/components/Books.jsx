import React, { useState } from 'react';
import { PlusCircle, Trash2, Info, ChevronDown, BookOpen, Languages } from 'lucide-react';

// UGC 2018 — Appendix II Table 2 exact scores
const BOOK_SCORES = {
  // Books Authored
  authored_international: { single: 12, two: 8.4, first: 8.4, joint: 3.6 },
  authored_national:      { single: 10, two: 7,   first: 7,   joint: 3   },
  // Chapter in Edited Book
  chapter:                { single: 5,  two: 3.5, first: 3.5, joint: 1.5 },
  // Editor of Book
  editor_international:   { single: 10 },
  editor_national:        { single: 8  },
};

const TRANSLATION_SCORES = {
  translation_chapter: { single: 3,  two: 2.1, first: 2.1, joint: 0.9 },
  translation_book:    { single: 8,  two: 5.6, first: 5.6, joint: 2.4 },
};

const BOOK_TYPES = [
  { value: 'authored_international', label: 'Book Authored — International Publisher', hasAuthor: true },
  { value: 'authored_national',      label: 'Book Authored — National Publisher',      hasAuthor: true },
  { value: 'chapter',                label: 'Chapter in Edited Book',                  hasAuthor: true },
  { value: 'editor_international',   label: 'Editor of Book — International Publisher', hasAuthor: false },
  { value: 'editor_national',        label: 'Editor of Book — National Publisher',      hasAuthor: false },
];

const TRANSLATION_TYPES = [
  { value: 'translation_chapter', label: 'Translation of Chapter / Research Paper', hasAuthor: true },
  { value: 'translation_book',    label: 'Translation of Full Book',                hasAuthor: true },
];

const AUTHOR_TYPES = [
  { value: 'single', label: 'Single Author' },
  { value: 'two',    label: 'Two Authors (70% each)' },
  { value: 'first',  label: 'First / Principal / Corresponding Author (3+ Authors)' },
  { value: 'joint',  label: 'Joint Author (3+ Authors, 30% share)' },
];

const emptyBook = () => ({
  id: Date.now() + Math.random(),
  section: 'book', // 'book' or 'translation'
  title: '',
  type: 'authored_national',
  authorType: 'single',
  score: 0,
});

function calcBookScore(section, type, authorType) {
  const table = section === 'translation' ? TRANSLATION_SCORES : BOOK_SCORES;
  const row = table[type];
  if (!row) return 0;
  // Editor types have no authorType
  if (row.single !== undefined && row.two === undefined) return row.single;
  return row[authorType] ?? 0;
}

export default function Books({ onChange }) {
  const [items, setItems] = useState([{ ...emptyBook(), score: calcBookScore('book', 'authored_national', 'single') }]);
  const [expanded, setExpanded] = useState({});
  const [activeTab, setActiveTab] = useState('book'); // for new item default

  const updateItem = (id, fields) => {
    const updated = items.map((item) => {
      if (item.id !== id) return item;
      const next = { ...item, ...fields };
      next.score = calcBookScore(next.section, next.type, next.authorType);
      return next;
    });
    setItems(updated);
    onChange?.(updated);
  };

  const addItem = (section) => {
    const defaultType = section === 'book' ? 'authored_national' : 'translation_chapter';
    const item = {
      ...emptyBook(),
      section,
      type: defaultType,
      authorType: 'single',
    };
    item.score = calcBookScore(section, defaultType, 'single');
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

  const books = items.filter((i) => i.section === 'book');
  const translations = items.filter((i) => i.section === 'translation');
  const total = items.reduce((s, i) => s + (i.score || 0), 0);

  const renderItem = (item, idx, allOfSection) => {
    const typeOptions = item.section === 'translation' ? TRANSLATION_TYPES : BOOK_TYPES;
    const selectedType = typeOptions.find((t) => t.value === item.type);
    const showAuthorType = selectedType?.hasAuthor !== false;

    return (
      <div key={item.id} className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
        {/* Row header */}
        <div
          className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => toggleExpand(item.id)}
        >
          <div className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center shrink-0">
              {idx + 1}
            </span>
            <span className="text-sm text-gray-700 font-medium truncate max-w-xs">
              {item.title || (item.section === 'translation' ? `Translation ${idx + 1}` : `Book/Chapter ${idx + 1}`)}
            </span>
            <span className="hidden md:inline text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full truncate max-w-[160px]">
              {selectedType?.label}
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-sm font-bold text-emerald-700 min-w-[48px] text-right">
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

        {/* Expanded */}
        {expanded[item.id] && (
          <div className="px-4 pb-4 pt-1 border-t border-gray-100 bg-gray-50 space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                Title <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                value={item.title}
                onChange={(e) => updateItem(item.id, { title: e.target.value })}
                placeholder={item.section === 'translation' ? 'e.g. Translation of xyz book...' : 'e.g. Fundamentals of Machine Learning...'}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 bg-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Type</label>
                <select
                  value={item.type}
                  onChange={(e) => updateItem(item.id, { type: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 bg-white"
                >
                  {typeOptions.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {showAuthorType && (
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Your Role</label>
                  <select
                    value={item.authorType}
                    onChange={(e) => updateItem(item.id, { authorType: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 bg-white"
                  >
                    {AUTHOR_TYPES.map((a) => (
                      <option key={a.value} value={a.value}>{a.label}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between bg-white border border-emerald-100 rounded-lg px-4 py-2.5">
              <span className="text-xs text-gray-500">Score for this entry</span>
              <span className="text-base font-bold text-emerald-700">
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
            Books & Translation Work
            <span className="ml-2 text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              Section 2 · Cat III
            </span>
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Books authored, chapters, edited books, translation work
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Total Score</p>
          <p className="text-2xl font-black text-emerald-700">{total.toFixed(2)}</p>
        </div>
      </div>

      {/* Info */}
      <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-100 rounded-lg px-4 py-3 text-xs text-emerald-800">
        <Info size={14} className="mt-0.5 shrink-0 text-emerald-500" />
        <span>
          For <strong>2 authors</strong>: each gets 70%. For <strong>3+ authors</strong>: First = 70%, Joint = 30%.
          Books must be published by recognized publishers with ISBN.
          Translation work valid only for <strong>qualified faculty</strong> in Indian and Foreign Languages.
        </span>
      </div>

      {/* Books Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <BookOpen size={16} className="text-emerald-600" />
          <h4 className="text-sm font-semibold text-gray-700">Books / Chapters</h4>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {books.length} entr{books.length === 1 ? 'y' : 'ies'}
          </span>
        </div>
        {books.map((item, idx) => renderItem(item, idx, books))}
        <button
          type="button"
          onClick={() => addItem('book')}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-emerald-200 rounded-xl text-emerald-600 hover:border-emerald-400 hover:bg-emerald-50 transition-all text-sm font-medium"
        >
          <PlusCircle size={18} />
          Add Book / Chapter
        </button>
      </div>

      {/* Translation Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Languages size={16} className="text-teal-600" />
          <h4 className="text-sm font-semibold text-gray-700">Translation Work</h4>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {translations.length} entr{translations.length === 1 ? 'y' : 'ies'}
          </span>
        </div>
        {translations.map((item, idx) => renderItem(item, idx, translations))}
        <button
          type="button"
          onClick={() => addItem('translation')}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-teal-200 rounded-xl text-teal-600 hover:border-teal-400 hover:bg-teal-50 transition-all text-sm font-medium"
        >
          <PlusCircle size={18} />
          Add Translation Work
        </button>
      </div>

      {/* Total */}
      {items.length > 0 && total > 0 && (
        <div className="flex items-center justify-between bg-emerald-700 text-white rounded-xl px-5 py-3">
          <span className="text-sm font-medium opacity-90">
            Total from {items.length} entr{items.length === 1 ? 'y' : 'ies'}
          </span>
          <span className="text-xl font-black">{total.toFixed(2)} pts</span>
        </div>
      )}
    </div>
  );
}