'use client';

// ── Icon helpers ──────────────────────────────────────────────────────────────

function Icon({ d, className = 'w-4 h-4' }: { d: string | string[]; className?: string }) {
  const paths = Array.isArray(d) ? d : [d];
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      {paths.map((p, i) => <path key={i} d={p} />)}
    </svg>
  );
}

// ── Nav data ──────────────────────────────────────────────────────────────────

const DOLLAR = 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6';
const DOC    = 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z';
const ARROW  = 'M5 12h14M12 5l7 7-7 7';
const USERS  = ['M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2', 'M23 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75', 'M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'];
const PERSON = ['M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2', 'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'];
const BELL   = ['M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9', 'M13.73 21a2 2 0 0 1-3.46 0'];
const SHIELD = ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'];
const GRID   = 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z';
const BOX    = ['M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z', 'M3.27 6.96 12 12.01l8.73-5.05', 'M12 22.08V12'];
const CARD   = ['M1 4h22v16H1z', 'M1 10h22'];
const ZAP    = 'M13 2 3 14h9l-1 8 10-12h-9l1-8z';
const PLUS   = ['M12 5v14', 'M5 12h14'];
const LIST   = ['M8 6h13', 'M8 12h13', 'M8 18h13', 'M3 6h.01', 'M3 12h.01', 'M3 18h.01'];
const INBOX  = ['M22 12h-6l-2 3H10L8 12H2', 'M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z'];

interface NavItemDef {
  label: string;
  icon: string | string[];
  indent?: boolean;
}

interface NavSectionDef {
  sectionLabel?: string;
  items: NavItemDef[];
}

const NAV_SECTIONS: NavSectionDef[] = [
  {
    items: [
      { label: 'OkRx CoverCheck', icon: DOLLAR },
      { label: 'Listing',         icon: DOLLAR, indent: true },
    ],
  },
  {
    items: [
      { label: 'Forms',     icon: DOC },
      { label: 'Outbound',  icon: ARROW, indent: true },
    ],
  },
  {
    items: [
      { label: 'Patients',       icon: USERS },
      { label: 'Prescribers',    icon: PERSON },
      { label: 'Alerts',         icon: BELL },
      { label: 'Insurers',       icon: SHIELD },
      { label: 'Programs',       icon: GRID },
      { label: 'Products',       icon: BOX },
      { label: 'Copay Services', icon: CARD },
      { label: 'EZ Services',    icon: ZAP },
    ],
  },
  {
    sectionLabel: 'Forms',
    items: [
      { label: 'New Request', icon: PLUS },
    ],
  },
  {
    sectionLabel: 'Services',
    items: [
      { label: 'My Referral Programs', icon: LIST },
      { label: 'My Co-Pay Programs',   icon: CARD },
      { label: 'Received',             icon: INBOX },
    ],
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function NavSidebar() {
  return (
    <nav className="w-[200px] flex-shrink-0 h-full bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-700 overflow-y-auto sidebar-scroll select-none">
      <div className="py-2">
        {NAV_SECTIONS.map((section, si) => (
          <div key={si}>
            {/* Divider between sections */}
            {si > 0 && <div className="my-1 mx-3 border-t border-slate-100 dark:border-slate-800" />}

            {/* Section label */}
            {section.sectionLabel && (
              <p className="mt-3 mb-1 px-4 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                {section.sectionLabel}
              </p>
            )}

            {/* Items */}
            {section.items.map((item) => (
              <div
                key={item.label}
                className={`flex items-center gap-2.5 px-4 py-[7px] text-[13px] text-slate-600 dark:text-slate-400 cursor-default
                  hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors
                  ${item.indent ? 'pl-9 text-slate-500 dark:text-slate-500' : ''}`}
              >
                <span className="flex-shrink-0 text-slate-400 dark:text-slate-500">
                  <Icon d={item.icon} />
                </span>
                <span className="truncate">{item.label}</span>
              </div>
            ))}
          </div>
        ))}

        {/* Bottom rule */}
        <div className="mt-2 mx-3 border-t border-slate-100 dark:border-slate-800" />
      </div>
    </nav>
  );
}
