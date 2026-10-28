// 1日2回(朝6時・昼12時)、GitHub Actionsから呼ばれるメイン処理
// 流れ: 全ソース取得 → 重複排除 → ソース固定マッピングで一次分類 → 未確定分をAIで分類 → DB保存

require('dotenv').config();

const sources = require('../config/sources.json');
const { fetchAllRss } = require('./fetchRss');
const { fetchGoogleNewsSections, fetchGoogleNewsChina } = require('./fetchGoogleNews');
const { fetchAllNewsData } = require('./fetchApi');
const { dedupeArticles } = require('./dedupe');
const { classifyBySource } = require('./classify');
const { classifyUnclassified } = require('./aiClassify');
const { saveArticles } = require('./saveToDb');

async function main() {
  console.log('=== ニュース更新バッチ開始 ===', new Date().toISOString());

  // 1. 全ソースから並行取得
  console.log('[1/5] 記事取得中...');
  const [rssArticles, googleNewsArticles, chinaArticles, apiArticles] = await Promise.all([
    fetchAllRss(sources.rss),
    fetchGoogleNewsSections(sources.googleNewsSections),
    fetchGoogleNewsChina(sources.googleNewsChina),
    fetchAllNewsData(sources.apis.newsdata),
  ]);
  const allArticles = [...rssArticles, ...googleNewsArticles, ...chinaArticles, ...apiArticles];
  console.log(`  取得件数(重複排除前): ${allArticles.length}件`);

  // 2. 重複排除(同じニュースが複数ソースにまたがる場合、1件にまとめる)
  console.log('[2/5] 重複排除中...');
  const uniqueArticles = dedupeArticles(allArticles);
  console.log(`  重複排除後: ${uniqueArticles.length}件`);

  // 3. ソース固定マッピングで一次分類(コスト0)
  console.log('[3/5] ソース固定マッピングで分類中...');
  const { classified, unclassified } = classifyBySource(uniqueArticles);
  console.log(`  即確定: ${classified.length}件 / AI分類へ: ${unclassified.length}件`);

  // 4. 未確定分のみAIにバッチ投入
  console.log('[4/5] AI分類中...');
  const aiClassified = await classifyUnclassified(unclassified);

  // 5. DB保存
  console.log('[5/5] DB保存中...');
  const finalArticles = [...classified, ...aiClassified];
  await saveArticles(finalArticles);

  console.log('=== ニュース更新バッチ完了 ===', new Date().toISOString());
}

main().catch((err) => {
  console.error('バッチ処理が異常終了しました:', err);
  process.exit(1);
});
