import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, AlertTriangle } from 'lucide-react';
import DotGrid from '../components/DotGrid';

export default function Privacy() {
  return (
    <div className="relative min-h-screen bg-foundation-bg text-gray-200 p-4 sm:p-8 overflow-hidden">
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

      <div className="relative z-10 max-w-3xl mx-auto space-y-6">
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-brand-tealLight hover:underline font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Application</span>
        </Link>

        {/* Header */}
        <div className="p-6 rounded-xl bg-foundation-surface border border-foundation-border shadow-sm space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-brand-teal/10 border border-brand-teal/20 flex items-center justify-center text-brand-tealLight shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Privacy Policy</h1>
              <p className="text-xs text-gray-400">Effective Date: Current Product Release (November 2026)</p>
            </div>
          </div>

          {/* Legal Review Disclaimer */}
          <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Owner & Legal Review Notice:</strong> This privacy statement is based strictly on the factual, verifiable operational characteristics of the Expenzo codebase. It should be reviewed by legal counsel or the application owner before publication in public environments.
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 rounded-xl bg-foundation-surface border border-foundation-border shadow-sm space-y-6 text-xs text-gray-300 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">1. Information We Store</h2>
            <p>
              Expenzo stores only the information directly entered by users to provide expense tracking services:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-400 pl-2">
              <li><strong>Account Credentials:</strong> Full name, email address, and a salted cryptographic hash of your password.</li>
              <li><strong>Categories:</strong> Custom and default expense category labels created by the user.</li>
              <li><strong>Transactions:</strong> Expense amounts, transaction dates, payment method classifications, and optional descriptions.</li>
              <li><strong>Budgets:</strong> Monthly monetary thresholds set per category.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">2. Cryptographic Security & Password Handling</h2>
            <p>
              Plaintext passwords are never retained or logged. Passwords are processed using the industry-standard BCrypt key derivation function with 12 salt rounds ($2a$12$). Legacy plaintext passwords from earlier desktop versions are automatically upgraded to BCrypt hashes upon verified login.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">3. Local-First & Zero Third-Party Sharing</h2>
            <p>
              Expenzo is designed with privacy-by-default architecture:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-400 pl-2">
              <li>No third-party analytics, behavioral tracking, or telemetry libraries are bundled or executed.</li>
              <li>No advertising networks or marketing cookies are used.</li>
              <li>Financial records and transaction details are never transmitted to external cloud servers or third parties.</li>
              <li>Data persistence is confined entirely to the local MySQL database (<code className="text-brand-tealLight font-mono">expense_tracker</code>) configured by the host administrator.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">4. Session Management</h2>
            <p>
              Active login sessions are maintained using ephemeral UUID bearer tokens stored in the browser's <code className="text-brand-tealLight font-mono">localStorage</code> and in-memory server state. Tokens are invalidated upon signing out or when the Java server process is terminated.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">5. Data Retention & Deletion</h2>
            <p>
              Users maintain full control over their financial records. Expenses, budgets, and categories may be edited or deleted at any time through the application interface. Deleting a transaction permanently purges the corresponding row from the MySQL database.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">6. Contact and Administration</h2>
            <p>
              For questions regarding the configuration, data hosting, or deployment of this software, consult the repository administrator or system operator managing the local MySQL server instance.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
