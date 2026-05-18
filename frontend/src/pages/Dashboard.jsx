import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, History, BookOpen, Calculator as CalcIcon, ChevronRight } from 'lucide-react';

const Dashboard = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const stats = [
    { label: 'Category I', value: '100 Max', icon: BookOpen, color: 'blue' },
    { label: 'Category II', value: '20 Max', icon: PlusCircle, color: 'indigo' },
    { label: 'Category III', value: '75 Max', icon: CalcIcon, color: 'emerald' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome, {user?.name || 'Academic'}!</h1>
        <p className="text-gray-600">Track and calculate your Academic Performance Indicator (API) scores.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {stats.map((stat, i) => (
          <div key={i} className="card flex items-center space-x-4">
            <div className={`p-3 rounded-lg bg-${stat.color}-100 text-${stat.color}-600`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className="text-xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card space-y-6">
          <h2 className="text-xl font-semibold flex items-center">
            <PlusCircle className="mr-2 text-primary" /> Quick Actions
          </h2>
          <div className="space-y-4">
            <Link to="/calculator" className="flex items-center justify-between p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors group">
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
            
            <Link to="/history" className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group">
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

        <div className="card">
          <h2 className="text-xl font-semibold mb-6">Regulation Guidelines</h2>
          <div className="space-y-4">
            <div className="border-l-4 border-primary pl-4 py-1">
              <p className="font-medium text-gray-900 text-sm">UGC Regulations 2018</p>
              <p className="text-xs text-gray-500">Latest scoring criteria for CAS and Direct Recruitment.</p>
            </div>
            <div className="border-l-4 border-gray-300 pl-4 py-1">
              <p className="font-medium text-gray-900 text-sm">State PSC Rules</p>
              <p className="text-xs text-gray-500">Specific variations for JPSC, BPSC, UPPSC, etc.</p>
            </div>
            <div className="mt-6 p-4 bg-yellow-50 text-yellow-800 text-xs rounded-lg">
              <strong>Note:</strong> Ensure you select the correct regulation year for accurate scoring.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
