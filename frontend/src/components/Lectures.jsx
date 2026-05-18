import { useState } from "react";

// UGC 2018 Table III - Section 5: Invited Lectures / Resource Person
const LECTURE_LEVELS = [
  { value: "international_abroad", label: "International (Abroad)", score: 7 },
  { value: "international_within", label: "International (Within Country)", score: 5 },
  { value: "national", label: "National", score: 3 },
  { value: "state_university", label: "State / University", score: 2 },
];

const EMPTY_LECTURE = () => ({
  id: Date.now() + Math.random(),
  level: "national",
  title: "",
  organizer: "",
  year: "",
  score: 3,
});

/**
 * Props:
 *   data          — existing lectures array
 *   onChange      — fn({ lectures, lectures_total })
 *   policyDocTotal — total from PatentsAwards policy_document items
 *   totalResearch  — grand total of all Cat III research score (for 30% cap warning)
 */
export default function Lectures({
  data = [],
  onChange,
  policyDocTotal = 0,
  totalResearch = 0,
}) {
  const [items, setItems] = useState(data);

  const notify = (updated) => {
    setItems(updated);
    const total = updated.reduce((s, i) => s + i.score, 0);
    onChange?.({ lectures: updated, lectures_total: total });
  };

  const addLecture = () => notify([...items, EMPTY_LECTURE()]);

  const removeItem = (id) => notify(items.filter((i) => i.id !== id));

  const updateItem = (id, field, value) => {
    const updated = items.map((item) => {
      if (item.id !== id) return item;
      const next = { ...item, [field]: value };
      if (field === "level") {
        next.score = LECTURE_LEVELS.find((l) => l.value === value)?.score ?? 0;
      }
      return next;
    });
    notify(updated);
  };

  const lecturesTotal = items.reduce((s, i) => s + i.score, 0);
  const combinedTotal = lecturesTotal + policyDocTotal;

  // 30% cap check — warn if cap might be exceeded
  // Actual cap applied in backend, but show warning here
  const capLimit = totalResearch > 0 ? Math.round(totalResearch * 0.3) : null;
  const capExceeded = capLimit !== null && combinedTotal > capLimit;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-1">
        Category III — Section 5
      </h2>
      <p className="text-sm text-gray-500 mb-1">
        Invited Lectures / Resource Person (UGC 2018)
      </p>

      {/* 30% cap note */}
      <div
        className={`text-xs rounded px-3 py-2 mb-5 border ${
          capExceeded
            ? "bg-red-50 border-red-300 text-red-700"
            : "bg-yellow-50 border-yellow-200 text-yellow-700"
        }`}
      >
        <strong>UGC Rule:</strong> Policy Documents (Sec 4b) + Invited Lectures
        (Sec 5) combined score is{" "}
        <strong>capped at 30% of total research score.</strong>
        {capLimit !== null && (
          <span>
            {" "}
            Current combined: <strong>{combinedTotal}</strong> pts | 30% cap:{" "}
            <strong>{capLimit}</strong> pts
            {capExceeded && (
              <span className="ml-1 font-bold">⚠ Cap exceeded!</span>
            )}
          </span>
        )}
        {capLimit === null && (
          <span> (Cap calculated after all scores entered.)</span>
        )}
      </div>

      {/* Add button */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-gray-700">Lectures / Talks</h3>
        <button
          type="button"
          onClick={addLecture}
          className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + Add Lecture
        </button>
      </div>

      {items.length === 0 && (
        <p className="text-sm text-gray-400 italic mb-4">No entries yet.</p>
      )}

      {items.map((item) => (
        <div
          key={item.id}
          className="grid grid-cols-12 gap-2 items-center mb-2 bg-gray-50 p-2 rounded border"
        >
          {/* Title */}
          <div className="col-span-4">
            <input
              type="text"
              placeholder="Lecture Title"
              value={item.title}
              onChange={(e) => updateItem(item.id, "title", e.target.value)}
              className="w-full border rounded px-2 py-1 text-sm"
            />
          </div>

          {/* Organizer */}
          <div className="col-span-3">
            <input
              type="text"
              placeholder="Organizer / Institute"
              value={item.organizer}
              onChange={(e) =>
                updateItem(item.id, "organizer", e.target.value)
              }
              className="w-full border rounded px-2 py-1 text-sm"
            />
          </div>

          {/* Level */}
          <div className="col-span-2">
            <select
              value={item.level}
              onChange={(e) => updateItem(item.id, "level", e.target.value)}
              className="w-full border rounded px-2 py-1 text-sm bg-white"
            >
              {LECTURE_LEVELS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label} ({l.score}pts)
                </option>
              ))}
            </select>
          </div>

          {/* Year */}
          <div className="col-span-1">
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

      {/* Totals */}
      <div className="mt-4 flex justify-end gap-4">
        <div className="bg-gray-50 border rounded px-4 py-2 text-right">
          <span className="text-sm text-gray-600">Lectures Total: </span>
          <span className="text-lg font-bold text-gray-700">
            {lecturesTotal}
          </span>
          <span className="text-sm text-gray-500"> pts</span>
        </div>
        <div
          className={`border rounded px-4 py-2 text-right ${
            capExceeded
              ? "bg-red-50 border-red-300"
              : "bg-blue-50 border-blue-200"
          }`}
        >
          <span className="text-sm text-gray-600">
            Policy Docs + Lectures:{" "}
          </span>
          <span
            className={`text-xl font-bold ${
              capExceeded ? "text-red-700" : "text-blue-700"
            }`}
          >
            {combinedTotal}
          </span>
          <span className="text-sm text-gray-500"> pts</span>
        </div>
      </div>
    </div>
  );
}