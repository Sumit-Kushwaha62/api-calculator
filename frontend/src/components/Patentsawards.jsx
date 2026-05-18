import { useState } from "react";

// UGC 2018 Table III - Section 4: Patents, Policy Documents, Awards
const SCORE_MAP = {
  patent: {
    international: 10,
    national: 7,
  },
  policy_document: {
    international: 10,
    national: 7,
    state: 4,
  },
  award: {
    international: 7,
    national: 5,
  },
};

const EMPTY_ITEM = (type) => ({
  id: Date.now() + Math.random(),
  type,
  level: Object.keys(SCORE_MAP[type])[0],
  title: "",
  year: "",
  score: Object.values(SCORE_MAP[type])[0],
});

export default function PatentsAwards({ data = [], onChange }) {
  const [items, setItems] = useState(data);

  const notify = (updated) => {
    setItems(updated);
    const total = updated.reduce((sum, i) => sum + i.score, 0);
    onChange?.({ patents_awards: updated, patents_awards_total: total });
  };

  const addItem = (type) => {
    notify([...items, EMPTY_ITEM(type)]);
  };

  const removeItem = (id) => {
    notify(items.filter((i) => i.id !== id));
  };

  const updateItem = (id, field, value) => {
    const updated = items.map((item) => {
      if (item.id !== id) return item;
      const next = { ...item, [field]: value };
      // recalc score if level changed
      if (field === "level") {
        next.score = SCORE_MAP[item.type][value];
      }
      return next;
    });
    notify(updated);
  };

  const totalScore = items.reduce((s, i) => s + i.score, 0);

  const sectionItems = (type, label) => (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-700">{label}</h3>
        <button
          type="button"
          onClick={() => addItem(type)}
          className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + Add
        </button>
      </div>

      {items.filter((i) => i.type === type).length === 0 && (
        <p className="text-sm text-gray-400 italic">No entries yet.</p>
      )}

      {items
        .filter((i) => i.type === type)
        .map((item) => (
          <div
            key={item.id}
            className="grid grid-cols-12 gap-2 items-center mb-2 bg-gray-50 p-2 rounded border"
          >
            {/* Title */}
            <div className="col-span-5">
              <input
                type="text"
                placeholder="Title / Description"
                value={item.title}
                onChange={(e) => updateItem(item.id, "title", e.target.value)}
                className="w-full border rounded px-2 py-1 text-sm"
              />
            </div>

            {/* Level */}
            <div className="col-span-3">
              <select
                value={item.level}
                onChange={(e) => updateItem(item.id, "level", e.target.value)}
                className="w-full border rounded px-2 py-1 text-sm bg-white"
              >
                {Object.keys(SCORE_MAP[type]).map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl.charAt(0).toUpperCase() + lvl.slice(1)} (
                    {SCORE_MAP[type][lvl]} pts)
                  </option>
                ))}
              </select>
            </div>

            {/* Year */}
            <div className="col-span-2">
              <input
                type="number"
                placeholder="Year"
                value={item.year}
                onChange={(e) => updateItem(item.id, "year", e.target.value)}
                className="w-full border rounded px-2 py-1 text-sm"
                min="1990"
                max="2030"
              />
            </div>

            {/* Score */}
            <div className="col-span-1 text-center font-bold text-blue-700 text-sm">
              {item.score}
            </div>

            {/* Remove */}
            <div className="col-span-1 text-right">
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="text-red-500 hover:text-red-700 text-lg font-bold"
                title="Remove"
              >
                ×
              </button>
            </div>
          </div>
        ))}
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-1">
        Category III — Section 4
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Patents, Policy Documents & Awards/Fellowships (UGC 2018)
      </p>

      {sectionItems("patent", "Patents Registered")}
      {sectionItems("policy_document", "Policy Documents")}
      {sectionItems("award", "Awards & Fellowships")}

      {/* Total */}
      <div className="mt-4 flex justify-end">
        <div className="bg-blue-50 border border-blue-200 rounded px-4 py-2 text-right">
          <span className="text-sm text-gray-600">Section 4 Total: </span>
          <span className="text-xl font-bold text-blue-700">{totalScore}</span>
          <span className="text-sm text-gray-500"> pts</span>
        </div>
      </div>
    </div>
  );
}