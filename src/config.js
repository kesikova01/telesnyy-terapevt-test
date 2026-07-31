import { createClient } from '@supabase/supabase-js';

// ─────────────────────────────────────────────────────────────
//  НАСТРОЙКИ САЙТА. Здесь меняются все ссылки и доступы.
//  Пока поля пустые — сайт работает, данные сохраняются только
//  в браузере (localStorage) и видны в админке.
// ─────────────────────────────────────────────────────────────

// Телеграм-канал с бесплатными уроками
export const LINK_LESSONS = '';

// Пароль от админки (иконка замка на первом экране)
export const ADMIN_PASSWORD = 'telo2026';

// Готовая короткая ссылка на запись — кнопка «Запись на персональный разбор»
export const LINK_CONSULTATION = 'https://wa.clck.bar/162073';

// Google Таблица (Apps Script Web App). Пусто — отправка выключена.
export const GOOGLE_SHEET_URL = '';

// Supabase. Пусто — отправка выключена.
const SUPABASE_URL = '';
const SUPABASE_KEY = '';

// Имя функции базы, которая принимает анкету (RPC).
export const SUPABASE_RPC = 'save_body_result';

export const supabaseClient =
  SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;
