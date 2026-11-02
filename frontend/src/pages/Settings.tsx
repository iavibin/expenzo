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
  FileText,
} from 'lucide-react';
import Header from '../components/Header';
import ConfirmDialog from '../components/ConfirmDialog';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate, Link } from 'react-router-dom';

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
    <div className="flex-1 flex flex-col min-h-0 bg-foundation-bg">
      <Header
        title="Account Settings"
        subtitle="Manage your profile information and view system parameters"
      />

      <div className="flex-1 p-4 sm:p-8 overflow-y-auto max-w-4xl space-y-6">
        {/* 1. User Profile Information Card */}
        <div className="p-5 sm:p-6 rounded-xl bg-foundation-surface border border-foundation-border shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-lg bg-brand-teal/15 border border-brand-teal/30 flex items-center justify-center text-brand-tealLight shrink-0">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">{user?.name || 'User'}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{user?.email || 'user@example.com'}</p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Authenticated Session Active</span>
                </div>
              </div>
            </div>

            <span className="self-start sm:self-auto text-[10px] uppercase tracking-wider font-semibold px-2 py-1 rounded bg-foundation-surfaceElevated border border-foundation-borderSubtle text-gray-400 font-mono">
              Profile
            </span>
          </div>

          {/* Profile Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-5 border-t border-foundation-border text-xs">
            <div className="p-3.5 rounded-lg bg-foundation-surfaceElevated border border-foundation-borderSubtle flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-brand-tealLight shrink-0" />
                <div>
                  <p className="text-gray-400 font-semibold uppercase text-[10px]">Email Address</p>
                  <p className="text-gray-200 font-medium mt-0.5">{user?.email || 'N/A'}</p>
                </div>
              </div>
              <span className="text-[10px] text-gray-500 font-mono">Read-Only</span>
            </div>

            <div className="p-3.5 rounded-lg bg-foundation-surfaceElevated border border-foundation-borderSubtle flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Hash className="w-4 h-4 text-sky-400 shrink-0" />
                <div>
                  <p className="text-gray-400 font-semibold uppercase text-[10px]">User Account ID</p>
                  <p className="text-gray-200 font-mono font-medium mt-0.5">#{user?.userId || '1'}</p>
                </div>
              </div>
              <span className="text-[10px] text-gray-500 font-mono">Unique Key</span>
            </div>

            <div className="p-3.5 rounded-lg bg-foundation-surfaceElevated border border-foundation-borderSubtle flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <KeyRound className="w-4 h-4 text-indigo-400 shrink-0" />
                <div>
                  <p className="text-gray-400 font-semibold uppercase text-[10px]">Credential Security</p>
                  <p className="text-gray-200 font-medium mt-0.5 font-mono">BCrypt Salted Hash ($2a$12$)</p>
                </div>
              </div>
              <span className="text-[10px] text-emerald-400 font-medium">Secured</span>
            </div>

            <div className="p-3.5 rounded-lg bg-foundation-surfaceElevated border border-foundation-borderSubtle flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-gray-400 font-semibold uppercase text-[10px]">Session Token</p>
                  <p className="text-gray-200 font-medium mt-0.5">In-Memory UUID Bearer</p>
                </div>
              </div>
              <span className="text-[10px] text-emerald-400 font-medium">Active</span>
            </div>
          </div>
        </div>

        {/* 2. System & Architecture Overview */}
        <div className="p-5 sm:p-6 rounded-xl bg-foundation-surface border border-foundation-border shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm sm:text-base font-bold text-white tracking-tight">System & Architecture</h4>
              <p className="text-xs text-gray-400 mt-0.5">
                Local-first architecture: Java REST backend paired with React frontend
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Operational</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2">
            <div className="p-3.5 rounded-lg bg-foundation-surfaceElevated border border-foundation-borderSubtle flex items-start gap-3">
              <Server className="w-4 h-4 text-brand-tealLight shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] text-gray-400 font-semibold uppercase">Backend API</p>
                <p className="text-gray-200 font-medium mt-0.5">Java 17 HttpServer</p>
                <p className="text-[11px] text-gray-500 mt-0.5 font-mono">Port 8080 • Thread Pool</p>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-foundation-surfaceElevated border border-foundation-borderSubtle flex items-start gap-3">
              <Database className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] text-gray-400 font-semibold uppercase">Database Storage</p>
                <p className="text-gray-200 font-medium mt-0.5">MySQL 8.0 (JDBC)</p>
                <p className="text-[11px] text-gray-500 mt-0.5 font-mono">expense_tracker</p>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-foundation-surfaceElevated border border-foundation-borderSubtle flex items-start gap-3">
              <Layers className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] text-gray-400 font-semibold uppercase">Frontend Client</p>
                <p className="text-gray-200 font-medium mt-0.5">React 18 + Vite + TS</p>
                <p className="text-[11px] text-gray-500 mt-0.5 font-mono">Tailwind • Recharts</p>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Legal and Product Documentation Links */}
        <div className="p-5 sm:p-6 rounded-xl bg-foundation-surface border border-foundation-border shadow-sm space-y-3">
          <div>
            <h4 className="text-sm sm:text-base font-bold text-white tracking-tight">Legal & Product Documentation</h4>
            <p className="text-xs text-gray-400 mt-0.5">
              Review terms of service, data storage policy, and application documentation
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <Link
              to="/terms"
              className="p-3 rounded-lg bg-foundation-surfaceElevated hover:bg-[#222e40] border border-foundation-borderSubtle flex items-center justify-between text-xs transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-brand-tealLight" />
                <span className="text-gray-200 font-medium">Terms of Service</span>
              </div>
              <span className="text-gray-500 text-[11px]">&rarr;</span>
            </Link>

            <Link
              to="/privacy"
              className="p-3 rounded-lg bg-foundation-surfaceElevated hover:bg-[#222e40] border border-foundation-borderSubtle flex items-center justify-between text-xs transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-brand-tealLight" />
                <span className="text-gray-200 font-medium">Privacy Policy</span>
              </div>
              <span className="text-gray-500 text-[11px]">&rarr;</span>
            </Link>
          </div>
        </div>

        {/* 4. Account Actions / Sign Out Section */}
        <div className="p-5 sm:p-6 rounded-xl bg-foundation-surface border border-foundation-border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm sm:text-base font-bold text-white tracking-tight">Sign Out</h4>
            <p className="text-xs text-gray-400 mt-0.5">
              Revoke your authenticated session token and return to the sign in screen
            </p>
          </div>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="self-start sm:self-auto px-4 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer"
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
        message="Are you sure you want to end your current session and sign out of Expenzo? You will need to log in again to access your financial records."
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
