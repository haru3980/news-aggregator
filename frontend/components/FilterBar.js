'use client';

import { CATEGORIES, CATEGORY_COLORS, COUNTRIES, COUNTRY_COLORS } from '../lib/constants';

function Tab({ active, color, onClick, children }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className="tab"
      style={{
        color: active ? color : 'var(--text-sub)',
        borderBottomColor: active ? color : 'transparent',
        fontWeight: active ? 700 : 400,
      }}
    >
      {children}
      <style jsx>{`
        .tab {
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          padding: 9px 10px;
          font-size: 13px;
          cursor: pointer;
          white-space: nowrap;
        }
        .tab:hover {
          color: var(--text);
        }
      `}</style>
    </button>
  );
}

export default function FilterBar({
  selectedCountries,
  selectedCategories,
  onToggleCountry,
  onToggleCategory,
}) {
  return (
    <div className="filterBar">
      <nav className="tabRow countryRow" aria-label="国で絞り込み">
        {COUNTRIES.map((c) => (
          <Tab
            key={c.code}
            active={selectedCountries.includes(c.code)}
            color={COUNTRY_COLORS[c.code]}
            onClick={() => onToggleCountry(c.code)}
          >
            {c.label}
          </Tab>
        ))}
      </nav>

      <nav className="tabRow categoryRow" aria-label="カテゴリで絞り込み">
        {CATEGORIES.map((cat) => (
          <Tab
            key={cat}
            active={selectedCategories.includes(cat)}
            color={CATEGORY_COLORS[cat]}
            onClick={() => onToggleCategory(cat)}
          >
            {cat}
          </Tab>
        ))}
      </nav>

      <style jsx>{`
        .filterBar {
          background: var(--surface);
          border-bottom: 1px solid var(--line-strong);
        }
        .tabRow {
          display: flex;
          overflow-x: auto;
          padding: 0 12px;
          scrollbar-width: thin;
        }
        .countryRow {
          border-bottom: 1px solid var(--line);
        }
      `}</style>
    </div>
  );
}
