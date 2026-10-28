// 同じ出来事が複数のソースから来た場合に、重複としてまとめる処理
// 1. URL完全一致 → 確実な重複なので除外
// 2. タイトルの類似度 → 表記が少し違うだけの同一ニュースを検出

/**
 * タイトルを比較しやすい形に正規化する(空白除去、英数字を半角化、小文字化)
 */
function normalizeTitle(title) {
  return (title || '')
    .replace(/\s+/g, '')
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0))
    .toLowerCase();
}

/**
 * 2つの文字列の類似度を0〜1で返す(簡易Dice係数、2文字単位のbigramで比較)
 */
function similarity(a, b) {
  const bigrams = (s) => {
    const set = new Set();
    for (let i = 0; i < s.length - 1; i++) set.add(s.slice(i, i + 2));
    return set;
  };
  const setA = bigrams(a);
  const setB = bigrams(b);
  if (setA.size === 0 || setB.size === 0) return 0;

  let overlap = 0;
  for (const bg of setA) if (setB.has(bg)) overlap++;

  return (2 * overlap) / (setA.size + setB.size);
}

/**
 * 記事配列から重複を除去する
 * @param {Array} articles
 * @param {number} threshold - タイトル類似度の重複判定しきい値(デフォルト0.8)
 * @returns {Array} 重複を除いた記事配列
 */
function dedupeArticles(articles, threshold = 0.8) {
  const seenUrls = new Set();
  const kept = [];

  for (const article of articles) {
    // 1. URL完全一致チェック
    if (article.url && seenUrls.has(article.url)) continue;

    // 2. タイトル類似度チェック(すでに採用した記事と比較)
    const normalized = normalizeTitle(article.title);
    const isDuplicate = kept.some(
      (k) => similarity(normalized, normalizeTitle(k.title)) >= threshold
    );
    if (isDuplicate) continue;

    if (article.url) seenUrls.add(article.url);
    kept.push(article);
  }

  return kept;
}

module.exports = { dedupeArticles, similarity, normalizeTitle };
