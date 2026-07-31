import { BODY_ZONES } from '../data/bodyMap';
import { ZONE_INFO } from '../data/insights';

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
