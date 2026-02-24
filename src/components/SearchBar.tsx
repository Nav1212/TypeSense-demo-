'use client';

interface SearchBarProps {
  query: string;
  onQueryChange: (q: string) => void;
  mode: 'fuzzy' | 'hybrid';
  onModeChange: (m: 'fuzzy' | 'hybrid') => void;
  hybridAvailable: boolean;
  loading: boolean;
}

export default function SearchBar({
  query,
  onQueryChange,
  mode,
  onModeChange,
  hybridAvailable,
  loading,
}: SearchBarProps) {
  return (
    <div>
      {/* ── Search input ── */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <span style={{
          position: 'absolute',
          left: 12,
          top: '50%',
          transform: 'translateY(-50%)',
          color: '#94a3b8',
          fontSize: 14,
          pointerEvents: 'none',
          zIndex: 2,
          display: 'inline-flex',
          alignItems: 'center',
        }}>
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search clinical notes…"
          style={{
            width: '100%',
            boxSizing: 'border-box',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            padding: '12px 40px 12px 40px',
            fontSize: 14,
            color: '#1e293b',
            outline: 'none',
            transition: 'box-shadow .15s, border-color .15s',
            fontFamily: 'inherit',
          }}
          onFocus={(e) => {
            e.currentTarget.style.boxShadow = '0 0 0 2px rgba(15,107,62,.2)';
            e.currentTarget.style.borderColor = '#0f6b3e';
          }}
          onBlur={(e) => {
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.borderColor = '#e2e8f0';
          }}
        />
        {loading && (
          <span style={{
            position: 'absolute',
            right: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#0f6b3e',
            display: 'inline-flex',
            alignItems: 'center',
          }}>
            <svg className="animate-spin" width="14" height="14" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </span>
        )}
      </div>

      {/* ── Fuzzy / Hybrid toggle ── */}
      <div style={{
        background: '#f1f5f9',
        padding: 4,
        borderRadius: 8,
        display: 'inline-flex',
        marginBottom: 24,
      }}>
        <button
          onClick={() => onModeChange('fuzzy')}
          style={{
            padding: '6px 20px',
            fontSize: 14,
            fontWeight: 500,
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            background: mode === 'fuzzy' ? '#fff' : 'transparent',
            color: mode === 'fuzzy' ? '#2563eb' : '#64748b',
            boxShadow: mode === 'fuzzy' ? '0 1px 2px rgba(0,0,0,.06)' : 'none',
            transition: 'all .15s',
            whiteSpace: 'nowrap',
            fontFamily: 'inherit',
          }}
        >
          Fuzzy
        </button>
        <button
          onClick={() => hybridAvailable ? onModeChange('hybrid') : undefined}
          title={!hybridAvailable ? 'Embedding model may still be downloading' : undefined}
          style={{
            padding: '6px 20px',
            fontSize: 14,
            fontWeight: 500,
            border: 'none',
            borderRadius: 6,
            cursor: hybridAvailable ? 'pointer' : 'not-allowed',
            background: mode === 'hybrid' ? '#fff' : 'transparent',
            color: mode === 'hybrid' ? '#2563eb' : '#64748b',
            boxShadow: mode === 'hybrid' ? '0 1px 2px rgba(0,0,0,.06)' : 'none',
            opacity: !hybridAvailable ? 0.5 : 1,
            transition: 'all .15s',
            whiteSpace: 'nowrap',
            fontFamily: 'inherit',
          }}
        >
          Hybrid{!hybridAvailable && ' ⚠'}
        </button>
      </div>
    </div>
  );
}
