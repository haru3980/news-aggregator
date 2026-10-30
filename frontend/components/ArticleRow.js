'use client';

import { CATEGORY_COLORS, COUNTRY_COLORS } from '../lib/constants';

function formatRelativeTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';

  const diffMin = Math.floor((Date.now() - d.getTime()) / 60000);
  if (diffMin < 1) return 'たった今';
  if (diffMin < 60) return `${diffMin}分前`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}時間前`;
  return d.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' });
}

export default function ArticleRow({ article }) {
  const categoryColor = CATEGORY_COLORS[article.category] || '#6b6d72';
  const countryColor = COUNTRY_COLORS[article.country] || '#6b6d72';

  return (
    <a href={article.url} target="_blank" rel="noopener noreferrer" className="row">
      <div className="thumbWrap">
        {article.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={article.image_url} alt="" className="thumb" loading="lazy" />
        ) : (
          <div className="thumbFallback" style={{ color: categoryColor, borderColor: categoryColor }}>
            {article.category.slice(0, 2)}
          </div>
        )}
      </div>

      <div className="body">
        <p className="headline">
          <span className="bracketTag" style={{ color: categoryColor }}>
            【{article.category}】
          </span>
          {article.title}
        </p>
        <p className="meta">
          {article.country && (
            <span className="countryTag" style={{ color: countryColor }}>
              {article.country}
            </span>
          )}
          <span className="source">{article.source_name}</span>
          <span className="time">{formatRelativeTime(article.published_at)}</span>
        </p>
      </div>

      <style jsx>{`
        .row {
          display: flex;
          gap: 12px;
          padding: 12px 14px;
          text-decoration: none;
          color: var(--text);
          border-bottom: 1px solid var(--line);
          background: var(--surface);
        }
        .row:hover {
          background: var(--hover-bg);
        }
        .thumbWrap {
          flex: none;
          width: 72px;
          height: 72px;
        }
        .thumb {
          width: 72px;
          height: 72px;
          object-fit: cover;
          border-radius: 2px;
          display: block;
        }
        .thumbFallback {
          width: 72px;
          height: 72px;
          border: 1px solid;
          border-radius: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          background: var(--hover-bg);
        }
        .body {
          flex: 1;
          min-width: 0;
        }
        .headline {
          margin: 0 0 6px;
          font-size: 14.5px;
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .bracketTag {
          font-weight: 700;
          margin-right: 2px;
          white-space: nowrap;
        }
        .meta {
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11.5px;
          color: var(--text-sub);
        }
        .countryTag {
          font-weight: 700;
          border: 1px solid currentColor;
          padding: 0 3px;
          line-height: 1.5;
        }

        @media (max-width: 480px) {
          .thumbWrap,
          .thumb,
          .thumbFallback {
            width: 56px;
            height: 56px;
          }
        }
      `}</style>
    </a>
  );
}
