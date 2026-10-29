// NewsData.io(無料枠・商用利用可)からカテゴリ別に記事を取得する

/**
 * NewsData.ioの1カテゴリ分を取得する
 * @param {string} category - "technology" など(sources.jsonのcategories配列の値)
 * @param {object} apiConfig - sources.json の apis.newsdata
 */
async function fetchNewsDataCategory(category, apiConfig) {
  const apiKey = process.env[apiConfig.apiKeyEnv];

  if (!apiKey) {
    console.error(`[fetchApi] ${apiConfig.apiKeyEnv} が環境変数に設定されていません。このカテゴリはスキップします。`);
    return [];
  }

  const url = `${apiConfig.endpoint}?apikey=${apiKey}&language=ja&category=${category}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();

    return (data.results || []).map((item) => ({
      id: item.link,
      title: (item.title || '').trim(),
      summary: (item.description || '').trim().slice(0, 100),
      url: item.link,
      sourceTag: `newsdata_${category}`,
      sourceName: `NewsData.io (${category})`,
      country: 'JP', // language=ja指定のため日本向けニュースとして扱う
      publishedAt: item.pubDate || null,
    }));
  } catch (err) {
    console.error(`[fetchApi] NewsData.io取得失敗 (${category}): ${err.message}`);
    return [];
  }
}

/**
 * 設定されている全カテゴリをまとめて取得する
 * @param {object} apiConfig - sources.json の apis.newsdata
 */
async function fetchAllNewsData(apiConfig) {
  const results = await Promise.allSettled(
    apiConfig.categories.map((cat) => fetchNewsDataCategory(cat, apiConfig))
  );
  return results.filter((r) => r.status === 'fulfilled').flatMap((r) => r.value);
}

module.exports = { fetchNewsDataCategory, fetchAllNewsData };
