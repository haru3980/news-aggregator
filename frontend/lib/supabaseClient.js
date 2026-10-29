// フロントエンドからはanon(publishable)keyのみ使う。
// RLSで read のみ許可しているので、このキーが漏れても書き込み・削除はできない。
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(url, anonKey);
