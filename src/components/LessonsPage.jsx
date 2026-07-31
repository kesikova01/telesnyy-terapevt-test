import { useState } from 'react';
import { LESSONS_TEXT, LESSON_PLACEHOLDERS } from '../data/lessonsContent';
import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from '../config';
import expertPhoto from '../assets/expert-photo.jpg';

// Мини-сайт «Бесплатные уроки» — открывается по адресу /lessons.
// Пока это первый черновик: 5 блоков из историй эксперта плюс заглушка
// под 3 урока. Материалы уроков придут отдельно — тогда LESSON_PLACEHOLDERS
// в data/lessonsContent.js заменится на настоящие видео и описания.
export default function LessonsPage() {
    const [lang, setLang] = useState('kz');
    const t = LESSONS_TEXT[lang];
    const lessons = LESSON_PLACEHOLDERS[lang];

    return (
        <div className="min-h-screen page">
            <div className="max-w-[560px] mx-auto px-6 py-12">
                <a href="/" className="eyebrow eyebrow-soft inline-block mb-8 hover:opacity-70 transition-opacity">
                    {t.backToTest}
                </a>

                {/* Переключатель языка — сначала казахский */}
                <div className="flex justify-center gap-2 mb-10">
                    <button onClick={() => setLang('kz')} className={`chip ${lang === 'kz' ? 'is-on' : ''}`}>Қазақша</button>
                    <button onClick={() => setLang('ru')} className={`chip ${lang === 'ru' ? 'is-on' : ''}`}>Русский</button>
                </div>

                {/* Автор */}
                <div className="flex flex-col items-center text-center mb-10 fade-in">
                    <img src={expertPhoto} alt={t.bioName}
                         className="w-20 h-20 rounded-full object-cover mb-3"
                         style={{ boxShadow: '0 0 0 3px var(--surface), 0 0 0 4px var(--line)' }} />
                    <span className="badge">{t.badge}</span>
                    <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer"
                       className="eyebrow mt-3 hover:opacity-70 transition-opacity">
                        {INSTAGRAM_HANDLE}
                    </a>
                </div>

                {/* Хук */}
                <div className="surface p-7 text-center mb-5 fade-in">
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

                {/* Био эксперта */}
                <div className="surface p-7 mb-5 fade-in">
                    <div className="eyebrow mb-1">{t.bioEyebrow}</div>
                    <h2 className="display text-[26px] mb-4">{t.bioName}</h2>
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

                {/* Блок уроков — заглушка до готовых материалов */}
                <div className="surface p-7 mb-5 fade-in">
                    <div className="eyebrow mb-2">{t.lessonsEyebrow}</div>
                    <h2 className="display text-[22px] mb-5">{t.lessonsTitle}</h2>
                    <div className="space-y-3">
                        {lessons.map(l => (
                            <div key={l.n} className="surface-flat px-5 py-4 flex items-center gap-4">
                                <span className="step-number" style={{ fontSize: 28 }}>{l.n}</span>
                                <span className="text-[15px] font-medium">{l.title}</span>
                            </div>
                        ))}
                    </div>
                    <p className="text-[13.5px] muted mt-4">{t.lessonsSoon}</p>
                </div>

                {/* CTA */}
                <div className="surface p-7 text-center fade-in" style={{ background: 'var(--accent-soft)' }}>
                    <p className="text-[16px] leading-relaxed mb-5">{t.ctaText}</p>
                    <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                        {t.ctaBtn}
                    </a>
                </div>
            </div>
        </div>
    );
}
