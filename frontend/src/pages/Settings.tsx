import { useState } from 'react';
import {
  User as UserIcon,
  Mail,
  Lock,
  LogOut,
  IndianRupee,
  Calendar,
  Info,
  CheckCircle2,
  AlertCircle,
  FileText,
  ShieldCheck,
  Edit2,
  Loader2,
  Check,
} from 'lucide-react';
import Header from '../components/Header';
import ConfirmDialog from '../components/ConfirmDialog';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authService } from '../services/authService';
import { useNavigate, Link } from 'react-router-dom';
import DotGrid from '../components/DotGrid';

export default function Settings() {
  const { user, logout, updateProfile } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  // Profile Edit State
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Sign out confirmation
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Handle Profile Update
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);

    const trimmed = nameInput.trim();
    if (trimmed.length < 2) {
      setProfileError('Name must be at least 2 characters long.');
      return;
    }

    setSavingProfile(true);
    try {
      await updateProfile(trimmed);
      showSuccess('Profile name updated successfully');
      setIsEditingName(false);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      const msg = errorObj.response?.data?.message || 'Failed to update profile name.';
      setProfileError(msg);
      showError(msg);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCancelEditName = () => {
    setNameInput(user?.name || '');
    setProfileError(null);
    setIsEditingName(false);
  };

  // Handle Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }

    if (newPassword.length < 4) {
      setPasswordError('New password must be at least 4 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    setSavingPassword(true);
    try {
      await authService.changePassword(currentPassword, newPassword);
      showSuccess('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      const msg = errorObj.response?.data?.message || 'Failed to change password. Please verify your current password.';
      setPasswordError(msg);
      showError(msg);
    } finally {
      setSavingPassword(false);
    }
  };

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
    <div className="relative flex-1 flex flex-col min-h-0 bg-foundation-bg overflow-hidden">
      {/* React Bits Dot Grid Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <DotGrid
          dotSize={3}
          gap={24}
          baseColor="#263445"
          activeColor="#14b8a6"
          proximity={120}
          opacity={0.35}
        />
      </div>

      <div className="relative z-10 flex-1 flex flex-col min-h-0">
        <Header
          title="Account Settings"
          subtitle="Manage your personal profile, security credentials, and application preferences"
        />

        <div className="flex-1 p-4 sm:p-8 overflow-y-auto space-y-6">
        {/* A. Profile Section */}
        <section className="p-5 sm:p-6 rounded-xl bg-foundation-surface border border-foundation-border shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-foundation-border">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-brand-teal/15 border border-brand-teal/30 flex items-center justify-center text-brand-tealLight shrink-0">
                <UserIcon className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">{user?.name || 'User'}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{user?.email || 'user@example.com'}</p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Active Session</span>
                </div>
              </div>
            </div>

            <span className="self-start sm:self-auto text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-md bg-foundation-surfaceElevated border border-foundation-borderSubtle text-gray-400 font-mono">
              Profile Information
            </span>
          </div>

          {/* Profile Details & Inline Name Editor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Display Name Card */}
            <div className="p-4 rounded-xl bg-foundation-surfaceElevated border border-foundation-borderSubtle flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                    Display Name
                  </span>
                  {!isEditingName && (
                    <button
                      type="button"
                      onClick={() => {
                        setNameInput(user?.name || '');
                        setIsEditingName(true);
                      }}
                      className="text-xs text-brand-tealLight hover:underline flex items-center gap-1 font-medium cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  )}
                </div>

                {isEditingName ? (
                  <form onSubmit={handleSaveProfile} className="mt-2 space-y-3">
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="Your Full Name"
                      required
                      autoFocus
                      className="w-full bg-foundation-input border border-foundation-inputBorder rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-tealLight focus:ring-1 focus:ring-brand-tealLight"
                    />

                    {profileError && (
                      <p className="text-[11px] text-rose-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>{profileError}</span>
                      </p>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="submit"
                        disabled={savingProfile}
                        className="px-3 py-1.5 rounded-lg bg-brand-teal hover:bg-brand-tealLight text-white font-medium text-xs flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {savingProfile ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Check className="w-3 h-3" />
                        )}
                        <span>Save</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEditName}
                        disabled={savingProfile}
                        className="px-3 py-1.5 rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <p className="text-sm font-semibold text-white">{user?.name || 'N/A'}</p>
                )}
              </div>
              <p className="text-[11px] text-gray-400 mt-2">
                This name is displayed across your Expenzo dashboard and transaction records.
              </p>
            </div>

            {/* Email Address Card */}
            <div className="p-4 rounded-xl bg-foundation-surfaceElevated border border-foundation-borderSubtle flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                    Email Address
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono">Primary Login</span>
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold text-white mt-1">
                  <Mail className="w-4 h-4 text-brand-tealLight shrink-0" />
                  <span className="truncate">{user?.email || 'N/A'}</span>
                </div>
              </div>
              <p className="text-[11px] text-gray-400 mt-2">
                Your email address serves as your permanent account identifier.
              </p>
            </div>
          </div>
        </section>

        {/* 2-Column Grid: Security on Left, Preferences & About on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* B. Security Section */}
          <div className="space-y-6">
            {/* Change Password Card */}
            <section className="p-5 sm:p-6 rounded-xl bg-foundation-surface border border-foundation-border shadow-sm space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-foundation-border">
                <div className="w-9 h-9 rounded-lg bg-brand-teal/10 border border-brand-teal/20 flex items-center justify-center text-brand-tealLight shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white tracking-tight">Security & Password</h4>
                  <p className="text-xs text-gray-400">Update your account password</p>
                </div>
              </div>

              {passwordError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-gray-300 mb-1">
                    Current Password *
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter existing password"
                    required
                    className="w-full bg-foundation-input border border-foundation-inputBorder rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-tealLight focus:ring-1 focus:ring-brand-tealLight"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-300 mb-1">
                    New Password *
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 4 characters"
                    required
                    minLength={4}
                    className="w-full bg-foundation-input border border-foundation-inputBorder rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-tealLight focus:ring-1 focus:ring-brand-tealLight"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-300 mb-1">
                    Confirm New Password *
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type new password"
                    required
                    minLength={4}
                    className="w-full bg-foundation-input border border-foundation-inputBorder rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-tealLight focus:ring-1 focus:ring-brand-tealLight"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="w-full py-2.5 rounded-lg bg-brand-teal hover:bg-brand-tealLight text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {savingPassword ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <span>Update Password</span>
                    )}
                  </button>
                </div>
              </form>
            </section>

            {/* Sign Out Card */}
            <section className="p-5 sm:p-6 rounded-xl bg-foundation-surface border border-foundation-border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-white tracking-tight">Active Session</h4>
                <p className="text-xs text-gray-400 mt-0.5">
                  Sign out to end your authenticated session on this browser.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowLogoutConfirm(true)}
                className="self-start sm:self-auto px-4 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </section>
          </div>

          {/* Right Column: Preferences & About */}
          <div className="space-y-6">
            {/* C. Preferences Section */}
            <section className="p-5 sm:p-6 rounded-xl bg-foundation-surface border border-foundation-border shadow-sm space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-foundation-border">
                <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
                  <IndianRupee className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white tracking-tight">Preferences & Regional</h4>
                  <p className="text-xs text-gray-400">Application formatting and standards</p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                {/* Currency Standard */}
                <div className="p-3.5 rounded-lg bg-foundation-surfaceElevated border border-foundation-borderSubtle flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">Active Currency</p>
                    <p className="text-gray-400 text-[11px] mt-0.5">
                      Indian Rupee (INR) is the standard display currency across all KPI cards, tables, charts, and CSV statements.
                    </p>
                    <p className="mt-2 font-mono font-semibold text-brand-tealLight text-xs">
                      Sample: ₹12,450.00
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-brand-teal/10 border border-brand-teal/20 text-brand-tealLight font-mono text-[10px] font-bold shrink-0">
                    INR (₹)
                  </span>
                </div>

                {/* Date Format Standard */}
                <div className="p-3.5 rounded-lg bg-foundation-surfaceElevated border border-foundation-borderSubtle flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">Date Formatting</p>
                    <p className="text-gray-400 text-[11px] mt-0.5">
                      Transactions use standard ISO input <code className="text-gray-300 font-mono">YYYY-MM-DD</code> and formatted display <code className="text-gray-300 font-mono">MMM D, YYYY</code>.
                    </p>
                    <p className="mt-2 font-mono text-gray-300 text-xs flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span>Nov 2, 2026</span>
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-foundation-surface border border-foundation-border text-gray-400 font-mono text-[10px] font-medium shrink-0">
                    Standard
                  </span>
                </div>
              </div>
            </section>

            {/* D. About Section */}
            <section className="p-5 sm:p-6 rounded-xl bg-foundation-surface border border-foundation-border shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-foundation-border">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-brand-teal/10 border border-brand-teal/20 flex items-center justify-center text-brand-tealLight shrink-0">
                    <Info className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white tracking-tight">About Expenzo</h4>
                    <p className="text-xs text-gray-400">Product details and documentation</p>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded bg-foundation-surfaceElevated border border-foundation-border text-gray-300 font-mono text-[10px] font-bold">
                  v2.0.0
                </span>
              </div>

              <p className="text-xs text-gray-300 leading-relaxed">
                Expenzo is a modern personal finance and budget management platform engineered for clarity, speed, and dependable financial tracking.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <Link
                  to="/terms"
                  className="p-3 rounded-lg bg-foundation-surfaceElevated hover:bg-[#222e40] border border-foundation-borderSubtle flex items-center justify-between text-xs transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-brand-tealLight" />
                    <span className="text-gray-200 font-medium">Terms of Service</span>
                  </div>
                  <span className="text-gray-500 text-[11px]">&rarr;</span>
                </Link>

                <Link
                  to="/privacy"
                  className="p-3 rounded-lg bg-foundation-surfaceElevated hover:bg-[#222e40] border border-foundation-borderSubtle flex items-center justify-between text-xs transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-brand-tealLight" />
                    <span className="text-gray-200 font-medium">Privacy Policy</span>
                  </div>
                  <span className="text-gray-500 text-[11px]">&rarr;</span>
                </Link>
              </div>

              <div className="pt-2 text-[11px] text-gray-500 flex items-center justify-between">
                <span>© {new Date().getFullYear()} Expenzo Finance</span>
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Verified Build</span>
                </span>
              </div>
            </section>
          </div>
        </div>
      </div>
      </div>

      {/* Logout Confirmation Dialog */}
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
