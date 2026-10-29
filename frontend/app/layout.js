import './globals.css';

export const metadata = {
  title: 'マイニュース',
  description: '日本・アメリカ・中国のニュースを、国とカテゴリで絞り込んで読む',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
