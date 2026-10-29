// Google Newsのセクション別RSS(非公式)を、国・言語の組み合わせごとに取得する
// config/sources.json の googleNewsSections / googleNewsChina を元にURLを組み立てる

const { fetchOneRss } = require('./fetchRss');

/**
 * {TOPIC}/{HL}/{GL}/{CEID} のプレースホルダをURLに埋め込む
 */
function buildUrl(template, topic, edition) {
  return template
    .replace('{TOPIC}', topic)
    .replace('{HL}', edition.hl)
    .replace('{GL}', edition.gl)
    .replace('{CEID}', edition.ceid);
}

/**
 * 日本版・アメリカ版など、設定されている全エディション×全トピックを取得する
 * @param {object} googleNewsConfig - sources.json の googleNewsSections
 * @returns {Promise<Array>} 記事の配列
 */
async function fetchGoogleNewsSections(googleNewsConfig) {
  const tasks = [];

  for (const edition of googleNewsConfig.editions) {
    for (const topicConfig of googleNewsConfig.topics) {
      const url = buildUrl(googleNewsConfig.baseUrl, topicConfig.topic, edition);
      tasks.push(
        fetchOneRss({
          // カテゴリ分類はsourceTagで共通に扱うが、countryで国別に区別できるようにする
          sourceTag: topicConfig.sourceTag,
          name: `GoogleNews-${edition.name}-${topicConfig.topic}`,
          url,
          country: edition.country,
        })
      );
    }
  }

  const results = await Promise.allSettled(tasks);
  return results.filter((r) => r.status === 'fulfilled').flatMap((r) => r.value);
}

/**
 * 中国テック(台湾版を使用)を取得する
 * @param {object} chinaConfig - sources.json の googleNewsChina
 */
async function fetchGoogleNewsChina(chinaConfig) {
  return fetchOneRss({
    sourceTag: chinaConfig.sourceTag,
    name: 'GoogleNews-China-Tech',
    url: chinaConfig.url,
    country: chinaConfig.country,
  });
}

module.exports = { fetchGoogleNewsSections, fetchGoogleNewsChina };
