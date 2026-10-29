// ソース固定マッピングで確定しなかった記事を、LLM APIにまとめて(バッチで)投げて分類する
// トークン節約のため: 短いキー名 / カテゴリコード化 / 概要を短く切る / 複数記事をまとめて1コール

const categoriesData = require('../config/categories.json');

// カテゴリ名 ⇔ 短いコードの対応(出力トークン削減のため、LLMにはコードだけ返させる)
// 以前は ECO(経済) と ENT(エンタメ) が似すぎていてAIが取り違えやすかったため、
// 見た目が被らないコードに変更(経済→BIZ, IT→TEC, スポーツ→SPT)
const CODE_TO_CATEGORY = {
  POL: '政治',
  BIZ: '経済',
  WLD: '国際',
  SOC: '社会',
  TEC: 'IT・テクノロジー',
  AI: 'AI',
  SPT: 'スポーツ',
  ENT: 'エンタメ',
  SCI: '科学',
  CAR: '自動車',
  GAM: 'ゲーム',
  OTH: 'その他',
};

const BATCH_SIZE = 25;

function buildPrompt(batch) {
  const items = batch.map((a, idx) => ({
    i: idx,
    t: a.title.slice(0, 60),
    s: a.summary.slice(0, 60),
  }));

  // コードだけだと意味を誤解されやすいため、「コード=カテゴリ名」の形で明示する
  const codeList = Object.entries(CODE_TO_CATEGORY)
    .map(([code, name]) => `${code}=${name}`)
    .join(',');

  return (
    `カテゴリコード(コード=意味):${codeList}\n` +
    `各記事を最も当てはまる1つのコードに分類し、JSON配列のみ返答(説明文不要):[{"i":連番,"c":"コード"}]\n` +
    JSON.stringify(items)
  );
}

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

    const cleaned = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

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
