import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, History, BookOpen, Calculator as CalcIcon, ChevronRight, TrendingUp, Loader2 } from 'lucide-react';
import { calculateAPI } from '../services/api';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [recentCalcs, setRecentCalcs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData && userData !== 'undefined') {
      try { setUser(JSON.parse(userData)); } catch {}
    }

    calculateAPI.getHistory()
      .then((res) => setRecentCalcs(res.data.calculations?.slice(0, 3) || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Best score from history
  const bestScore = recentCalcs.length
    ? Math.max(...recentCalcs.map((c) => Number(c.score_total)))
    : null;

  const totalCalcs = recentCalcs.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome, {user?.name || 'Academic'}!
        </h1>
        <p className="text-gray-600">
          Track and calculate your Academic Performance Indicator (API) scores.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="card flex items-center space-x-4">
          <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
            <BookOpen size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Calculations</p>
            <p className="text-xl font-bold text-gray-900">
              {loading ? '—' : totalCalcs}
            </p>
          </div>
        </div>
        <div className="card flex items-center space-x-4">
          <div className="p-3 rounded-lg bg-emerald-100 text-emerald-600">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Best Score</p>
            <p className="text-xl font-bold text-gray-900">
              {loading ? '—' : bestScore !== null ? bestScore.toFixed(2) : 'N/A'}
            </p>
          </div>
        </div>
        <div className="card flex items-center space-x-4">
          <div className="p-3 rounded-lg bg-indigo-100 text-indigo-600">
            <CalcIcon size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Regulation</p>
            <p className="text-xl font-bold text-gray-900">UGC 2018</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick actions */}
        <div className="card space-y-6">
          <h2 className="text-xl font-semibold flex items-center">
            <PlusCircle className="mr-2 text-primary" /> Quick Actions
          </h2>
          <div className="space-y-4">
            <Link
              to="/calculator"
              className="flex items-center justify-between p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors group"
            >
              <div className="flex items-center">
                <div className="bg-primary p-2 rounded text-white mr-4">
                  <CalcIcon size={20} />
                </div>
                <div>
                  <p className="font-medium text-gray-900">New Calculation</p>
                  <p className="text-xs text-gray-500">Calculate API score for CAS or Recruitment</p>
                </div>
              </div>
              <ChevronRight className="text-gray-400 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/history"
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
            >
              <div className="flex items-center">
                <div className="bg-gray-700 p-2 rounded text-white mr-4">
                  <History size={20} />
                </div>
                <div>
                  <p className="font-medium text-gray-900">View History</p>
                  <p className="text-xs text-gray-500">Access your previous API score reports</p>
                </div>
              </div>
              <ChevronRight className="text-gray-400 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Recent calculations */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <History size={20} className="text-gray-500" /> Recent Calculations
          </h2>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-blue-500" size={24} />
            </div>
          ) : recentCalcs.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <CalcIcon size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No calculations yet.</p>
              <Link to="/calculator" className="text-blue-600 text-sm hover:underline mt-1 inline-block">
                Start your first calculation →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentCalcs.map((calc) => {
                const b = calc.score_breakdown || {};
                const date = new Date(calc.created_at).toLocaleDateString('en-IN', {
                  day: '2-digit', month: 'short', year: 'numeric',
                });
                return (
                  <div
                    key={calc.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {calc.calc_type}
                      </p>
                      <p className="text-xs text-gray-400">{date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-blue-700">
                        {Number(calc.score_total).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-400">grand total</p>
                    </div>
                  </div>
                );
              })}
              {recentCalcs.length > 0 && (
                <Link
                  to="/history"
                  className="block text-center text-xs text-blue-600 hover:underline pt-1"
                >
                  View all →
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Regulation note */}
      <div className="mt-8 p-4 bg-yellow-50 text-yellow-800 text-xs rounded-lg border border-yellow-200">
        <strong>Note:</strong> Ensure you select the correct regulation year for accurate scoring.
        Current supported: UGC 2018. State PSC variations coming soon.
      </div>
    </div>
  );
};

export default Dashboard;