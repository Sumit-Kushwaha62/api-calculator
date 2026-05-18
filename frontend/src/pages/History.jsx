import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, FileText, ChevronRight, Search, Download } from 'lucide-react';

const History = () => {
  const navigate = useNavigate();

  // Mock data for history
  const historyData = [
    { id: 1, date: '2026-05-10', regulation: '2018', score: 145, purpose: 'CAS Promotion' },
    { id: 2, date: '2026-03-22', regulation: '2018', score: 120, purpose: 'Recruitment' },
    { id: 3, date: '2025-12-15', regulation: '2010', score: 95, purpose: 'PBAS' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Calculation History</h1>
          <p className="text-gray-600">Access and manage your previous API score records.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" placeholder="Search by purpose..." className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 w-full md:w-64" />
        </div>
      </div>

      <div className="card overflow-hidden !p-0">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Regulation</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Purpose</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">API Score</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {historyData.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors cursor-pointer group" onClick={() => navigate('/result')}>
                <td className="px-6 py-4">
                  <div className="flex items-center text-sm text-gray-900">
                    <Calendar className="mr-2 text-gray-400" size={16} />
                    {new Date(item.date).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    UGC {item.regulation}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{item.purpose}</td>
                <td className="px-6 py-4 text-center">
                  <span className="font-bold text-gray-900">{item.score}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end space-x-3">
                    <button className="p-2 text-gray-400 hover:text-primary transition-colors">
                      <Download size={18} />
                    </button>
                    <ChevronRight className="text-gray-300 group-hover:text-primary group-hover:translate-x-1 transition-all" size={20} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {historyData.length === 0 && (
          <div className="py-20 text-center">
            <FileText className="mx-auto text-gray-300 mb-4" size={48} />
            <p className="text-gray-500">No calculation history found.</p>
            <button onClick={() => navigate('/calculator')} className="mt-4 text-primary font-medium hover:underline">
              Start your first calculation
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
