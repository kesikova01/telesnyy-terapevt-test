import { useState } from 'react';
import { BODY_ZONES, BODY_NOTES, ZONE_MAP } from '../data/bodyMap';
import { ZONE_INFO, UI } from '../data/insights';

const TEXT = {
  ru: {
    label: 'Где живёт напряжение',
    title: 'Телесная карта результата',
    strong: 'сильнее',
    weak: 'слабее',
  },
  kz: {
    label: 'Кернеу қай жерде тұрады',
    title: 'Нәтиженің дене картасы',
    strong: 'күштірек',
    weak: 'әлсіздеу',
  },
};

// Точки зон на схеме: id, координаты и радиус
const SPOTS = [
  { zone: 'jaw', id: 'zone-jaw', cx: 100, cy: 46, r: 20 },
  { zone: 'throat', id: 'zone-throat', cx: 100, cy: 64, r: 18 },
  { zone: 'chest', id: 'zone-chest', cx: 100, cy: 107, r: 30 },
  { zone: 'stomach', id: 'zone-stomach', cx: 100, cy: 152, r: 26 },
  { zone: 'shoulders', id: 'zone-shoulders-l', cx: 68, cy: 83, r: 18 },
  { zone: 'shoulders', id: 'zone-shoulders-r', cx: 132, cy: 83, r: 18 },
  { zone: 'hands', id: 'zone-hands-l', cx: 35, cy: 197, r: 16 },
  { zone: 'hands', id: 'zone-hands-r', cx: 165, cy: 197, r: 16 },
  { zone: 'lowerback', id: 'zone-lowerback', cx: 100, cy: 180, r: 26 },
];

export default function BodyMap({ bodyKey, lang = 'ru', extraZone = null }) {
  const t = TEXT[lang] || TEXT.ru;
  const ui = UI[lang] || UI.ru;
  const info = ZONE_INFO[lang] || ZONE_INFO.ru;

  const base = BODY_ZONES[bodyKey] || BODY_ZONES.default;
  // Уточняющие ответы могут добавить третью зону
  const zones = extraZone && !base.includes(extraZone) ? [...base, extraZone] : base;

  const note = (BODY_NOTES[lang] || BODY_NOTES.ru)[bodyKey] || (BODY_NOTES[lang] || BODY_NOTES.ru).default;

  const [selected, setSelected] = useState(zones[0]);

  const strength = (zone) => {
    if (zone === zones[0]) return 'primary';
    if (zone === zones[1]) return 'secondary';
    if (zones.includes(zone)) return 'extra';
    return 'off';
  };

  const opacityOf = (zone) => {
    const s = strength(zone);
    if (s === 'primary') return 0.85;
    if (s === 'secondary') return 0.38;
    if (s === 'extra') return 0.25;
    return 0;
  };

  const statusText = {
    primary: ui.zonePrimary,
    secondary: ui.zoneSecondary,
    extra: ui.zoneSecondary,
    off: ui.zoneOff,
  }[strength(selected)];

  return (
    <div className="surface p-6 text-center fade-in">
      <div className="eyebrow">{t.label}</div>
      <h3 className="display text-[21px] mt-2 mb-4">{t.title}</h3>
      <p className="text-[12.5px] muted mb-4">{ui.zoneHint}</p>

      <div className="w-[176px] mx-auto mb-5">
        <svg viewBox="0 0 200 420" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block">
          <defs>
            <radialGradient id="heatGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--heat)" stopOpacity="0.95" />
              <stop offset="100%" stopColor="var(--heat)" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* контур фигуры */}
          <g stroke="var(--figure)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="100" cy="35" r="26" />
            <path d="M92,58 L92,70 Q100,76 108,70 L108,58" />
            <path d="M70,80 Q100,66 130,80 L136,178 Q100,196 64,178 Z" />
            <path d="M70,82 Q40,110 35,190" />
            <path d="M130,82 Q160,110 165,190" />
            <circle cx="35" cy="197" r="7" />
            <circle cx="165" cy="197" r="7" />
            <path d="M78,193 L72,395" />
            <path d="M122,193 L128,395" />
            <path d="M72,395 L60,412" />
            <path d="M128,395 L140,412" />
          </g>

          {/* свечение зон */}
          {SPOTS.map(s => (
            <circle key={s.id} className="heat-zone" cx={s.cx} cy={s.cy} r={s.r}
                    fill="url(#heatGrad)" style={{ opacity: opacityOf(s.zone) }} />
          ))}

          {/* обводка выбранной зоны */}
          {SPOTS.filter(s => s.zone === selected).map(s => (
            <circle key={'ring-' + s.id} cx={s.cx} cy={s.cy} r={s.r * 0.72}
                    fill="none" stroke="var(--heat)" strokeWidth="1.6" strokeDasharray="3 3" opacity="0.9" />
          ))}

          {/* прозрачные кнопки поверх зон */}
          {SPOTS.map(s => (
            <circle key={'hit-' + s.id} cx={s.cx} cy={s.cy} r={s.r} fill="transparent"
                    style={{ cursor: 'pointer' }} onClick={() => setSelected(s.zone)}>
              <title>{info[s.zone].name}</title>
            </circle>
          ))}
        </svg>
      </div>

      {/* описание выбранной зоны */}
      <div className="surface-flat text-left px-5 py-4 fade-in" key={selected}>
        <div className="flex items-baseline justify-between gap-3 mb-1.5">
          <span className="text-[15.5px] font-semibold">{info[selected].name}</span>
          <span className="eyebrow" style={{ fontSize: 10 }}>{statusText}</span>
        </div>
        <p className="text-[14.5px] leading-relaxed muted">{info[selected].text}</p>
      </div>

      <p className="text-[13.5px] leading-relaxed muted text-left mt-3">{note}</p>

      <div className="flex justify-center gap-6 mt-5 text-[11px] muted">
        <span className="inline-flex items-center gap-2">
          <i className="w-2 h-2 rounded-full inline-block" style={{ background: 'var(--heat)' }} />
          {t.strong}
        </span>
        <span className="inline-flex items-center gap-2">
          <i className="w-2 h-2 rounded-full inline-block" style={{ background: 'var(--heat)', opacity: 0.4 }} />
          {t.weak}
        </span>
      </div>
    </div>
  );
}
