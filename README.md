# ニュース集約サイト - バックエンドバッチ

RSS + API からニュースを取得し、「ソース固定マッピング → AIバッチ分類」の2段構成でカテゴリ分けし、Supabaseに保存するバッチ処理です。GitHub Actionsで毎日朝6時・昼12時(JST)に自動実行されます。

## ディレクトリ構成

```
config/
  categories.json      正規化カテゴリ一覧
  sourceMapping.json   ソース → カテゴリの対応表(ここが「ソース固定マッピング」の本体)
  sources.json         取得元(RSS/API)の一覧
src/
  fetchRss.js           RSS取得
  fetchGoogleNews.js    Google Newsセクション別RSS取得
  fetchApi.js           NewsData.io API取得
  dedupe.js             重複ニュースの除去
  classify.js           ソース固定マッピングによる一次分類
  aiClassify.js         未確定記事のAIバッチ分類(トークン節約仕様)
  saveToDb.js            Supabaseへの保存
  index.js               全処理をつなぐメイン(エントリーポイント)
supabase/
  schema.sql             DBテーブル定義
.github/workflows/
  update-news.yml         定期実行設定(朝6時・昼12時 JST)
```

## あなたに用意していただきたいもの

1. **Supabaseアカウント**(無料)
   - https://supabase.com でプロジェクト作成
   - SQL Editorで `supabase/schema.sql` の内容を実行(articlesテーブルが作られます)
   - `Settings > API` から `Project URL` と `service_role key` を取得

2. **Gemini APIキー**(無料枠)
   - https://aistudio.google.com/apikey で発行

3. **NewsData.io APIキー**(無料枠)
   - https://newsdata.io で登録・発行

4. **GitHubリポジトリ**
   - このフォルダをリポジトリにpush
   - リポジトリの `Settings > Secrets and variables > Actions` に以下を登録
     - `SUPABASE_URL`
     - `SUPABASE_SERVICE_KEY`
     - `GEMINI_API_KEY`
     - `NEWSDATA_API_KEY`

登録が終われば、`.github/workflows/update-news.yml` が毎日自動実行されます(`Actions`タブから手動実行も可能)。

## ローカルで試す場合

```bash
npm install
cp .env.example .env   # .envに実際のキーを入力
npm start
```

## 今の時点でまだ未着手の部分

- **フロントエンド**(カテゴリ選択UI・記事一覧表示画面)はまだ作っていません
- **Supabaseからの読み取り専用API**(フロントが記事を取得する部分)も未着手
- Google News「台湾版・中国テック」以外の中国メディア(雷锋网など)の追加は今後必要なら対応します

次はフロントエンド(Next.js)側から着手しますか?
