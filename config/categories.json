// ソース固定マッピングによる一次分類
// 対応表にあれば即カテゴリ確定、無ければ「未確定」としてAI分類に回す

const sourceMapping = require('../config/sourceMapping.json');

/**
 * 記事配列を「確定済み」と「未確定(AI分類が必要)」に振り分ける
 * @param {Array} articles - [{ id, title, summary, url, sourceTag, publishedAt }]
 * @returns {{ classified: Array, unclassified: Array }}
 */
function classifyBySource(articles) {
  const classified = [];
  const unclassified = [];

  for (const article of articles) {
    const category = sourceMapping[article.sourceTag];

    if (category) {
      // 対応表にヒット → 即確定。どの段階で決まったか記録しておく
      classified.push({
        ...article,
        category,
        classifiedBy: 'source_map',
      });
    } else {
      // 対応表に無い、または値がnull → 次の段階(AI分類)へ
      unclassified.push(article);
    }
  }

  return { classified, unclassified };
}

module.exports = { classifyBySource };
