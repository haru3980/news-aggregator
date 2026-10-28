// ソース固定マッピングで確定しなかった記事を、LLM APIにまとめて(バッチで)投げて分類する
// トークン節約のため: 短いキー名 / カテゴリコード化 / 概要を短く切る / 複数記事をまとめて1コール

const categoriesData = require('../config/categories.json');

// カテゴリ名 ⇔ 短いコードの対応(出力トークン削減のため、LLMにはコードだけ返させる)
const CODE_TO_CATEGORY = {
  POL: '政治',
  ECO: '経済',
  WOR: '国際',
  SOC: '社会',
  IT: 'IT・テクノロジー',
  AI: 'AI',
  SPO: 'スポーツ',
  ENT: 'エンタメ',
  SCI: '科学',
  CAR: '自動車',
  GAM: 'ゲーム',
  OTH: 'その他',
};

const BATCH_SIZE = 25; // 1コールあたりの記事数(多いほど指示文コストを割り勘できる)

function buildPrompt(batch) {
  // インデント無しの圧縮JSONで送る。キーも1文字(i=id連番, t=title, s=summary)
  const items = batch.map((a, idx) => ({
    i: idx,
    t: a.title.slice(0, 60),
    s: a.summary.slice(0, 60),
  }));

  const codeList = Object.keys(CODE_TO_CATEGORY).join(',');

  return (
    `カテゴリコード:${codeList}\n` +
    `各記事を1つのコードに分類し、JSON配列のみ返答(説明文不要):[{"i":連番,"c":"コード"}]\n` +
    JSON.stringify(items)
  );
}

/**
 * Groq API(OpenAI互換)に1バッチ分を投げて分類結果を受け取る
 * @param {Array} batch - 未確定記事のうち最大BATCH_SIZE件
 */
async function classifyBatchWithGroq(batch) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error('[aiClassify] GROQ_API_KEY が未設定です。このバッチは「その他」にフォールバックします。');
    return batch.map(() => 'OTH');
  }

  const prompt = buildPrompt(batch);
  const endpoint = 'https://api.groq.com/openai/v1/chat/completions';

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b',
        temperature: 0,
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || '[]';

    // ```json のようなコードフェンスが付いて返ることがあるので除去してからパース
    const cleaned = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    // 結果をi(連番)順に並べたコード配列に変換。欠けていた分は'OTH'で埋める
    const codes = new Array(batch.length).fill('OTH');
    for (const item of parsed) {
      if (typeof item.i === 'number' && item.i < batch.length) {
        codes[item.i] = item.c;
      }
    }
    return codes;
  } catch (err) {
    console.error(`[aiClassify] バッチ分類失敗: ${err.message}`);
    return batch.map(() => 'OTH');
  }
}

/**
 * 未確定記事を全てAI分類する(BATCH_SIZEごとに分割して呼び出し)
 * @param {Array} unclassifiedArticles
 * @returns {Promise<Array>} categoryが付与された記事配列
 */
async function classifyUnclassified(unclassifiedArticles) {
  const results = [];

  for (let i = 0; i < unclassifiedArticles.length; i += BATCH_SIZE) {
    const batch = unclassifiedArticles.slice(i, i + BATCH_SIZE);
    const codes = await classifyBatchWithGroq(batch);

    batch.forEach((article, idx) => {
      const code = codes[idx] || 'OTH';
      results.push({
        ...article,
        category: CODE_TO_CATEGORY[code] || 'その他',
        classifiedBy: 'ai',
      });
    });
  }

  return results;
}

module.exports = { classifyUnclassified, buildPrompt, CODE_TO_CATEGORY };
