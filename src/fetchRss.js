// RSSフィードを取得して、プログラム内で統一して扱える記事の形(オブジェクト)に変換する
// RDF 1.0 / RSS 2.0 など形式が違っても、rss-parserが吸収してくれる

const Parser = require('rss-parser');
const parser = new Parser({
  timeout: 10000,
  // 標準で拾われないmedia:thumbnail / media:contentも画像URLとして拾えるようにする
  customFields: {
    item: [
      ['media:thumbnail', 'mediaThumbnail'],
      ['media:content', 'mediaContent'],
    ],
  },
});

/**
 * 記事からサムネイル画像のURLを可能な範囲で抜き出す(無ければnull)
 */
function extractImageUrl(item) {
  if (item.enclosure?.url) return item.enclosure.url;
  if (item.mediaThumbnail?.$?.url) return item.mediaThumbnail.$.url;
  if (item.mediaContent?.$?.url) return item.mediaContent.$.url;
  return null;
}

/**
 * 1つのRSSフィードを取得し、記事リストに変換する
 * @param {{ sourceTag: string, name: string, url: string }} source
 * @returns {Promise<Array>} 記事オブジェクトの配列
 */
async function fetchOneRss(source) {
  try {
    const feed = await parser.parseURL(source.url);

    return feed.items.map((item) => ({
      // 記事を一意に識別するID。URLが無いフィードも稀にあるのでguidも保険にする
      id: item.link || item.guid,
      title: (item.title || '').trim(),
      // 概要はcontentSnippetが無ければcontentから作る。長すぎるとAI分類時のトークンが増えるので100文字で切る
      summary: (item.contentSnippet || item.content || '').trim().slice(0, 100),
      url: item.link,
      sourceTag: source.sourceTag,
      sourceName: source.name,
      country: source.country || null,
      imageUrl: extractImageUrl(item),
      publishedAt: item.isoDate || item.pubDate || null,
    }));
  } catch (err) {
    // 1つのフィードが落ちていても全体を止めない。エラーは記録だけして空配列を返す
    console.error(`[fetchRss] 取得失敗: ${source.name} (${source.url}) - ${err.message}`);
    return [];
  }
}

/**
 * sources.jsonのrss配列をまとめて取得する
 * @param {Array} sourceList - config/sources.json の rss 配列
 * @returns {Promise<Array>} 全フィード分の記事を1つの配列にまとめたもの
 */
async function fetchAllRss(sourceList) {
  // Promise.allSettledで、1つが失敗しても他の結果は失わないようにする
  const results = await Promise.allSettled(sourceList.map(fetchOneRss));

  return results
    .filter((r) => r.status === 'fulfilled')
    .flatMap((r) => r.value);
}

module.exports = { fetchOneRss, fetchAllRss };
