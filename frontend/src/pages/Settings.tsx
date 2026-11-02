import { useState } from 'react';
import {
  User,
  Mail,
  ShieldCheck,
  Database,
  Server,
  LogOut,
  Hash,
  Layers,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';
import Header from '../components/Header';
import ConfirmDialog from '../components/ConfirmDialog';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const { user, logout } = useAuth();
  const { showSuccess } = useToast();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      showSuccess('Signed out successfully');
      navigate('/login');
    } finally {
      setLoggingOut(false);
      setShowLogoutConfirm(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0B0F19]">
      <Header
        title="Account Settings"
        subtitle="Manage your profile information and view system parameters"
      />

      <div className="flex-1 p-4 sm:p-8 overflow-y-auto max-w-4xl space-y-6">
        {/* 1. User Profile Information Card */}
        <div className="p-6 rounded-2xl bg-[#111827] border border-[#1E293B] shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 shrink-0">
                <User className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">{user?.name || 'User'}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{user?.email || 'user@example.com'}</p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Authenticated Session Active</span>
                </div>
              </div>
            </div>

            <span className="self-start sm:self-auto text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-md bg-[#1A2234] border border-[#2D3748] text-gray-400">
              Verified User Profile
            </span>
          </div>

          {/* Profile Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-[#1E293B] text-xs">
            <div className="p-4 rounded-xl bg-[#1A2234] border border-[#2D3748] flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-blue-400 shrink-0" />
                <div>
                  <p className="text-gray-400 font-semibold uppercase text-[10px]">Email Address</p>
                  <p className="text-gray-100 font-medium mt-0.5">{user?.email || 'N/A'}</p>
                </div>
              </div>
              <span className="text-[10px] text-gray-500 font-mono">Read-Only</span>
            </div>

            <div className="p-4 rounded-xl bg-[#1A2234] border border-[#2D3748] flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Hash className="w-5 h-5 text-indigo-400 shrink-0" />
                <div>
                  <p className="text-gray-400 font-semibold uppercase text-[10px]">User Account ID</p>
                  <p className="text-gray-100 font-mono font-medium mt-0.5">#{user?.userId || '1'}</p>
                </div>
              </div>
              <span className="text-[10px] text-gray-500 font-mono">Unique Key</span>
            </div>

            <div className="p-4 rounded-xl bg-[#1A2234] border border-[#2D3748] flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <KeyRound className="w-5 h-5 text-purple-400 shrink-0" />
                <div>
                  <p className="text-gray-400 font-semibold uppercase text-[10px]">Credential Security</p>
                  <p className="text-gray-100 font-medium mt-0.5">BCrypt Salted Hash ($2a$12$)</p>
                </div>
              </div>
              <span className="text-[10px] text-emerald-400 font-medium">Secured</span>
            </div>

            <div className="p-4 rounded-xl bg-[#1A2234] border border-[#2D3748] flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-gray-400 font-semibold uppercase text-[10px]">Session Token</p>
                  <p className="text-gray-100 font-medium mt-0.5">In-Memory UUID Bearer Token</p>
                </div>
              </div>
              <span className="text-[10px] text-emerald-400 font-medium">Active</span>
            </div>
          </div>
        </div>

        {/* 2. System & Architecture Overview */}
        <div className="p-6 rounded-2xl bg-[#111827] border border-[#1E293B] shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-base font-bold text-white tracking-tight">System & Architecture</h4>
              <p className="text-xs text-gray-400 mt-0.5">
                Expenzo dual architecture: Lightweight Java REST backend paired with React frontend
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>All Services Operational</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs pt-2">
            <div className="p-4 rounded-xl bg-[#1A2234] border border-[#2D3748] flex items-start gap-3">
              <Server className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] text-gray-400 font-semibold uppercase">Backend API</p>
                <p className="text-gray-100 font-medium mt-0.5">Java 17 HttpServer</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Port 8080 • Thread Pool</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#1A2234] border border-[#2D3748] flex items-start gap-3">
              <Database className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] text-gray-400 font-semibold uppercase">Database Storage</p>
                <p className="text-gray-100 font-medium mt-0.5">MySQL 8.0 (JDBC)</p>
                <p className="text-[11px] text-gray-500 mt-0.5">schema: expense_tracker</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#1A2234] border border-[#2D3748] flex items-start gap-3">
              <Layers className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] text-gray-400 font-semibold uppercase">Frontend Client</p>
                <p className="text-gray-100 font-medium mt-0.5">React 18 + Vite + TS</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Tailwind CSS • Recharts</p>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Account Actions / Sign Out Section */}
        <div className="p-6 rounded-2xl bg-[#111827] border border-[#1E293B] shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-base font-bold text-white tracking-tight">Sign Out</h4>
            <p className="text-xs text-gray-400 mt-0.5">
              Revoke your authenticated session token and return to the login screen
            </p>
          </div>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Logout Confirmation In-App Dialog */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        title="Sign Out Confirmation"
        message="Are you sure you want to end your current session and sign out of Expenzo? You will need to log in again to access your dashboard."
        confirmText="Sign Out"
        cancelText="Stay Signed In"
        variant="warning"
        loading={loggingOut}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </div>
  );
}
