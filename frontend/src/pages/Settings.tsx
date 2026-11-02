import { User, Mail, ShieldCheck, Database, Server, LogOut } from 'lucide-react';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0B0F19]">
      <Header title="Account Settings" subtitle="User profile and backend system configuration" />

      <div className="flex-1 p-8 overflow-y-auto max-w-4xl space-y-6">
        {/* Profile Card */}
        <div className="p-6 rounded-2xl bg-[#111827] border border-[#1E293B] shadow-xl space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
              <User className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">{user?.name || 'User'}</h3>
              <p className="text-xs text-gray-400 mt-0.5">{user?.email || 'user@example.com'}</p>
              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Active Session</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-[#1E293B] text-xs">
            <div className="p-4 rounded-xl bg-[#1A2234] border border-[#2D3748] flex items-center gap-3">
              <Mail className="w-5 h-5 text-blue-400 shrink-0" />
              <div>
                <p className="text-gray-400 font-semibold uppercase text-[10px]">Email Address</p>
                <p className="text-gray-100 font-medium mt-0.5">{user?.email || 'N/A'}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#1A2234] border border-[#2D3748] flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0" />
              <div>
                <p className="text-gray-400 font-semibold uppercase text-[10px]">Security Protocol</p>
                <p className="text-gray-100 font-medium mt-0.5">BCrypt Salted Password Hash</p>
              </div>
            </div>
          </div>
        </div>

        {/* System & Architecture Info */}
        <div className="p-6 rounded-2xl bg-[#111827] border border-[#1E293B] shadow-xl space-y-4">
          <h4 className="text-base font-bold text-white tracking-tight">System & Architecture</h4>
          <p className="text-xs text-gray-400">
            Expenzo 2.0 dual architecture running lightweight Java backend with MySQL 8.0 storage.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-2">
            <div className="p-3.5 rounded-xl bg-[#1A2234] border border-[#2D3748] flex items-center gap-2.5">
              <Server className="w-4 h-4 text-emerald-400" />
              <div>
                <p className="text-[10px] text-gray-400 font-semibold uppercase">Backend API</p>
                <p className="text-gray-200 font-medium">Java 17 HttpServer</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#1A2234] border border-[#2D3748] flex items-center gap-2.5">
              <Database className="w-4 h-4 text-blue-400" />
              <div>
                <p className="text-[10px] text-gray-400 font-semibold uppercase">Database</p>
                <p className="text-gray-200 font-medium">MySQL 8.0 (JDBC)</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#1A2234] border border-[#2D3748] flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <div>
                <p className="text-[10px] text-gray-400 font-semibold uppercase">Frontend</p>
                <p className="text-gray-200 font-medium">React + Vite + TS</p>
              </div>
            </div>
          </div>
        </div>

        {/* Logout Section */}
        <div className="p-6 rounded-2xl bg-[#111827] border border-[#1E293B] shadow-xl flex items-center justify-between">
          <div>
            <h4 className="text-base font-bold text-white tracking-tight">Sign Out</h4>
            <p className="text-xs text-gray-400 mt-0.5">End your current session and return to login</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
