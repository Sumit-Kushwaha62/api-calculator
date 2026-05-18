import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Calculator, History, LogOut, User } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const getUser = () => {
    try {
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (e) {
      return null;
    }
  };

  const user = getUser();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Calculator', path: '/calculator', icon: Calculator },
    { label: 'History', path: '/history', icon: History },
  ];

  const isActive = (path) => location.pathname === path;

  if (location.pathname === '/login' || location.pathname === '/register') return null;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <div className="bg-primary p-1.5 rounded-lg mr-2">
                <Calculator className="text-white" size={24} />
              </div>
              <span className="font-bold text-xl text-gray-900 hidden md:block">Academic API</span>
            </Link>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive(item.path)
                      ? 'bg-blue-50 text-primary'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className="mr-2" size={18} />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center text-sm text-gray-700 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
              <User size={16} className="mr-2 text-primary" />
              <span className="font-medium">{user?.name}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
