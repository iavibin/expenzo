import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  ReceiptText,
  Target,
  FileBarChart,
  Settings,
  LogOut,
  Wallet,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Expenses', path: '/expenses', icon: ReceiptText },
  { name: 'Budgets', path: '/budgets', icon: Target },
  { name: 'Reports', path: '/reports', icon: FileBarChart },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { isMobileOpen, closeMobile } = useSidebar();

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          role="presentation"
          aria-hidden="true"
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden transition-opacity duration-200"
          onClick={closeMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-60 bg-foundation-surface border-r border-foundation-border flex flex-col shrink-0 select-none transition-transform duration-200 ease-in-out ${
          isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-foundation-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-teal/15 border border-brand-teal/30 flex items-center justify-center text-brand-tealLight">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-bold text-base text-white tracking-tight">Expenzo</h1>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Expense Tracker</p>
            </div>
          </div>

          {/* Close button on mobile */}
          <button
            onClick={closeMobile}
            className="md:hidden p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-foundation-surfaceElevated transition-colors"
            title="Close menu"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={closeMobile}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-teal/10 text-brand-tealLight border border-brand-teal/20 font-semibold'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-foundation-surfaceElevated'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Info & Footer */}
        <div className="p-3 border-t border-foundation-border space-y-3">
          <div className="p-2.5 rounded-lg bg-foundation-surfaceElevated border border-foundation-borderSubtle flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <p className="text-xs font-semibold text-gray-200 truncate">{user?.name || 'User'}</p>
              <p className="text-[11px] text-gray-400 truncate">{user?.email || ''}</p>
            </div>
            <button
              onClick={() => logout()}
              title="Sign Out"
              aria-label="Sign Out"
              className="p-1.5 rounded-md text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Legal / Policy Links */}
          <div className="flex items-center justify-between px-1 text-[11px] text-gray-500">
            <Link
              to="/terms"
              onClick={closeMobile}
              className="hover:text-gray-300 transition-colors"
            >
              Terms of Service
            </Link>
            <span>•</span>
            <Link
              to="/privacy"
              onClick={closeMobile}
              className="hover:text-gray-300 transition-colors"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
