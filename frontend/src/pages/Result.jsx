import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, ArrowLeft, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const MINIMUMS = {
  'Assistant Professor (Stage 1)': { cat1: 75, cat2: 15, cat3: 10 },
  'Assistant Professor (Stage 2)': { cat1: 75, cat2: 15, cat3: 20 },
  'Assistant Professor (Stage 3)': { cat1: 75, cat2: 15, cat3: 30 },
  'Associate Professor':           { cat1: 75, cat2: 15, cat3: 40 },
  'Professor':                     { cat1: 75, cat2: 15, cat3: 50 },
};

const Result = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState(null);

  useEffect(() => {
    try {
      const data = localStorage.getItem('last_calc');
      if (data) {
        setResults(JSON.parse(data));
      } else {
        navigate('/calculator');
      }
    } catch {
      navigate('/calculator');
    }
  }, [navigate]);

  if (!results) return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-500">Loading results...</p>
    </div>
  );

  // ── Pull scores ──────────────────────────────────────────────
  const total_cat1 = Number(results.total_cat1 ?? 0);
  const total_cat2 = Number(results.total_cat2 ?? 0);
  const total_cat3 = Number(results.total_cat3 ?? 0);
  const grand_total = Number(results.grand_total ?? 0);
  const designation = results.designation ?? 'Assistant Professor (Stage 1)';
  const regulation = results.regulation ?? '2018';
  const purpose = results.purpose ?? 'CAS Promotion';

  // Cat III sub-breakdown
  const b = results.breakdown?.cat3 ?? results.cat3_breakdown ?? {};
  const papersTotal      = Number(b.research_papers?.total ?? 0);
  const booksTotal       = Number(b.books?.total ?? 0);
  const phdTotal         = Number(b.phd_projects?.total ?? 0);
  const patentsTotal     = Number(b.patents_awards?.patentsTotal ?? 0) + Number(b.patents_awards?.awardsTotal ?? 0);
  const policyDocTotal   = Number(b.patents_awards?.policyDocTotal ?? 0);
  const lecturesTotal    = Number(b.lectures?.total ?? 0);
  const capApplied       = b.cap_applied ?? false;
  const capExcess        = Number(b.cap_excess ?? b.excess ?? 0);

  // ── Gap analysis ─────────────────────────────────────────────
  const mins = MINIMUMS[designation] ?? {};
  const gaps = [];
  if (total_cat1 < (mins.cat1 || 0))
    gaps.push({ label: 'Category I', need: mins.cat1 - total_cat1, min: mins.cat1 });
  if (total_cat2 < (mins.cat2 || 0))
    gaps.push({ label: 'Category II', need: mins.cat2 - total_cat2, min: mins.cat2 });
  if (total_cat3 < (mins.cat3 || 0))
    gaps.push({ label: 'Category III', need: +(mins.cat3 - total_cat3).toFixed(2), min: mins.cat3 });
  const eligible = gaps.length === 0;

  // ── PDF Export ───────────────────────────────────────────────
  const exportPDF = () => {
    const doc = new jsPDF();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    doc.setFontSize(18);
    doc.text('Academic API Score Report', 105, 18, { align: 'center' });

    doc.setFontSize(11);
    doc.text(`Name: ${user?.name ?? 'N/A'}`, 14, 32);
    doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 14, 39);
    doc.text(`Designation: ${designation}`, 14, 46);
    doc.text(`Regulation: UGC ${regulation}`, 14, 53);
    doc.text(`Purpose: ${purpose}`, 14, 60);

    autoTable(doc, {
      startY: 68,
      head: [['Category', 'Description', 'Score', 'Min Required']],
      body: [
        ['Category I', 'Teaching & Administration', total_cat1.toFixed(2), mins.cat1 ?? '-'],
        ['Category II', 'Co-curricular & Professional Dev.', total_cat2.toFixed(2), mins.cat2 ?? '-'],
        ['Category III', 'Research & Academic Contributions', total_cat3.toFixed(2), mins.cat3 ?? '-'],
        ['Grand Total', '', grand_total.toFixed(2), ''],
      ],
      styles: { fontSize: 10 },
    });

    const finalY = doc.lastAutoTable.finalY + 10;

    // Cat III breakdown
    autoTable(doc, {
      startY: finalY,
      head: [['Cat III Section', 'Score']],
      body: [
        ['Research Papers', papersTotal.toFixed(2)],
        ['Books & Translation', booksTotal.toFixed(2)],
        ['PhD & Projects', phdTotal.toFixed(2)],
        ['Patents & Awards', patentsTotal.toFixed(2)],
        ['Policy Documents', policyDocTotal.toFixed(2)],
        ['Invited Lectures', lecturesTotal.toFixed(2)],
        ...(capApplied ? [['30% Cap Deduction', `-${capExcess}`]] : []),
        ['Cat III Total', total_cat3.toFixed(2)],
      ],
      styles: { fontSize: 9 },
    });

    doc.save(`API_Report_${Date.now()}.pdf`);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => navigate('/calculator')}
          className="flex items-center text-gray-600 hover:text-blue-700 transition-colors"
        >
          <ArrowLeft size={20} className="mr-2" /> Back to Calculator
        </button>
        <button
          onClick={exportPDF}
          className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
        >
          <Download size={18} className="mr-2" /> Export PDF
        </button>
      </div>

      {/* Top cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-xl p-5 text-center border border-blue-100">
          <p className="text-xs text-blue-600 font-medium mb-1">Grand Total</p>
          <p className="text-4xl font-black text-blue-800">{grand_total.toFixed(2)}</p>
          <p className="text-xs text-blue-400 mt-1">UGC {regulation} · {designation}</p>
        </div>

        <div className={`md:col-span-2 rounded-xl p-5 border flex items-center gap-4 ${
          eligible
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
        }`}>
          {eligible
            ? <CheckCircle2 className="text-green-600 shrink-0" size={32} />
            : <XCircle className="text-red-500 shrink-0" size={32} />
          }
          <div>
            <h3 className={`font-bold text-lg ${eligible ? 'text-green-800' : 'text-red-800'}`}>
              {eligible ? '✅ Eligible' : '❌ Not Yet Eligible'}
            </h3>
            <p className={`text-sm ${eligible ? 'text-green-700' : 'text-red-700'}`}>
              {eligible
                ? `You meet all minimum requirements for ${purpose} as ${designation}.`
                : `You do not meet minimum requirements for ${purpose}. See gap analysis below.`
              }
            </p>
          </div>
        </div>
      </div>

      {/* Score bars */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <h2 className="text-lg font-bold mb-5">Score Breakdown</h2>
        <div className="space-y-5">
          {[
            { label: 'Category I: Teaching & Evaluation', score: total_cat1, max: 100, min: mins.cat1, color: 'bg-blue-600' },
            { label: 'Category II: Co-curricular & Professional Dev.', score: total_cat2, max: 20, min: mins.cat2, color: 'bg-indigo-600' },
            { label: 'Category III: Research & Academic Contributions', score: total_cat3, max: 100, min: mins.cat3, color: 'bg-emerald-600' },
          ].map(({ label, score, max, min, color }) => (
            <div key={label}>
              <div className="flex justify-between items-end mb-1">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{label}</p>
                  {min && score < min && (
                    <p className="text-xs text-red-500">⚠ Min {min} required</p>
                  )}
                </div>
                <span className="text-sm font-bold text-gray-700">{score.toFixed(2)}</span>
              </div>
              <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`${color} h-full rounded-full transition-all`}
                  style={{ width: `${Math.min((score / max) * 100, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cat III breakdown */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <h2 className="text-lg font-bold mb-4">Category III Detail</h2>
        <div className="space-y-2">
          {[
            { label: 'Research Papers', val: papersTotal },
            { label: 'Books & Translation', val: booksTotal },
            { label: 'PhD & Projects', val: phdTotal },
            { label: 'Patents & Awards', val: patentsTotal },
            { label: 'Policy Documents', val: policyDocTotal },
            { label: 'Invited Lectures', val: lecturesTotal },
          ].map(({ label, val }) => (
            <div key={label} className="flex justify-between text-sm py-1 border-b last:border-0">
              <span className="text-gray-600">{label}</span>
              <span className="font-semibold text-gray-800">{val.toFixed(2)} pts</span>
            </div>
          ))}
          {capApplied && (
            <div className="flex justify-between text-sm py-1 text-red-600 font-semibold">
              <span>30% Cap Deduction (Policy Docs + Lectures)</span>
              <span>- {capExcess} pts</span>
            </div>
          )}
          <div className="flex justify-between text-sm pt-2 font-bold text-emerald-700">
            <span>Cat III Total</span>
            <span>{total_cat3.toFixed(2)} pts</span>
          </div>
        </div>
      </div>

      {/* Gap analysis */}
      <div className={`rounded-xl border-l-4 p-6 ${
        eligible
          ? 'bg-green-50 border-green-500'
          : 'bg-yellow-50 border-yellow-500'
      }`}>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <AlertCircle size={20} className={eligible ? 'text-green-600' : 'text-yellow-600'} />
          Gap Analysis
        </h2>
        {eligible ? (
          <p className="text-green-700 text-sm">
            All category minimums met for <strong>{designation}</strong>. You are eligible for <strong>{purpose}</strong>.
          </p>
        ) : (
          <ul className="space-y-2">
            {gaps.map((g) => (
              <li key={g.label} className="text-sm text-gray-700">
                • <strong>{g.label}</strong>: need <span className="text-red-600 font-bold">{g.need} more pts</span> (min required: {g.min})
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Result;