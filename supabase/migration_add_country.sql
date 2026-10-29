-- 既にarticlesテーブルが存在する場合、このSQLをSupabaseのSQL Editorで実行してください
-- (countryカラムを追加するためのマイグレーション)

alter table articles add column if not exists country text;
create index if not exists idx_articles_country on articles (country);
