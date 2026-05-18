import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Share2, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const Result = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState(null);

  useEffect(() => {
    const data = localStorage.getItem('last_calc');
    if (data) {
      setResults(JSON.parse(data));
    } else {
      navigate('/calculator');
    }
  }, [navigate]);

  const exportPDF = () => {
    const doc = new jsPDF();
    const user = JSON.parse(localStorage.getItem('user'));
    
    doc.setFontSize(20);
    doc.text('Academic API Score Report', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Name: ${user?.name}`, 14, 35);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 42);
    doc.text(`Regulation: UGC ${results.regulation}`, 14, 49);
    
    const tableData = [
      ['Category I', 'Teaching & Admin', results.total_cat1, '100'],
      ['Category II', 'Co-curricular', results.total_cat2, '20'],
      ['Category III', 'Research', results.total_cat3, '75'],
      ['Total Score', '', results.grand_total, '195']
    ];
    
    doc.autoTable({
      startY: 60,
      head: [['Category', 'Description', 'Obtained Score', 'Max Limit']],
      body: tableData,
    });
    
    doc.save(`API_Report_${new Date().getTime()}.pdf`);
  };

  if (!results) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => navigate('/calculator')} className="flex items-center text-gray-600 hover:text-primary transition-colors">
          <ArrowLeft size={20} className="mr-2" /> Back to Editor
        </button>
        <div className="flex space-x-3">
          <button onClick={exportPDF} className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium">
            <Download size={18} className="mr-2" /> Export PDF
          </button>
          <button className="btn-primary flex items-center">
            <Share2 size={18} className="mr-2" /> Share Results
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card text-center bg-blue-50 border-blue-100">
          <p className="text-sm text-blue-600 font-medium mb-1">Total API Score</p>
          <h2 className="text-4xl font-black text-[#1E4D9A]">{results.grand_total}</h2>
          <p className="text-xs text-blue-500 mt-2">Verified Calculation</p>
        </div>
        <div className="md:col-span-2 card bg-green-50 border-green-100 flex items-center">
          <CheckCircle2 className="text-green-600 mr-4" size={32} />
          <div>
            <h3 className="text-lg font-bold text-green-800">Eligibility Status</h3>
            <p className="text-sm text-green-700">Based on your score of {results.grand_total}, you meet the minimum requirements for {results.designation} under UGC {results.regulation} regulations.</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="card">
          <h2 className="text-xl font-bold mb-6">Detailed Breakdown</h2>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-end mb-2">
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">Category I: Teaching, Learning and Evaluation</h4>
                  <p className="text-xs text-gray-500">Includes direct teaching and administrative duties</p>
                </div>
                <span className="font-bold text-primary">{results.total_cat1} / 100</span>
              </div>
              <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-primary h-full rounded-full" style={{ width: `${results.total_cat1}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-end mb-2">
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">Category II: Co-curricular & Professional Development</h4>
                  <p className="text-xs text-gray-500">Seminars, workshops, and college-level committees</p>
                </div>
                <span className="font-bold text-indigo-600">{results.total_cat2} / 20</span>
              </div>
              <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${(results.total_cat2/20)*100}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-end mb-2">
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">Category III: Research & Academic Contributions</h4>
                  <p className="text-xs text-gray-500">Publications, research projects, and PhD guidance</p>
                </div>
                <span className="font-bold text-emerald-600">{results.total_cat3} / 75</span>
              </div>
              <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${(results.total_cat3/75)*100}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="card border-l-4 border-yellow-500">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <AlertCircle className="text-yellow-500 mr-2" /> Gap Analysis
          </h2>
          <p className="text-sm text-gray-600 mb-4">To reach the next stage (Professor), you need:</p>
          <ul className="list-disc list-inside text-sm space-y-2 text-gray-700">
            <li>Increase Research Publication score by <span className="font-bold">25 points</span></li>
            <li>Complete at least <span className="font-bold">1 major research project</span></li>
            <li>Successfully guide <span className="font-bold">2 Ph.D. scholars</span> to completion</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Result;
