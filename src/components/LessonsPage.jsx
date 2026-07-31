import { useState } from 'react';
import { LESSONS_TEXT, LESSONS } from '../data/lessonsContent';
import LessonPlayer from './LessonPlayer';
import {
    INSTAGRAM_HANDLE, INSTAGRAM_URL,
    KASPI_PAY_URL, CARD_NUMBER, RECEIPT_WHATSAPP_URL, COURSE_PRICE, COURSE_PRICE_OLD,
} from '../config';
import expertPhoto from '../assets/expert-photo-portrait.jpg';

// Мини-сайт «Бесплатные уроки» — открывается по адресу /lessons.
// Первые 3 урока из LESSONS играются прямо на странице (нужно вписать
// youtubeId в data/lessonsContent.js), остальные 20 показаны названием
// и описанием под замком — открываются после оплаты полного курса.
export default function LessonsPage() {
    const [lang, setLang] = useState('kz');
    const t = LESSONS_TEXT[lang];
    const title = (l) => (lang === 'kz' ? l.titleKz : l.titleRu);
    const desc = (l) => (lang === 'kz' ? l.descKz : l.descRu);
    const freeLessons = LESSONS.filter(l => l.free);
    const lockedLessons = LESSONS.filter(l => !l.free);

    return (
        <div className="min-h-screen page">
            <div className="max-w-[560px] mx-auto px-6 py-10">
                <div className="flex items-center justify-between mb-10">
                    <a href="/" className="eyebrow eyebrow-soft hover:opacity-70 transition-opacity">
                        {t.backToTest}
                    </a>
                    {/* Маленький переключатель языка */}
                    <div className="flex gap-1 p-1 rounded-full" style={{ background: 'var(--surface-2)' }}>
                        {['kz', 'ru'].map(code => (
                            <button key={code} onClick={() => setLang(code)}
                                    className="px-3 py-1 rounded-full text-[11px] font-semibold uppercase transition-colors"
                                    style={{
                                        background: lang === code ? 'var(--accent)' : 'transparent',
                                        color: lang === code ? 'var(--accent-ink)' : 'var(--ink-soft)',
                                    }}>
                                {code}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Хук */}
                <div className="surface p-7 text-center mb-5 fade-in">
                    <span className="badge mb-4">{t.badge}</span>
                    <p className="display text-[21px] leading-snug">{t.hook}</p>
                </div>

                {/* Кто такой телесный терапевт */}
                <div className="surface p-7 mb-5 fade-in">
                    <h2 className="display text-[22px] mb-3">{t.question}</h2>
                    <p className="muted text-[16px] leading-relaxed">{t.definition}</p>
                </div>

                {/* Мини-опрос (иллюстративный, не интерактивный) */}
                <div className="surface p-7 mb-5 fade-in">
                    <div className="eyebrow mb-2">{t.pollLabel}</div>
                    <h2 className="display text-[20px] mb-4">{t.pollQuestion}</h2>
                    <div className="space-y-2.5">
                        {t.pollOptions.map(opt => (
                            <div key={opt} className="surface-flat px-4 py-3 text-[15px]">{opt}</div>
                        ))}
                    </div>
                </div>

                {/* Как помогает */}
                <div className="surface p-7 mb-5 fade-in">
                    <h2 className="display text-[22px] mb-2">{t.helpsTitle}</h2>
                    <p className="muted text-[15px] mb-4">{t.helpsIntro}</p>
                    <div className="space-y-3 mb-4">
                        {t.helpsList.map(item => (
                            <div key={item} className="flex items-center gap-3">
                                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--accent)' }} />
                                <span className="text-[15.5px]">{item}</span>
                            </div>
                        ))}
                    </div>
                    <p className="text-[13.5px] muted pt-4" style={{ borderTop: '1px solid var(--line)' }}>{t.helpsNote}</p>
                </div>

                {/* Био эксперта — фото здесь, не кругом, а карточкой */}
                <div className="surface p-7 mb-5 fade-in">
                    <div className="flex items-start gap-5 mb-5">
                        <img src={expertPhoto} alt={t.bioName}
                             className="w-[104px] h-[128px] object-cover rounded-2xl shrink-0"
                             style={{ border: '1px solid var(--line)' }} />
                        <div>
                            <div className="eyebrow mb-1">{t.bioEyebrow}</div>
                            <h2 className="display text-[24px] mb-2">{t.bioName}</h2>
                            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer"
                               className="eyebrow hover:opacity-70 transition-opacity" style={{ fontSize: 11 }}>
                                {INSTAGRAM_HANDLE}
                            </a>
                        </div>
                    </div>
                    <p className="text-[15.5px] leading-relaxed mb-4">{t.bioRole}</p>
                    <p className="text-[15.5px] leading-relaxed muted mb-4">{t.bioMethod}</p>
                    <div className="space-y-2.5">
                        {t.bioList.map(item => (
                            <div key={item} className="flex items-start gap-3">
                                <span className="mt-2 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--accent)' }} />
                                <span className="text-[15px] leading-relaxed">{item}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 3 бесплатных урока — с видео прямо на странице */}
                <div className="mb-2 mt-9 fade-in">
                    <div className="eyebrow mb-1">{t.freeLabel}</div>
                    <h2 className="display text-[24px]">{t.freeTitle}</h2>
                </div>
                <div className="space-y-5 mb-9">
                    {freeLessons.map(l => (
                        <div key={l.n} className="surface p-6 fade-in">
                            <div className="flex items-baseline gap-3 mb-3">
                                <span className="step-number" style={{ fontSize: 26 }}>{String(l.n).padStart(2, '0')}</span>
                                <h3 className="text-[17px] font-semibold leading-snug">{title(l)}</h3>
                            </div>
                            <p className="text-[14.5px] muted leading-relaxed mb-4">{desc(l)}</p>
                            <LessonPlayer youtubeId={l.youtubeId} title={title(l)} placeholder={t.videoSoon} />
                        </div>
                    ))}
                </div>

                {/* Остальные 20 уроков — закрытый список */}
                <div className="mb-2 fade-in">
                    <div className="eyebrow mb-1">{t.lockedLabel}</div>
                    <h2 className="display text-[24px]">{t.lockedTitle}</h2>
                    <p className="text-[13.5px] muted mt-1">{t.lockedNote}</p>
                </div>
                <div className="surface overflow-hidden mb-9 fade-in">
                    {lockedLessons.map((l, i) => (
                        <div key={l.n}
                             className="flex items-start gap-4 px-5 py-4"
                             style={i !== 0 ? { borderTop: '1px solid var(--line)' } : undefined}>
                            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="var(--ink-soft)"
                                 strokeWidth="1.4" className="shrink-0 mt-1" style={{ opacity: 0.7 }}>
                                <rect x="3" y="7" width="10" height="7" rx="2" />
                                <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
                            </svg>
                            <div>
                                <p className="text-[15px] font-medium leading-snug">{String(l.n).padStart(2, '0')}. {title(l)}</p>
                                <p className="text-[13.5px] muted leading-relaxed mt-1">{desc(l)}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Оплата полного курса */}
                <div className="surface p-7 text-center fade-in" style={{ background: 'var(--accent-soft)' }}>
                    <h3 className="display text-[20px] mb-3">{t.payTitle}</h3>
                    <p className="text-[15px] leading-relaxed mb-1">{t.payText}</p>
                    {COURSE_PRICE ? (
                        <p className="mb-5 flex items-baseline justify-center gap-2.5 flex-wrap">
                            {COURSE_PRICE_OLD && (
                                <span className="text-[15px] muted" style={{ textDecoration: 'line-through' }}>
                                    {COURSE_PRICE_OLD}
                                </span>
                            )}
                            <span className="text-[20px] font-semibold">{COURSE_PRICE}</span>
                        </p>
                    ) : <div className="mb-5" />}

                    {KASPI_PAY_URL ? (
                        <a href={KASPI_PAY_URL} target="_blank" rel="noopener noreferrer" className="btn btn-primary mb-3">
                            {t.payKaspiBtn}
                        </a>
                    ) : (
                        <button disabled className="btn btn-primary mb-3">{t.payKaspiBtn}</button>
                    )}

                    {CARD_NUMBER && (
                        <p className="text-[14.5px] muted mb-3">{t.payCardLabel}: <span className="font-medium" style={{ color: 'var(--ink)' }}>{CARD_NUMBER}</span></p>
                    )}

                    {!KASPI_PAY_URL && (
                        <p className="text-[12.5px] muted mb-4">{t.payUnavailable}</p>
                    )}

                    <p className="text-[13.5px] muted leading-relaxed mb-4 pt-4" style={{ borderTop: '1px solid var(--line)' }}>
                        {t.payReceiptNote}
                    </p>
                    <a href={RECEIPT_WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
                        {t.payReceiptBtn}
                    </a>
                </div>

                {/* Соцсети — просто иконка, без давления */}
                <div className="flex justify-center mt-8 pb-6">
                    <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer"
                       aria-label={INSTAGRAM_HANDLE} className="theme-toggle">
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                            <rect x="3" y="3" width="18" height="18" rx="5" />
                            <circle cx="12" cy="12" r="4" />
                            <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
                        </svg>
                    </a>
                </div>
            </div>
        </div>
    );
}
