import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import ResearchPapers from '../components/ResearchPapers';

const TOTAL_STEPS = 4;

const Calculator = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
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
    research_papers: [], // ResearchPapers component se aayega
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleSubmit = (e) => {
    e.preventDefault();

    const total_cat1 = Math.min(
      Number(formData.cat1_teaching) + Number(formData.cat1_admin),
      100
    );
    const total_cat2 = Math.min(Number(formData.cat2_co_curricular), 20);
    const total_cat3_papers = formData.research_papers.reduce(
      (sum, p) => sum + (p.score || 0),
      0
    );
    const total_cat3 = Math.min(total_cat3_papers, 75);
    const grand_total = total_cat1 + total_cat2 + total_cat3;

    const results = {
      ...formData,
      total_cat1,
      total_cat2,
      total_cat3,
      grand_total,
    };

    localStorage.setItem('last_calc', JSON.stringify(results));
    navigate('/result');
  };

  const stepLabels = ['Dimensions', 'Cat I & II', 'Research Papers', 'Review'];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">API Score Calculator</h1>
        <p className="text-gray-600">
          Fill in the details to calculate your academic performance indicator.
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center mb-8 bg-white p-4 rounded-lg shadow-sm overflow-x-auto">
        {[1, 2, 3, 4].map((num) => (
          <div key={num} className="flex items-center flex-1 last:flex-none min-w-0">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-colors shrink-0 ${
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
              className={`px-2 text-sm font-medium truncate ${
                step === num ? 'text-blue-700' : 'text-gray-500'
              }`}
            >
              {stepLabels[num - 1]}
            </div>
            {num < TOTAL_STEPS && (
              <div className="flex-1 h-px bg-gray-200 mx-2 shrink-0 min-w-[12px]"></div>
            )}
          </div>
        ))}
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
                  Teaching Workload (Max 100)
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
                Category I score is calculated based on hours per week and actual classes engaged.
                Max score caps at 100 even if you earn more.
              </p>
            </div>
          </div>
        )}

        {/* ── Step 3: Research Papers (Cat III) ── */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold border-b pb-2">
              Research Papers · Category III
            </h2>
            <ResearchPapers
              discipline={formData.discipline}
              onChange={(papers) =>
                setFormData((prev) => ({ ...prev, research_papers: papers }))
              }
            />
          </div>
        )}

        {/* ── Step 4: Review summary ── */}
        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold border-b pb-2">Review & Submit</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <p className="text-xs text-blue-600 font-medium mb-1">Category I</p>
                <p className="text-3xl font-black text-blue-700">
                  {Math.min(
                    Number(formData.cat1_teaching) + Number(formData.cat1_admin),
                    100
                  )}
                </p>
                <p className="text-xs text-blue-500 mt-1">/ 100 pts</p>
              </div>
              <div className="bg-indigo-50 rounded-xl p-4 text-center">
                <p className="text-xs text-indigo-600 font-medium mb-1">Category II</p>
                <p className="text-3xl font-black text-indigo-700">
                  {Math.min(Number(formData.cat2_co_curricular), 20)}
                </p>
                <p className="text-xs text-indigo-500 mt-1">/ 20 pts</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-4 text-center">
                <p className="text-xs text-emerald-600 font-medium mb-1">Category III (Papers)</p>
                <p className="text-3xl font-black text-emerald-700">
                  {Math.min(
                    formData.research_papers.reduce((s, p) => s + (p.score || 0), 0),
                    75
                  ).toFixed(2)}
                </p>
                <p className="text-xs text-emerald-500 mt-1">/ 75 pts</p>
              </div>
            </div>
            <div className="bg-gray-900 text-white rounded-xl p-5 text-center">
              <p className="text-sm opacity-70 mb-1">Estimated Grand Total</p>
              <p className="text-5xl font-black">
                {(
                  Math.min(
                    Number(formData.cat1_teaching) + Number(formData.cat1_admin),
                    100
                  ) +
                  Math.min(Number(formData.cat2_co_curricular), 20) +
                  Math.min(
                    formData.research_papers.reduce((s, p) => s + (p.score || 0), 0),
                    75
                  )
                ).toFixed(2)}
              </p>
              <p className="text-sm opacity-50 mt-1">
                {formData.designation} · UGC {formData.regulation} · {formData.discipline}
              </p>
            </div>
            <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 flex items-start gap-3">
              <Info size={16} className="text-yellow-600 mt-0.5 shrink-0" />
              <p className="text-xs text-yellow-700">
                Books, PhD guidance, projects, patents, and other Cat III items will be added in
                the next update. Current score reflects research papers only for Cat III.
              </p>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
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
              className="flex items-center px-8 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium"
            >
              <Save size={20} className="mr-2" /> Calculate & Save
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default Calculator;