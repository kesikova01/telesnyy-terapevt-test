import { UI, MAIN_FACTOR, ZONE_INFO } from '../data/insights';
import { BODY_ZONES } from '../data/bodyMap';

// Названия зон через запятую: «челюсть, плечи»
const zoneNames = (zones, lang) => {
  const info = ZONE_INFO[lang] || ZONE_INFO.ru;
  return zones.map(z => info[z].name.toLowerCase()).join(', ');
};

export function Summary({ bodyKey, lang, duration, emotions, extraZone, delay = 0 }) {
  const ui = UI[lang] || UI.ru;
  const factor = (MAIN_FACTOR[lang] || MAIN_FACTOR.ru)[bodyKey];
  const base = BODY_ZONES[bodyKey] || BODY_ZONES.default;
  const zones = extraZone && !base.includes(extraZone) ? [...base, extraZone] : base;

  const text = lang === 'kz'
    ? `Жауаптарыңыз бойынша қазіргі күйіңіз ${factor} байланысты болуы мүмкін. Кернеу ${duration || 'ұзақ уақыт'} сақталып келеді, ал дене оған ${zoneNames(zones, lang)} аймақтарында жауап беріп отыр.`
    : `По вашим ответам можно предположить, что нынешнее состояние связано с ${factor}. Напряжение держится ${duration || 'уже долго'}, и тело отзывается на него в зонах: ${zoneNames(zones, lang)}.`;

  const emo = (emotions || []).filter(Boolean).join(', ');
  const second = emo
    ? (lang === 'kz'
        ? `Сол кездегі сезімдер — ${emo} — соңына дейін өмір сүрілмеген болуы мүмкін, сондықтан олар денеде қалып қойған.`
        : `Чувства того периода — ${emo} — судя по ответам, не были прожиты до конца, поэтому остались в теле.`)
    : null;

  return (
    <div className="surface p-6 fade-in" style={{ animationDelay: `${delay}ms` }}>
      <div className="eyebrow">{ui.summaryLabel}</div>
      <h3 className="display text-[21px] mt-2 mb-3">{ui.summaryTitle}</h3>
      <p className="text-[16px] leading-relaxed muted">{text}</p>
      {second && <p className="text-[16px] leading-relaxed muted mt-3">{second}</p>}
    </div>
  );
}

export function Chain({ steps, lang, delay = 0 }) {
  const ui = UI[lang] || UI.ru;
  return (
    <div className="surface p-6 fade-in" style={{ animationDelay: `${delay}ms` }}>
      <div className="eyebrow">{ui.chainLabel}</div>
      <h3 className="display text-[21px] mt-2 mb-5">{ui.chainTitle}</h3>

      <div className="space-y-0">
        {steps.map((s, i) => (
          <div key={i}>
            <div className="surface-flat px-4 py-3.5 text-[15px] leading-snug text-left">{s}</div>
            {i < steps.length - 1 && (
              <div className="flex justify-center py-1.5" aria-hidden="true">
                <svg width="12" height="16" viewBox="0 0 12 16" fill="none" stroke="var(--accent)"
                     strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.55 }}>
                  <path d="M6 1 L6 13" />
                  <path d="M2 9.5 L6 14 L10 9.5" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function Support({ items, lang, delay = 0 }) {
  const ui = UI[lang] || UI.ru;
  return (
    <div className="surface p-6 fade-in" style={{ animationDelay: `${delay}ms` }}>
      <div className="eyebrow">{ui.supportLabel}</div>
      <h3 className="display text-[21px] mt-2 mb-4">{ui.supportTitle}</h3>
      {items.length === 0 ? (
        <p className="text-[15.5px] leading-relaxed muted">{ui.supportNone}</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item, i) => (
            <li key={i} className="flex gap-3 text-left">
              <span className="mt-2 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--accent)' }} />
              <span className="text-[15.5px] leading-relaxed">
                {item.text}
                <span className="muted"> — {item.answer.toLowerCase()}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function Conclusion({ bodyKey, lang, delay = 0 }) {
  const ui = UI[lang] || UI.ru;
  const factor = (MAIN_FACTOR[lang] || MAIN_FACTOR.ru)[bodyKey];

  const text = lang === 'kz'
    ? `Жауаптарыңыз бойынша күйіңіздің басты факторы — ${factor} байланысты жағдай. Назарсыз қалса, мұндай күй ұзаққа созылуы мүмкін.`
    : `По вашим ответам наиболее вероятно, что главный фактор вашего состояния связан с ${factor}. Если оставить это без внимания, состояние может сохраняться.`;

  return (
    <div className="surface p-6 fade-in" style={{ animationDelay: `${delay}ms` }}>
      <div className="eyebrow">{ui.conclusionLabel}</div>
      <p className="text-[16px] leading-relaxed mt-3">{text}</p>
      <p className="text-[13.5px] leading-relaxed muted mt-4 pt-4" style={{ borderTop: '1px solid var(--line)' }}>
        {ui.disclaimer}
      </p>
    </div>
  );
}

export function NextStep({ lang, delay = 0 }) {
  const ui = UI[lang] || UI.ru;
  return (
    <div className="surface p-6 text-center fade-in" style={{ background: 'var(--accent-soft)', animationDelay: `${delay}ms` }}>
      <div className="eyebrow">{ui.nextLabel}</div>
      <h3 className="display text-[22px] mt-2 mb-3">{ui.nextTitle}</h3>
      <p className="text-[15.5px] leading-relaxed muted">{ui.nextText}</p>
    </div>
  );
}
