'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { CATEGORIES, COUNTRIES } from '../lib/constants';
import FilterBar from '../components/FilterBar';
import ArticleRow from '../components/ArticleRow';

const ALL_COUNTRY_CODES = COUNTRIES.map((c) => c.code);
const PAGE_SIZE = 40;

export default function HomePage() {
  const [selectedCountries, setSelectedCountries] = useState(ALL_COUNTRY_CODES);
  const [selectedCategories, setSelectedCategories] = useState(CATEGORIES);
  const [articles, setArticles] = useState([]);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);

  function toggleCountry(code) {
    setLimit(PAGE_SIZE);
    setSelectedCountries((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  }

  function toggleCategory(cat) {
    setLimit(PAGE_SIZE);
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  useEffect(() => {
    let cancelled = false;

    async function fetchArticles() {
      setLoading(true);
      setErrorMsg(null);

      if (selectedCountries.length === 0 || selectedCategories.length === 0) {
        setArticles([]);
        setLoading(false);
        return;
      }

      let query = supabase
        .from('articles')
        .select('id, title, url, source_name, category, country, image_url, published_at')
        .order('published_at', { ascending: false })
        .limit(limit);

      if (selectedCountries.length < ALL_COUNTRY_CODES.length) {
        query = query.in('country', selectedCountries);
      }
      if (selectedCategories.length < CATEGORIES.length) {
        query = query.in('category', selectedCategories);
      }

      const { data, error } = await query;
      if (cancelled) return;

      if (error) {
        setErrorMsg('ニュースの取得に失敗しました。時間をおいて再読み込みしてください。');
        setArticles([]);
      } else {
        setArticles(data || []);
        setUpdatedAt(new Date());
      }
      setLoading(false);
    }

    fetchArticles();
    return () => {
      cancelled = true;
    };
  }, [selectedCountries, selectedCategories, limit]);

  return (
    <main>
      <header className="header">
        <span className="logo">マイニュース</span>
        {updatedAt && (
          <span className="updated">
            更新: {updatedAt.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </header>

      <FilterBar
        selectedCountries={selectedCountries}
        selectedCategories={selectedCategories}
        onToggleCountry={toggleCountry}
        onToggleCategory={toggleCategory}
      />

      <div className="list">
        {errorMsg && <p className="status">{errorMsg}</p>}

        {!errorMsg && !loading && articles.length === 0 && (
          <p className="status">
            条件に合うニュースが見つかりませんでした。国またはカテゴリの選択を増やしてみてください。
          </p>
        )}

        {!errorMsg && articles.map((a) => <ArticleRow key={a.id} article={a} />)}
      </div>

      {!errorMsg && articles.length > 0 && articles.length >= limit && (
        <div className="moreWrap">
          <button type="button" className="moreButton" onClick={() => setLimit((l) => l + PAGE_SIZE)}>
            {loading ? '読み込み中...' : 'もっと見る'}
          </button>
        </div>
      )}

      <style jsx>{`
        main {
          max-width: 720px;
          margin: 0 auto;
          min-height: 100vh;
          background: var(--surface);
          border-left: 1px solid var(--line);
          border-right: 1px solid var(--line);
        }
        .header {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          padding: 14px 16px 10px;
        }
        .logo {
          font-size: 17px;
          font-weight: 700;
        }
        .updated {
          font-size: 11.5px;
          color: var(--text-sub);
        }
        .status {
          padding: 40px 16px;
          color: var(--text-sub);
          font-size: 13px;
          text-align: center;
        }
        .moreWrap {
          display: flex;
          justify-content: center;
          padding: 18px;
        }
        .moreButton {
          padding: 9px 28px;
          border: 1px solid var(--line-strong);
          background: var(--surface);
          color: var(--text);
          font-size: 13px;
          border-radius: 3px;
          cursor: pointer;
        }
        .moreButton:hover {
          background: var(--hover-bg);
        }
      `}</style>
    </main>
  );
}
