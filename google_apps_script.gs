// ============================================================
//  Тест для телесного терапевта — приём анкет в Google Таблицу
//  Куда вставлять: открыть Google Таблицу → Расширения → Apps Script →
//  стереть весь код по умолчанию → вставить этот файл целиком → Deploy
//  (см. инструкцию в конце файла).
// ============================================================

const HEADERS = [
  'Дата и время', 'ID', 'ФИО', 'Телефон', 'Здоровье', 'Отношения', 'Деньги',
  'Самооценка', 'Давность', 'Ситуация', 'Эмоции', 'Уточнения', 'Зоны напряжения',
  'Цепочка', 'Расшифровка', 'Нажатые кнопки', 'Язык',
];

function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = JSON.parse(e.postData.contents);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  }

  const row = [
    data.date || '',
    data.id || '',
    data.name || '',
    data.phone || '',
    data.health || '',
    data.relationships || '',
    data.money || '',
    data.selfEsteem || '',
    data.time || '',
    data.situation || '',
    data.emotions || '',
    data.clarify || '',
    data.bodyZones || '',
    data.chain || '',
    stripHtml(data.result),
    data.clickedButtons || '',
    data.lang || '',
  ];

  // Ищем строку с таким же ID — если клиент уже проходил тест и потом
  // нажал кнопку («Записаться», «3 урока» и т.д.), сайт присылает анкету
  // повторно с обновлённым списком нажатых кнопок. Обновляем ту же
  // строку, а не плодим дубли анкеты одного клиента.
  const idColumn = 2;
  const lastRow = sheet.getLastRow();
  let targetRow = -1;
  if (lastRow > 1) {
    const ids = sheet.getRange(2, idColumn, lastRow - 1, 1).getValues();
    for (let i = 0; i < ids.length; i++) {
      if (String(ids[i][0]) === String(data.id)) { targetRow = i + 2; break; }
    }
  }

  if (targetRow > -1) {
    sheet.getRange(targetRow, 1, 1, row.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }

  return ContentService.createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Разбор ("расшифровка") приходит html-текстом — убираем теги, чтобы
// в ячейке был читаемый текст, а не <h3>, <p> и т.д.
function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<\/(p|h1|h2|h3|h4|li|div|blockquote)>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&laquo;/g, '«')
    .replace(/&raquo;/g, '»')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ============================================================
//  Как подключить:
//  1. Google Таблицы → создать новую таблицу (например «Анкеты — Жанибек Макаш»).
//  2. Расширения → Apps Script.
//  3. Стереть весь код по умолчанию, вставить всё, что выше.
//  4. Развернуть → Новое развёртывание (Deploy → New deployment).
//     Тип: «Веб-приложение» (Web app).
//     Execute as: «Я» (Me).
//     Who has access: «Все» (Anyone).
//  5. Нажать Deploy, разрешить доступ (Authorize access) — потребуется
//     подтвердить своим Google-аккаунтом, это нормально, скрипт запускается
//     от имени владельца таблицы.
//  6. Скопировать выданный URL веб-приложения (заканчивается на /exec)
//     и прислать его — впишу в GOOGLE_SHEET_URL в src/config.js.
//  7. Если позже меняете код скрипта — каждый раз нужно делать новое
//     развёртывание (Manage deployments → Edit → New version), иначе
//     правки не применятся к уже выданной ссылке.
// ============================================================
