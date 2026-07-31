import { BODY_ZONES } from '../data/bodyMap';
import { ZONE_INFO } from '../data/insights';

// Точки зон — те же координаты, что и в BodyMap.jsx / ShareCard.jsx
const SPOTS = [
    ['jaw', 100, 46, 20], ['throat', 100, 64, 18], ['chest', 100, 107, 30], ['stomach', 100, 152, 26],
    ['shoulders', 68, 83, 18], ['shoulders', 132, 83, 18], ['hands', 35, 197, 16], ['hands', 165, 197, 16],
    ['lowerback', 100, 180, 26],
];

// Статичная телесная карта для печати — без интерактивности, просто рисунок с подсветкой зон
function PrintBodyMap({ bodyKey, extraZone }) {
    const zones = BODY_ZONES[bodyKey] || BODY_ZONES.default;
    const activeZones = extraZone && !zones.includes(extraZone) ? [...zones, extraZone] : zones;
    const opacityFor = (zone) => (zone === activeZones[0] ? 0.85 : zone === activeZones[1] ? 0.4 : activeZones.includes(zone) ? 0.25 : 0);

    return (
        <svg viewBox="0 0 200 420" width="150" style={{ display: 'block', margin: '0 auto' }}>
            <defs>
                <radialGradient id="printHeat" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#E07A3F" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="#E07A3F" stopOpacity="0" />
                </radialGradient>
            </defs>
            <g stroke="#B9AF9C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
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
            {SPOTS.map(([zone, cx, cy, r]) => (
                <circle key={`${zone}-${cx}-${cy}`} cx={cx} cy={cy} r={r} fill="url(#printHeat)" opacity={opacityFor(zone)} />
            ))}
        </svg>
    );
}

// Печатная версия одной анкеты — используется только для window.print().
// Скрыта на экране (.print-sheet), появляется исключительно в @media print
// (см. styles.css), поэтому кнопка «Скачать PDF» в админке сводится
// к системному «Сохранить как PDF» в диалоге печати — работает и на телефоне, и на компьютере.
export default function PrintableReport({ record }) {
    if (!record) return null;

    const lang = record.lang || 'ru';
    const info = ZONE_INFO[lang] || ZONE_INFO.ru;
    const zoneNames = [record.bodyKey, record.extraZone]
        .filter(Boolean)
        .map(z => info[z]?.name || z)
        .join(', ');
    const duration = (record.time === 'Свой вариант' || record.time === 'Өз нұсқам')
        ? record.customTime : record.time;
    const emotions = [...(record.emotions || []), record.customEmotion].filter(Boolean).join(', ');
    const clarify = Object.values(record.clarify || {}).join(', ');

    const row = (label, value) => (
        <div style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 10.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4B6B4F', marginBottom: 3 }}>{label}</div>
            <div style={{ fontSize: 14.5, lineHeight: 1.5, color: '#2B2A26' }}>{value || '—'}</div>
        </div>
    );

    return (
        <div className="print-sheet">
            <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 40px', fontFamily: 'Inter, -apple-system, sans-serif', color: '#2B2A26' }}>
                <div style={{ textAlign: 'center', marginBottom: 36, paddingBottom: 24, borderBottom: '1px solid #E0D7C6' }}>
                    <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#4B6B4F' }}>
                        Тест по первопричинам · @zhanibek.makash
                    </div>
                    <h1 style={{ fontFamily: 'Lora, Georgia, serif', fontSize: 28, fontWeight: 600, marginTop: 10 }}>{record.name}</h1>
                    <p style={{ color: '#6E6759', marginTop: 6, fontSize: 14.5 }}>{record.phone} · {record.date}</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px', marginBottom: 32 }}>
                    {row('Здоровье', record.health)}
                    {row('Давность', duration)}
                    {row('Отношения', record.relationships)}
                    {row('Ситуация', record.situation)}
                    {row('Деньги', record.money)}
                    {row('Эмоции', emotions)}
                    {row('Самооценка', record.selfEsteem)}
                    {row('Уточнения', clarify)}
                </div>

                <div style={{ marginBottom: 32 }}>
                    {row('Зоны напряжения', zoneNames)}
                    {row('Цепочка взаимосвязей', (record.chain || []).join(' → '))}
                    {row('Нажатые кнопки', (record.clickedButtons || []).join(' → '))}
                </div>

                <div style={{ marginBottom: 32, padding: '28px 20px', background: '#F3EEE4', borderRadius: 18, textAlign: 'center' }}>
                    <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 10.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4B6B4F', marginBottom: 14 }}>
                        Телесная карта результата
                    </div>
                    <PrintBodyMap bodyKey={record.bodyKey} extraZone={record.extraZone} />
                    <div style={{ fontSize: 13, color: '#6E6759', marginTop: 14 }}>
                        {zoneNames || '—'}
                    </div>
                </div>

                {record.result && (
                    <div>
                        <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4B6B4F', marginBottom: 12, paddingTop: 24, borderTop: '1px solid #E0D7C6' }}>
                            Полная расшифровка
                        </div>
                        <div className="report" dangerouslySetInnerHTML={{ __html: record.result }} />
                    </div>
                )}
            </div>
        </div>
    );
}
