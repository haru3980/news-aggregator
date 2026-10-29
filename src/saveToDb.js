// 分類済みの記事をSupabase(Postgres)に保存する
// url にunique制約があるので、重複は自動でスキップされる(ON CONFLICT DO NOTHING)

const { createClient } = require('@supabase/supabase-js');

function getClient() {
  // 前後の空白・改行はコピペ時に紛れ込みやすいので、必ず除去する
  const url = (process.env.SUPABASE_URL || '').trim();
  const key = (process.env.SUPABASE_SERVICE_KEY || '').trim();

  if (!url || !key) {
    throw new Error('SUPABASE_URL または SUPABASE_SERVICE_KEY が環境変数に設定されていません');
  }

  if (!url.startsWith('https://') || !url.includes('.supabase.co')) {
    throw new Error(
      `SUPABASE_URLの形式が不正です(現在の値の先頭: "${url.slice(0, 15)}..."）。` +
      `"https://xxxxx.supabase.co" の形式になっているか確認してください(Project IDだけを入れていないか要確認)。`
    );
  }

  console.log(`[saveToDb] Supabase接続先: ${url}`);
  return createClient(url, key);
}

const CHUNK_SIZE = 200;

function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

async function saveArticles(articles) {
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

  const rows = validArticles.map((a) => ({
    title: a.title,
    summary: a.summary,
    url: a.url,
    source_tag: a.sourceTag,
    source_name: a.sourceName,
    category: a.category,
    country: a.country || null,
    classified_by: a.classifiedBy,
    published_at: a.publishedAt || null,
  }));

  const chunks = chunkArray(rows, CHUNK_SIZE);
  let totalSaved = 0;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    console.log(`[saveToDb] チャンク ${i + 1}/${chunks.length}(${chunk.length}件)を保存中...`);

    // ignoreDuplicates を外し、既存URLでも新しい情報(country等)で上書きする
    const { error } = await supabase
      .from('articles')
      .upsert(chunk, { onConflict: 'url' });

    if (error) {
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
