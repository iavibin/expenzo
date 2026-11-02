import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, AlertTriangle } from 'lucide-react';
import DotGrid from '../components/DotGrid';

export default function Terms() {
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
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Terms of Service</h1>
              <p className="text-xs text-gray-400">Effective Date: Current Product Release (November 2026)</p>
            </div>
          </div>

          {/* Legal Review Disclaimer */}
          <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Owner & Legal Review Notice:</strong> This document represents an architectural draft reflecting the verified capabilities and operational parameters of the Expenzo software. It must be formally reviewed and approved by product owners or legal counsel prior to public deployment.
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 rounded-xl bg-foundation-surface border border-foundation-border shadow-sm space-y-6 text-xs text-gray-300 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">1. Nature of the Application</h2>
            <p>
              Expenzo is a self-hosted personal finance tracking utility designed to record expenses, configure category-based spending thresholds, and generate monthly financial summaries. The software is deployed on local infrastructure using a Java REST API backend and a MySQL database.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">2. User Account and Authentication</h2>
            <p>
              Users create an account with a display name, an email address, and a password. Passwords are protected using BCrypt salted hashing ($2a$12$). Authentication sessions are issued as in-memory UUID bearer tokens. You are responsible for safeguarding your login credentials and maintaining the security of the host environment where the database and application run.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">3. Financial Records and Accuracy</h2>
            <p>
              All currency figures, budget caps, expense classifications, and report outputs are computed directly from the transactions entered by the user. Expenzo does not integrate with banking networks, automated feeds, or payment gateways; it functions strictly as a ledger and calculation tool. Calculations use decimal arithmetic to maintain precision.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">4. Data Ownership and Backups</h2>
            <p>
              All recorded data resides solely in the user's configured MySQL database (<code className="text-brand-tealLight font-mono">expense_tracker</code>). The software does not transmit, replicate, or sync financial records to external servers. Consequently, regular database backups, data maintenance, and disaster recovery are the sole responsibility of the system operator.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">5. Acceptable Use and Modifications</h2>
            <p>
              Users may customize categories, log lawful personal or organizational expenses, and export statements in CSV format. Unauthorized attempts to alter database constraints or bypass session authentication mechanisms are prohibited within multi-user environments.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">6. Limitation of Liability</h2>
            <p>
              Expenzo is provided &ldquo;as is&rdquo; without warranties of any kind regarding suitability for commercial accounting, tax filing, or official audit compliance. The developers and contributors shall not be liable for data loss resulting from hardware failure, misconfigured database permissions, or unbacked-up records.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
