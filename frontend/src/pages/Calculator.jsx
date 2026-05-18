import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import ResearchPapers from '../components/ResearchPapers';
import Books from '../components/Books';
import PhdProjects from '../components/PhdProjects';
import PatentsAwards from '../components/PatentsAwards';
import Lectures from '../components/Lectures';
import { calculateAPI } from '../services/api';

const TOTAL_STEPS = 8;

const STEP_LABELS = [
  'Dimensions',
  'Cat I & II',
  'Research Papers',
  'Books',
  'PhD & Projects',
  'Patents & Awards',
  'Lectures',
  'Review',
];

const MINIMUMS = {
  'Assistant Professor (Stage 1)': { cat1: 75, cat2: 15, cat3: 10 },
  'Assistant Professor (Stage 2)': { cat1: 75, cat2: 15, cat3: 20 },
  'Assistant Professor (Stage 3)': { cat1: 75, cat2: 15, cat3: 30 },
  'Associate Professor':           { cat1: 75, cat2: 15, cat3: 40 },
  'Professor':                     { cat1: 75, cat2: 15, cat3: 50 },
};

function calcCat3Total(formData) {
  const papersTotal = (formData.research_papers || []).reduce(
    (s, p) => s + (p.score || 0), 0
  );
  const booksTotal = (formData.books || []).reduce(
    (s, b) => s + (b.score || 0), 0
  );
  const phdTotal = (formData.phd_projects || []).reduce(
    (s, p) => s + (p.score || 0), 0
  );

  const patentItems = formData.patents_awards || [];
  const policyDocTotal = patentItems
    .filter((i) => i.type === 'policy_document')
    .reduce((s, i) => s + (i.score || 0), 0);
  const patentsAwardsTotal = patentItems
    .filter((i) => i.type !== 'policy_document')
    .reduce((s, i) => s + (i.score || 0), 0);

  const lecturesTotal = (formData.lectures || []).reduce(
    (s, l) => s + (l.score || 0), 0
  );

  const rawTotal =
    papersTotal + booksTotal + phdTotal +
    patentsAwardsTotal + policyDocTotal + lecturesTotal;

  const combinedPL = policyDocTotal + lecturesTotal;
  const cap30 = Math.round(rawTotal * 0.3);
  const excess = combinedPL > cap30 ? combinedPL - cap30 : 0;

  return {
    papersTotal,
    booksTotal,
    phdTotal,
    patentsAwardsTotal,
    policyDocTotal,
    lecturesTotal,
    rawTotal,
    capApplied: excess > 0,
    cap30,
    excess,
    total: rawTotal - excess,
  };
}

const Calculator = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const [formData, setFormData] = useState({
    regulation: '2018',
    discipline: 'Science',
    designation: 'Assistant Professor (Stage 1)',
    institutionType: 'University',
    statePSC: 'JPSC',
    purpose: 'CAS Promotion',
    cat1_teaching: 0,
    cat1_admin: 0,
    cat2_co_curricular: 0,
    research_papers: [],
    books: [],
    phd_projects: [],
    patents_awards: [],
    lectures: [],
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNext = () => setStep((s) => s + 1);
  const handleBack = () => setStep((s) => s - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');

    try {
      const res = await calculateAPI.submit(formData);
      const result = res.data;

      localStorage.setItem('last_calc', JSON.stringify({
        ...formData,
        ...result,
        cat3_breakdown: result.breakdown?.cat3,
      }));

      navigate('/result');
    } catch (err) {
      setSubmitError(
        err.response?.data?.error || 'Calculation failed. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Derived scores
  const total_cat1 = Math.min(
    Number(formData.cat1_teaching) + Number(formData.cat1_admin),
    100
  );
  const total_cat2 = Math.min(Number(formData.cat2_co_curricular), 20);
  const cat3 = calcCat3Total(formData);
  const grand_total = total_cat1 + total_cat2 + cat3.total;
  const mins = MINIMUMS[formData.designation] || {};

  const policyDocTotal = (formData.patents_awards || [])
    .filter((i) => i.type === 'policy_document')
    .reduce((s, i) => s + (i.score || 0), 0);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">API Score Calculator</h1>
        <p className="text-gray-600">
          Fill in the details to calculate your academic performance indicator.
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center mb-8 bg-white p-4 rounded-lg shadow-sm overflow-x-auto gap-1">
        {STEP_LABELS.map((label, idx) => {
          const num = idx + 1;
          return (
            <div key={num} className="flex items-center flex-1 last:flex-none min-w-0">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-colors shrink-0 ${
                  step === num
                    ? 'bg-blue-700 text-white'
                    : step > num
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {num}
              </div>
              <div
                className={`px-1 text-xs font-medium truncate hidden sm:block ${
                  step === num ? 'text-blue-700' : 'text-gray-400'
                }`}
              >
                {label}
              </div>
              {num < TOTAL_STEPS && (
                <div className="flex-1 h-px bg-gray-200 mx-1 shrink-0 min-w-[8px]" />
              )}
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="card">

        {/* ── Step 1: Dimensions ── */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold border-b pb-2">Academic Dimensions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Regulation Year</label>
                <select name="regulation" value={formData.regulation} onChange={handleChange} className="input-field">
                  <option>2010</option>
                  <option>2016</option>
                  <option>2018</option>
                  <option>2025</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Discipline</label>
                <select name="discipline" value={formData.discipline} onChange={handleChange} className="input-field">
                  <option>Science</option>
                  <option>Arts</option>
                  <option>Humanities</option>
                  <option>Commerce</option>
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
                  <option>University</option>
                  <option>Constituent College</option>
                  <option>Affiliated College</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">State PSC</label>
                <select name="statePSC" value={formData.statePSC} onChange={handleChange} className="input-field">
                  <option>JPSC</option>
                  <option>MPPSC</option>
                  <option>UPPSC</option>
                  <option>BPSC</option>
                  <option>RPSC</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Purpose</label>
                <select name="purpose" value={formData.purpose} onChange={handleChange} className="input-field">
                  <option>CAS Promotion</option>
                  <option>Direct Recruitment</option>
                  <option>PBAS Submission</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2: Cat I & II ── */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold border-b pb-2">
              Teaching & Co-curricular (Cat I & II)
            </h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex justify-between">
                  Teaching Workload Score (Max 100)
                  <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-xs">Cat I</span>
                </label>
                <input
                  type="number"
                  name="cat1_teaching"
                  value={formData.cat1_teaching}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Points for classes taken"
                  min="0" max="100"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Administrative Responsibilities
                </label>
                <input
                  type="number"
                  name="cat1_admin"
                  value={formData.cat1_admin}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Exam duties, committees, etc."
                  min="0"
                />
              </div>
              <div className="pt-4 border-t">
                <label className="text-sm font-medium text-gray-700 flex justify-between">
                  Co-curricular & Professional Development (Max 20)
                  <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-xs">Cat II</span>
                </label>
                <input
                  type="number"
                  name="cat2_co_curricular"
                  value={formData.cat2_co_curricular}
                  onChange={handleChange}
                  className="input-field mt-2"
                  placeholder="Seminars, workshops, field work"
                  min="0" max="20"
                />
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg flex items-start space-x-3">
              <Info className="text-blue-600 mt-0.5 shrink-0" size={18} />
              <p className="text-xs text-blue-700 leading-relaxed">
                Category I score is based on hours per week and actual classes engaged.
                Max score caps at 100 even if you earn more.
              </p>
            </div>
          </div>
        )}

        {/* ── Step 3: Research Papers ── */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold border-b pb-2">
              Research Papers · Category III
            </h2>
            <ResearchPapers
              discipline={formData.discipline}
              data={formData.research_papers}
              onChange={(papers) =>
                setFormData((prev) => ({ ...prev, research_papers: papers }))
              }
            />
          </div>
        )}

        {/* ── Step 4: Books ── */}
        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold border-b pb-2">
              Books & Translation · Category III
            </h2>
            <Books
              data={formData.books}
              onChange={(items) =>
                setFormData((prev) => ({ ...prev, books: items }))
              }
            />
          </div>
        )}

        {/* ── Step 5: PhD & Projects ── */}
        {step === 5 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold border-b pb-2">
              PhD & Projects · Category III
            </h2>
            <PhdProjects
              data={formData.phd_projects}
              onChange={(items) =>
                setFormData((prev) => ({ ...prev, phd_projects: items }))
              }
            />
          </div>
        )}

        {/* ── Step 6: Patents & Awards ── */}
        {step === 6 && (
          <div className="space-y-6">
            <PatentsAwards
              data={formData.patents_awards}
              onChange={({ patents_awards }) =>
                setFormData((prev) => ({ ...prev, patents_awards }))
              }
            />
          </div>
        )}

        {/* ── Step 7: Lectures ── */}
        {step === 7 && (
          <div className="space-y-6">
            <Lectures
              data={formData.lectures}
              policyDocTotal={policyDocTotal}
              totalResearch={cat3.rawTotal}
              onChange={({ lectures }) =>
                setFormData((prev) => ({ ...prev, lectures }))
              }
            />
          </div>
        )}

        {/* ── Step 8: Review & Submit ── */}
        {step === 8 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold border-b pb-2">Review & Submit</h2>

            {/* Cat I / II / III cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <p className="text-xs text-blue-600 font-medium mb-1">Category I</p>
                <p className="text-3xl font-black text-blue-700">{total_cat1}</p>
                <p className="text-xs text-blue-500 mt-1">/ 100 pts</p>
                {total_cat1 < (mins.cat1 || 0) && (
                  <p className="text-xs text-red-500 mt-1 font-semibold">
                    ⚠ Min {mins.cat1} required
                  </p>
                )}
              </div>
              <div className="bg-indigo-50 rounded-xl p-4 text-center">
                <p className="text-xs text-indigo-600 font-medium mb-1">Category II</p>
                <p className="text-3xl font-black text-indigo-700">{total_cat2}</p>
                <p className="text-xs text-indigo-500 mt-1">/ 20 pts</p>
                {total_cat2 < (mins.cat2 || 0) && (
                  <p className="text-xs text-red-500 mt-1 font-semibold">
                    ⚠ Min {mins.cat2} required
                  </p>
                )}
              </div>
              <div className="bg-emerald-50 rounded-xl p-4 text-center">
                <p className="text-xs text-emerald-600 font-medium mb-1">Category III</p>
                <p className="text-3xl font-black text-emerald-700">
                  {cat3.total.toFixed(2)}
                </p>
                <p className="text-xs text-emerald-500 mt-1">pts</p>
                {cat3.total < (mins.cat3 || 0) && (
                  <p className="text-xs text-red-500 mt-1 font-semibold">
                    ⚠ Min {mins.cat3} required
                  </p>
                )}
              </div>
            </div>

            {/* Cat III breakdown */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <p className="text-sm font-semibold text-gray-700 mb-3">Category III Breakdown</p>
              {[
                { label: 'Research Papers', val: cat3.papersTotal },
                { label: 'Books & Translation', val: cat3.booksTotal },
                { label: 'PhD & Projects', val: cat3.phdTotal },
                { label: 'Patents & Awards', val: cat3.patentsAwardsTotal },
                { label: 'Policy Documents', val: cat3.policyDocTotal },
                { label: 'Invited Lectures', val: cat3.lecturesTotal },
              ].map(({ label, val }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-gray-600">{label}</span>
                  <span className="font-semibold text-gray-800">
                    {typeof val === 'number' ? val.toFixed(2) : val} pts
                  </span>
                </div>
              ))}
              {cat3.capApplied && (
                <div className="flex justify-between text-sm text-red-600 border-t pt-2 mt-2">
                  <span>30% Cap Deduction (Policy Docs + Lectures)</span>
                  <span className="font-semibold">- {cat3.excess} pts</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold border-t pt-2 mt-2 text-emerald-700">
                <span>Cat III Total</span>
                <span>{cat3.total.toFixed(2)} pts</span>
              </div>
            </div>

            {/* Grand total */}
            <div className="bg-gray-900 text-white rounded-xl p-5 text-center">
              <p className="text-sm opacity-70 mb-1">Estimated Grand Total</p>
              <p className="text-5xl font-black">{grand_total.toFixed(2)}</p>
              <p className="text-sm opacity-50 mt-1">
                {formData.designation} · UGC {formData.regulation} · {formData.discipline}
              </p>
            </div>

            {/* Eligible / Not eligible */}
            {(() => {
              const gaps = [];
              if (total_cat1 < (mins.cat1 || 0))
                gaps.push(`Cat I: need ${mins.cat1 - total_cat1} more pts`);
              if (total_cat2 < (mins.cat2 || 0))
                gaps.push(`Cat II: need ${mins.cat2 - total_cat2} more pts`);
              if (cat3.total < (mins.cat3 || 0))
                gaps.push(`Cat III: need ${(mins.cat3 - cat3.total).toFixed(2)} more pts`);

              return gaps.length === 0 ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center text-green-700 font-semibold">
                  ✅ Eligible for {formData.purpose}
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700 font-semibold mb-2">❌ Not yet eligible — Gap Analysis:</p>
                  <ul className="text-sm text-red-600 space-y-1">
                    {gaps.map((g) => <li key={g}>• {g}</li>)}
                  </ul>
                </div>
              );
            })()}

            {/* Submit error */}
            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm text-center">
                {submitError}
              </div>
            )}
          </div>
        )}

        {/* ── Navigation ── */}
        <div className="flex justify-between mt-10 pt-6 border-t">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
            >
              <ChevronLeft size={20} className="mr-1" /> Back
            </button>
          ) : (
            <div />
          )}

          {step < TOTAL_STEPS ? (
            <button
              type="button"
              onClick={handleNext}
              className="btn-primary flex items-center px-8"
            >
              Next <ChevronRight size={20} className="ml-1" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-8 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium disabled:opacity-50 transition-all"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <Save size={20} /> Calculate & Save
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default Calculator;