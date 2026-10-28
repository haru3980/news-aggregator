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

const CHUNK_SIZE = 200; // 1回のリクエストで送る件数の上限(ペイロード超過・タイムアウト対策)

/**
 * 配列をCHUNK_SIZEごとに分割する
 */
function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

/**
 * 記事配列をarticlesテーブルに保存する(CHUNK_SIZEごとに分割送信)
 * @param {Array} articles - category / classifiedBy が付与済みの記事配列
 */
async function saveArticles(articles) {
  // url が無い記事はDBのunique制約(url)に違反するため、事前に除外する
  const validArticles = articles.filter((a) => a.url);
  const skipped = articles.length - validArticles.length;
  if (skipped > 0) {
    console.warn(`[saveToDb] urlが無い記事を${skipped}件スキップしました`);
  }

  if (validArticles.length === 0) {
    console.log('[saveToDb] 保存対象の記事が0件のためスキップ');
    return { inserted: 0 };
  }

  const supabase = getClient();

  // DBのカラム名(スネークケース)に合わせて変換
  const rows = validArticles.map((a) => ({
    title: a.title,
    summary: a.summary,
    url: a.url,
    source_tag: a.sourceTag,
    source_name: a.sourceName,
    category: a.category,
    classified_by: a.classifiedBy,
    published_at: a.publishedAt || null,
  }));

  const chunks = chunkArray(rows, CHUNK_SIZE);
  let totalSaved = 0;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    console.log(`[saveToDb] チャンク ${i + 1}/${chunks.length}(${chunk.length}件)を保存中...`);

    const { error } = await supabase
      .from('articles')
      .upsert(chunk, { onConflict: 'url', ignoreDuplicates: true });

    if (error) {
      // error.message だけでなく、原因特定に必要な情報を全部出す
      console.error(`[saveToDb] チャンク${i + 1}で保存エラー発生:`);
      console.error('  message:', error.message);
      console.error('  code:', error.code);
      console.error('  details:', error.details);
      console.error('  hint:', error.hint);
      throw error;
    }

    totalSaved += chunk.length;
  }

  console.log(`[saveToDb] 合計${totalSaved}件の保存を試行完了`);
  return { inserted: totalSaved };
}

module.exports = { saveArticles, getClient };
