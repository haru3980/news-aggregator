-- 過去の記事のうち、source_tagから国が確実に特定できるものだけcountryを埋める
-- (Google Newsのgnews_*は日本版・米国版で同じsource_tagを使っているため、ここでは対象外。
--  これらは今後の実行で記事が再取得されたタイミングで自動的に埋まります)

update articles set country = 'JP'
where country is null
  and source_tag in (
    'itmedia_aiplus', 'itmedia_news_bursts', 'pc_watch', 'car_watch',
    'game_watch', 'internet_watch', 'gigazine', 'gizmodo_jp'
  );

update articles set country = 'JP'
where country is null
  and source_tag like 'newsdata_%';

update articles set country = 'CN'
where country is null
  and source_tag = '36kr';
