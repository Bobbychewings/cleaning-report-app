import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import LocationManager from '../../components/admin/LocationManager';
import FormBuilder from '../../components/admin/FormBuilder';
import UserManagement from '../../components/UserManagement';
import ReportsManager from '../../components/admin/reports/ReportsManager';
import Settings from '../../components/admin/Settings';
import { LogOut, Map, ClipboardList, Users, FileBarChart, Settings as SettingsIcon } from 'lucide-react';

export default function AdminDashboard() {
  const { signOut, currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('locations');

  const tabs = [
    { id: 'locations', label: 'Locations', icon: Map },
    { id: 'forms', label: 'Form Builder', icon: ClipboardList },
    { id: 'reports', label: 'Audit Reports', icon: FileBarChart },
    { id: 'users', label: 'Staff Management', icon: Users },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 bg-white shadow-md flex-shrink-0">
        <div className="h-full flex flex-col">
          <div className="px-6 py-8 border-b border-gray-100 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-primary-600">Admin Panel</h1>
          </div>

          <div className="p-4 flex-1">
            <ul className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <li key={tab.id}>
                    <button
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon size={20} className={activeTab === tab.id ? 'text-primary-600' : 'text-gray-400'} />
                      {tab.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center gap-3 px-4 py-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold uppercase">
                {currentUser?.email?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {currentUser?.displayName || 'Admin User'}
                </p>
                <p className="text-xs text-gray-500 truncate">{currentUser?.email}</p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">
        <div className="p-8 max-w-7xl mx-auto">
          <header className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              {tabs.find(t => t.id === activeTab)?.label}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Manage your event spaces, build custom inspection forms, and coordinate your staff.
            </p>
          </header>

          <main>
            {activeTab === 'locations' && <LocationManager />}
            {activeTab === 'forms' && <FormBuilder />}
            {activeTab === 'reports' && <ReportsManager />}
            {activeTab === 'users' && <UserManagement />}
            {activeTab === 'settings' && <Settings />}
          </main>
        </div>
      </div>
    </div>
  );
}
