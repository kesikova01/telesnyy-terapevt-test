import { createClient } from '@supabase/supabase-js';

// ─────────────────────────────────────────────────────────────
//  НАСТРОЙКИ САЙТА. Здесь меняются все ссылки и доступы.
//  Пока поля пустые — сайт работает, данные сохраняются только
//  в браузере (localStorage) и видны в админке.
// ─────────────────────────────────────────────────────────────

// Страница с бесплатными уроками (свой мини-сайт, путь /lessons на этом же домене)
export const LINK_LESSONS = '/lessons';

// Пароль от админки (иконка замка на первом экране)
export const ADMIN_PASSWORD = 'telo2026';

// Готовая короткая ссылка на запись — кнопка «Запись на персональный разбор»
export const LINK_CONSULTATION = 'https://wa.clck.bar/77478583439?text=%D0%A2%D0%B5%D1%81%D1%82%D1%82%D0%B5%D0%BD%20%D3%A9%D1%82%D1%82%D1%96%D0%BC,%20%D0%BF%D0%B5%D1%80%D1%81%D0%BE%D0%BD%D0%B0%D0%BB%D1%8C%D0%BD%D1%8B%D0%B9%20%D1%80%D0%B0%D0%B7%D0%B1%D0%BE%D1%80%20%D0%B0%D0%BB%D2%93%D1%8B%D0%BC%20%D0%BA%D0%B5%D0%BB%D0%B5%D0%B4%D1%96...';

// Инстаграм эксперта — используется на обложке, в карточке-шеринге и на странице уроков
export const INSTAGRAM_HANDLE = '@zhanibek.makash';
export const INSTAGRAM_URL = 'https://www.instagram.com/zhanibek.makash';

// ─── Оплата полного курса (23 урока) на странице /lessons ───
// Пусто — кнопка оплаты неактивна, но страница работает. Нужна ссылка Kaspi
// именно этого эксперта (Kaspi.kz Pay) — нельзя использовать чужую ссылку.
export const KASPI_PAY_URL = '';
// Номер карты для перевода, если нужен способ помимо Kaspi (необязательно)
export const CARD_NUMBER = '';
// Куда присылать чек об оплате — своя ссылка с текстом под подтверждение оплаты
export const RECEIPT_WHATSAPP_URL = 'https://wa.clck.bar/77478583439?text=%D0%A2%D0%B5%D1%81%D1%82%D1%82%D0%B5%D0%BD%20%D3%A9%D1%82%D1%82%D1%96%D0%BC,%20%D0%B0%D0%BB%D2%93%D0%B0%D1%88%D2%9B%D1%8B%20%D2%AF%D1%88%20%D1%81%D0%B0%D0%B1%D0%B0%D2%9B%20%D2%B1%D0%BD%D0%B0%D0%B4%D1%8B%20%D2%9B%D0%B0%D0%BB%D2%93%D0%B0%D0%BD%2020%20%D1%81%D0%B0%D0%B1%D0%B0%D2%9B%D2%9B%D0%B0%20%D0%BE%D0%BF%D0%BB%D0%B0%D1%82%D0%B0%20%D0%B6%D0%B0%D1%81%D0%B0%D0%B4%D1%8B%D0%BC...';
// Цена показывается как скидка: старая цена зачёркнута, рядом — новая.
// Оставить COURSE_PRICE_OLD пустым, если скидку показывать не нужно — тогда останется одна цена.
export const COURSE_PRICE_OLD = '150 000 ₸';
export const COURSE_PRICE = '9 490 ₸';

// Google Таблица (Apps Script Web App). Пусто — отправка выключена.
export const GOOGLE_SHEET_URL = '';

// Supabase. Пусто — отправка выключена.
const SUPABASE_URL = '';
const SUPABASE_KEY = '';

// Имя функции базы, которая принимает анкету (RPC).
export const SUPABASE_RPC = 'save_body_result';

export const supabaseClient =
  SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;
