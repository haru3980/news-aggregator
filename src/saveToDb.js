// 分類済みの記事をSupabase(Postgres)に保存する
// url にunique制約があるので、重複は自動でスキップされる(ON CONFLICT DO NOTHING)

const { createClient } = require('@supabase/supabase-js');

function getClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    throw new Error('SUPABASE_URL または SUPABASE_SERVICE_KEY が環境変数に設定されていません');
  }

  return createClient(url, key);
}

/**
 * 記事配列をarticlesテーブルに保存する
 * @param {Array} articles - category / classifiedBy が付与済みの記事配列
 */
async function saveArticles(articles) {
  if (articles.length === 0) {
    console.log('[saveToDb] 保存対象の記事が0件のためスキップ');
    return { inserted: 0 };
  }

  const supabase = getClient();

  // DBのカラム名(スネークケース)に合わせて変換
  const rows = articles.map((a) => ({
    title: a.title,
    summary: a.summary,
    url: a.url,
    source_tag: a.sourceTag,
    source_name: a.sourceName,
    category: a.category,
    classified_by: a.classifiedBy,
    published_at: a.publishedAt,
  }));

  // upsertでurl重複は無視(ignoreDuplicates: true)。大量件数でも1回で送る
  const { error, count } = await supabase
    .from('articles')
    .upsert(rows, { onConflict: 'url', ignoreDuplicates: true, count: 'exact' });

  if (error) {
    console.error('[saveToDb] 保存エラー:', error.message);
    throw error;
  }

  console.log(`[saveToDb] ${rows.length}件中、新規保存を試行完了`);
  return { inserted: rows.length };
}

module.exports = { saveArticles, getClient };
