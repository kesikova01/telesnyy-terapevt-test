import { useState } from 'react';
import { BODY_ZONES } from '../data/bodyMap';
import { PATTERN_LABEL, UI } from '../data/insights';

// Контур фигуры — те же данные, что и в BodyMap, но рисуются на canvas
// (Path2D понимает обычные SVG-пути "d" без изменений).
const BODY_PATHS = [
  'M92,58 L92,70 Q100,76 108,70 L108,58',
  'M70,80 Q100,66 130,80 L136,178 Q100,196 64,178 Z',
  'M70,82 Q40,110 35,190',
  'M130,82 Q160,110 165,190',
  'M78,193 L72,395',
  'M122,193 L128,395',
  'M72,395 L60,412',
  'M128,395 L140,412',
];
const HEAD = { cx: 100, cy: 35, r: 26 };
const HANDS = [{ cx: 35, cy: 197, r: 7 }, { cx: 165, cy: 197, r: 7 }];
const SPOTS = [
  ['jaw', 100, 46, 20], ['throat', 100, 64, 18], ['chest', 100, 107, 30], ['stomach', 100, 152, 26],
  ['shoulders', 68, 83, 18], ['shoulders', 132, 83, 18], ['hands', 35, 197, 16], ['hands', 165, 197, 16],
  ['lowerback', 100, 180, 26],
];

// Разрежённые заглавные буквы — приближение к letter-spacing из CSS
const spaced = (s) => s.toUpperCase().split('').join(' ');

function wrapText(ctx, text, cx, startY, maxWidth, lineHeight) {
  const words = text.split(' ');
  const lines = [];
  let cur = '';
  words.forEach(w => {
    const probe = (cur + ' ' + w).trim();
    if (cur && ctx.measureText(probe).width > maxWidth) { lines.push(cur); cur = w; }
    else cur = probe;
  });
  if (cur) lines.push(cur);
  lines.forEach((line, i) => ctx.fillText(line, cx, startY + i * lineHeight));
  return startY + (lines.length - 1) * lineHeight;
}

// Обезличенная карточка: только паттерн и телесная карта, без имени и телефона —
// её можно свободно публиковать в соцсетях.
async function drawCard(bodyKey, extraZone, lang) {
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }

  const W = 1080, H = 1400;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  const ui = UI[lang] || UI.ru;

  ctx.fillStyle = '#F5F1EA';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';

  ctx.fillStyle = '#4B6B4F';
  ctx.font = '500 26px "IBM Plex Mono", monospace';
  ctx.fillText(spaced(ui.shareCardEyebrow), W / 2, 130);

  const base = BODY_ZONES[bodyKey] || BODY_ZONES.default;
  const zones = extraZone && !base.includes(extraZone) ? [...base, extraZone] : base;
  const opacityFor = (zone) => (zone === zones[0] ? 0.85 : zone === zones[1] ? 0.4 : zones.includes(zone) ? 0.25 : 0);

  const scale = 1.55;
  ctx.save();
  ctx.translate(W / 2 - 100 * scale, 200);
  ctx.scale(scale, scale);

  SPOTS.forEach(([zone, cx, cy, r]) => {
    const op = opacityFor(zone);
    if (op <= 0) return;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, `rgba(224,122,63,${op})`);
    g.addColorStop(1, 'rgba(224,122,63,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.strokeStyle = '#B9AF9C';
  ctx.lineWidth = 2.6;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.arc(HEAD.cx, HEAD.cy, HEAD.r, 0, Math.PI * 2);
  ctx.stroke();
  BODY_PATHS.forEach(d => ctx.stroke(new Path2D(d)));
  HANDS.forEach(h => { ctx.beginPath(); ctx.arc(h.cx, h.cy, h.r, 0, Math.PI * 2); ctx.stroke(); });
  ctx.restore();

  const title = (PATTERN_LABEL[lang] || PATTERN_LABEL.ru)[bodyKey] || (PATTERN_LABEL[lang] || PATTERN_LABEL.ru).default;
  ctx.fillStyle = '#2B2A26';
  ctx.font = '600 58px Lora, Georgia, serif';
  const lastTitleY = wrapText(ctx, title, W / 2, 950, 880, 68);

  ctx.fillStyle = '#6E6759';
  ctx.font = '400 30px Inter, -apple-system, sans-serif';
  ctx.fillText(ui.shareCaption, W / 2, lastTitleY + 70);

  ctx.strokeStyle = '#E0D7C6';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 60, lastTitleY + 130);
  ctx.lineTo(W / 2 + 60, lastTitleY + 130);
  ctx.stroke();

  const host = (typeof window !== 'undefined' && window.location.host) || '';
  ctx.fillStyle = '#4B6B4F';
  ctx.font = '500 22px "IBM Plex Mono", monospace';
  ctx.fillText(spaced([host, ui.shareFooter].filter(Boolean).join(' · ')), W / 2, lastTitleY + 185);

  return canvas;
}

export default function ShareCard({ bodyKey, extraZone, lang = 'ru', delay = 0 }) {
  const [state, setState] = useState('idle'); // idle | working | done | error
  const ui = UI[lang] || UI.ru;

  const handleShare = async () => {
    setState('working');
    try {
      const canvas = await drawCard(bodyKey, extraZone, lang);
      canvas.toBlob(async (blob) => {
        if (!blob) { setState('error'); return; }
        const file = new File([blob], 'telesnaya-karta.png', { type: 'image/png' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({ files: [file], title: ui.shareCardEyebrow });
            setState('idle');
            return;
          } catch {
            // пользователь закрыл системное окно шаринга — не ошибка, просто выходим
            setState('idle');
            return;
          }
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'telesnaya-karta.png';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
        setState('done');
      }, 'image/png', 0.95);
    } catch {
      setState('error');
    }
  };

  return (
    <div className="surface p-6 text-center fade-in" style={{ animationDelay: `${delay}ms` }}>
      <div className="eyebrow">{ui.shareCardEyebrow}</div>
      <h3 className="display text-[19px] mt-2 mb-4">{ui.shareTitle}</h3>
      <button onClick={handleShare} disabled={state === 'working'} className="btn btn-ghost">
        {state === 'working' ? ui.sharePreparing : state === 'done' ? ui.shareDone : ui.shareBtn}
      </button>
    </div>
  );
}
