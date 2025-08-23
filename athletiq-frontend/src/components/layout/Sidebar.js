import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import useUserStore from '@/store/userStore';
// I've added a few more icons that might be useful
import { FaTachometerAlt, FaUsers, FaSchool, FaTrophy, FaSignOutAlt } from 'react-icons/fa';

export default function Sidebar() {
  const { user, clearUser } = useUserStore();
  const navigate = useNavigate();

  // This list defines all possible navigation links for the application.
  const allLinks = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: <FaTachometerAlt />, roles: ['super_admin'] },
    { label: 'Dashboard', href: '/school/dashboard', icon: <FaTachometerAlt />, roles: ['school_admin'] },
    { label: 'Schools', href: '/admin/schools', icon: <FaSchool />, roles: ['super_admin'] },
    { label: 'Players', href: '/admin/players', icon: <FaUsers />, roles: ['super_admin', 'school_admin'] },
    { label: 'Tournaments', href: '/admin/tournaments', icon: <FaTrophy />, roles: ['super_admin', 'school_admin'] },
  ];

  // --- THIS IS THE FIX ---
  // We filter the links based on the user's role.
  // We use .toLowerCase() to make the check case-insensitive and robust.
  const visibleLinks = allLinks.filter(link => 
    user && link.roles.includes(user.role.toLowerCase())
  );

  const handleLogout = async () => {
    clearUser();
    navigate('/login');
  };

  return (
    <aside className="w-64 flex-shrink-0 bg-athletiq-navy text-white flex flex-col">
      <div className="h-16 flex items-center justify-center text-xl font-bold border-b border-gray-700">
        ATHLETIQ
      </div>
      <nav className="flex-grow px-4 py-6">
        <ul>
          {visibleLinks.map((link) => (
            <li key={link.href}>
              <NavLink
                to={link.href}
                end={link.href.endsWith('dashboard')} // Use 'end' for dashboard links
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2 my-1 rounded-md transition-colors ${
                    isActive ? 'bg-athletiq-green text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`
                }
              >
                <span className="text-lg">{link.icon}</span>
                <span>{link.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 px-4 py-2 text-center font-semibold bg-red-600 rounded-lg hover:bg-red-700"
        >
          <FaSignOutAlt />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}