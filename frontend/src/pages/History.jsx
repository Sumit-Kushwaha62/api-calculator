import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { calculateAPI } from '../services/api';
import { Clock, TrendingUp, FileText, Loader2 } from 'lucide-react';

const History = () => {
  const [calculations, setCalculations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await calculateAPI.getHistory();
        setCalculations(res.data.calculations || []);
      } catch (err) {
        setError('Failed to load history. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Calculation History</h1>
          <p className="text-gray-600">Your past API score calculations</p>
        </div>
        <Link to="/calculator" className="btn-primary flex items-center gap-2">
          <TrendingUp size={18} /> New Calculation
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-6">
          {error}
        </div>
      )}

      {calculations.length === 0 && !error ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm border">
          <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">No calculations yet</p>
          <p className="text-gray-400 text-sm mt-1">Start your first API score calculation</p>
          <Link to="/calculator" className="btn-primary inline-flex items-center gap-2 mt-4">
            Calculate Now
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {calculations.map((calc) => {
            const breakdown = calc.score_breakdown || {};
            const cat1 = breakdown.cat1?.total ?? 0;
            const cat2 = breakdown.cat2?.total ?? 0;
            const cat3 = breakdown.cat3?.total ?? 0;
            const date = new Date(calc.created_at).toLocaleDateString('en-IN', {
              day: '2-digit', month: 'short', year: 'numeric',
            });

            return (
              <div
                key={calc.id}
                className="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded mb-2">
                      {calc.calc_type}
                    </span>
                    <div className="flex items-center gap-1 text-gray-400 text-xs mt-1">
                      <Clock size={12} />
                      {date}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black text-gray-900">
                      {Number(calc.score_total).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-400">Grand Total</p>
                  </div>
                </div>

                {/* Category breakdown */}
                <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t">
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Cat I</p>
                    <p className="font-bold text-blue-700">{Number(cat1).toFixed(0)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Cat II</p>
                    <p className="font-bold text-indigo-700">{Number(cat2).toFixed(0)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Cat III</p>
                    <p className="font-bold text-emerald-700">{Number(cat3).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default History;