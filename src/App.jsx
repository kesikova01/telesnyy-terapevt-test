import { useState, useEffect, useRef } from 'react';
import { PSYCHO_DB } from './data/psychoDb';
import BodyMap from './components/BodyMap';
import TypingLoader from './components/TypingLoader';
import ShareCard from './components/ShareCard';
import { Summary, Chain, Support, Conclusion, NextStep } from './components/Insights';
import PrintableReport from './components/PrintableReport';
import BodyMapStatic from './components/BodyMapStatic';
import {
  ADAPTIVE_STATEMENT,
  COMMON_STATEMENTS,
  ANSWER_OPTIONS,
  ZONE_INFO,
  PATTERN_LABEL,
  UI,
} from './data/insights';
import { BODY_ZONES } from './data/bodyMap';
import expertPhoto from './assets/expert-photo.jpg';
import {
  LINK_LESSONS,
  LINK_CONSULTATION,
  GOOGLE_SHEET_URL,
  ADMIN_PASSWORD,
  SUPABASE_RPC,
  INSTAGRAM_HANDLE,
  INSTAGRAM_URL,
  supabaseClient,
} from './config';

// Порядок блоков в PSYCHO_DB.categories.health — одинаковый для ru и kz.
// По этим ключам подбирается телесная карта (см. data/bodyMap.js).
const HEALTH_KEYS = ['skin', 'head', 'back', 'stomach', 'women'];

const TOTAL_STEPS = 9;

// Уточняющие утверждения: какая зона тела добавляется на карту при ответе «Да»
const COMMON_ZONE = ['shoulders', 'jaw', 'lowerback'];

// Люди пишут «мигрени», «болит голова», «проблемы с кожей» — окончания у слов разные.
// Поэтому сравниваем не буква в букву, а по основе слова.
const WORD_ENDING = /(ами|ями|ов|ев|ах|ях|ой|ей|ий|ые|ая|ое|ы|и|а|я|е|у|ю|о|ь)$/;
const stem = (word) => word.replace(WORD_ENDING, '');

const textHasKeyword = (text, keyword) => {
    const key = stem(keyword.toLowerCase());
    if (key.length < 3) return text.toLowerCase().includes(keyword.toLowerCase());

    return text
        .toLowerCase()
        .split(/[^a-zа-яёәғқңөұүһі]+/i)
        .some(rawWord => {
            const word = stem(rawWord);
            if (word.length < 3) return false; // предлоги и союзы пропускаем
            if (word.length >= 5 && key.length >= 5) return word.slice(0, 5) === key.slice(0, 5);
            return word === key || word.startsWith(key) || key.startsWith(word);
        });
};

// Демо-анкета: открыть сайт с адресом ...?demo=1 и сразу увидеть экран результата.
// Нужно, чтобы показывать эксперту готовый разбор, не проходя тест заново.
const DEMO_FORM = {
    name: 'Демо-клиент', phone: '+7 707 123 45 67',
    health: 'Частые мигрени и головные боли',
    relationships: 'Конфликты с партнёром, ощущение непонимания',
    money: 'Не могу пробить потолок дохода',
    selfEsteem: 'Синдром самозванца',
    time: '3-5 лет', customTime: '',
    situation: 'Развод родителей и переезд в другой город',
    emotions: ['Страх', 'Обида'], customEmotion: '',
    clarify: { 0: 'Да', 1: 'Да', 2: 'Иногда', 3: 'Нет' }
};

export default function App() {
    const [step, setStep] = useState(0);
    const [lang, setLang] = useState(null);
    // Язык офера на обложке (переключается наверху, не влияет на язык самого теста)
    const [offerLang, setOfferLang] = useState('kz');
    const [isLoading, setIsLoading] = useState(false);
    const [reportHtml, setReportHtml] = useState('');
    const [bodyKey, setBodyKey] = useState('default');
    const [extraZone, setExtraZone] = useState(null);
    const [chain, setChain] = useState([]);
    const [support, setSupport] = useState([]);
    const [error, setError] = useState('');

    // Админка и данные
    const [showAdmin, setShowAdmin] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [db, setDb] = useState([]);
    const [currentRecordId, setCurrentRecordId] = useState(null);
    const [adminSearch, setAdminSearch] = useState('');
    const [expandedRecordId, setExpandedRecordId] = useState(null);
    const [printingRecord, setPrintingRecord] = useState(null);

    const [formData, setFormData] = useState({
        name: '', phone: '', health: '', relationships: '', money: '', selfEsteem: '',
        time: '', customTime: '', situation: '', emotions: [], customEmotion: '',
        clarify: {} // ответы на уточняющие утверждения: номер → «Да» / «Иногда» / «Нет»
    });

    const demoStarted = useRef(false);

    useEffect(() => {
        const savedDb = localStorage.getItem('bodyTherapistDB');
        if (savedDb) setDb(JSON.parse(savedDb));

        if (new URLSearchParams(window.location.search).get('demo') === '1') {
            setLang('ru');
            setFormData(DEMO_FORM);
            setStep(10);
        }
    }, []);

    // Демо-режим: как только анкета подставилась — сразу собираем разбор
    useEffect(() => {
        if (demoStarted.current) return;
        if (step === 10 && formData.health === DEMO_FORM.health && lang === 'ru') {
            demoStarted.current = true;
            generateReport();
        }
    }, [step, formData, lang]);

    // Печать анкеты из админки: печатный лист рендерится скрыто (.print-sheet),
    // после его появления в DOM вызываем системный диалог печати —
    // там можно выбрать «Сохранить как PDF» и на компьютере, и на телефоне.
    useEffect(() => {
        if (!printingRecord) return undefined;
        const id = setTimeout(() => window.print(), 60);
        const clear = () => setPrintingRecord(null);
        window.addEventListener('afterprint', clear);
        return () => { clearTimeout(id); window.removeEventListener('afterprint', clear); };
    }, [printingRecord]);

    const sendToGoogleSheet = (recordToSave) => {
        const payload = {
            id: recordToSave.id,
            date: recordToSave.date || new Date().toLocaleString(),
            name: recordToSave.name || '',
            phone: recordToSave.phone || '',
            health: recordToSave.health || '',
            relationships: recordToSave.relationships || '',
            money: recordToSave.money || '',
            selfEsteem: recordToSave.selfEsteem || '',
            time: isOwnOption(recordToSave.time) ? recordToSave.customTime : recordToSave.time,
            situation: recordToSave.situation || '',
            emotions: (recordToSave.emotions || []).join(', ') + (recordToSave.customEmotion ? ` (${recordToSave.customEmotion})` : ''),
            clarify: Object.values(recordToSave.clarify || {}).join(', '),
            bodyZones: [recordToSave.bodyKey, recordToSave.extraZone].filter(Boolean).join(', '),
            chain: (recordToSave.chain || []).join(' → '),
            result: recordToSave.result || '',
            clickedButtons: (recordToSave.clickedButtons || []).join(', '),
            lang: recordToSave.lang || ''
        };

        if (GOOGLE_SHEET_URL) {
            fetch(GOOGLE_SHEET_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }).catch(err => console.log('Ошибка при отправке в Google Sheets:', err));
        }

        sendToSupabase(recordToSave);
    };

    const sendToSupabase = async (recordToSave) => {
        // Пока Supabase не подключён — анкета живёт только в браузере и в админке.
        if (!supabaseClient) return;

        const row = {
            client_id: String(recordToSave.id),
            full_name: recordToSave.name || '',
            phone: recordToSave.phone || '',
            health: recordToSave.health || '',
            relationships: recordToSave.relationships || '',
            money: recordToSave.money || '',
            self_esteem: recordToSave.selfEsteem || '',
            time_lived: isOwnOption(recordToSave.time) ? recordToSave.customTime : recordToSave.time,
            situation: recordToSave.situation || '',
            emotions: (recordToSave.emotions || []).join(', ') + (recordToSave.customEmotion ? ` (${recordToSave.customEmotion})` : ''),
            clarify: Object.values(recordToSave.clarify || {}).join(', '),
            body_zones: [recordToSave.bodyKey, recordToSave.extraZone].filter(Boolean).join(', '),
            chain: (recordToSave.chain || []).join(' → '),
            result: recordToSave.result || '',
            clicked_buttons: (recordToSave.clickedButtons || []).join(', '),
            lang: recordToSave.lang || ''
        };

        // Пишем через функцию базы: сайту доступна только запись.
        // Читать анкеты по этому ключу нельзя — данные клиентов защищены.
        const { error } = await supabaseClient.rpc(SUPABASE_RPC, { payload: row });

        if (error) console.log('Ошибка при отправке в Supabase:', error);
    };

    const translations = {
        ru: {
            chooseLang: "Выберите язык", welcomeTitle: "О тесте",
            welcomeDesc: "Узнайте истинные причины ваших состояний в сфере здоровья, отношений, денег и духовности.",
            welcomeDetails: "Этот тест глубоко проанализирует ваши ответы, покажет полную психосоматическую картину ваших блокировок и телесную карту — где именно тело держит это напряжение.",
            startBtn: "Начать тест", contactsTitle: "Давайте познакомимся", nameLabel: "Как к вам обращаться?",
            phoneLabel: "Ваш номер телефона", nextBtn: "Продолжить", healthTitle: "Здоровье",
            healthDesc: "Опишите вашу проблему со здоровьем (например: псориаз, частые мигрени, боли в спине). Если проблем нет, напишите «Нет проблем».",
            relTitle: "Отношения", relDesc: "Опишите вашу проблему в отношениях (например: конфликты, одиночество, непонимание). Если нет, напишите «Нет проблем».",
            moneyTitle: "Деньги и карьера", moneyDesc: "Опишите проблему (например: долги, не могу пробить потолок, выгорание). Если нет, напишите «Нет проблем».",
            selfTitle: "Самооценка и духовность", selfDesc: "Опишите проблему (например: синдром самозванца, неприятие себя, апатия, потеря смысла).",
            timeTitle: "Как давно это было?", timeDesc: "Укажите, как давно вы живете с этой проблемой.",
            timeOptions: ["Недавно", "Полгода", "1 год", "3-5 лет", "Больше 5 лет", "С детства", "Свой вариант"],
            situationTitle: "Ситуация", situationDesc: "Какая ситуация произошла в вашей жизни, когда появилась эта проблема? Опишите откровенно.",
            emotionsTitle: "Эмоции", emotionsDesc: "Что вы чувствовали в тот момент?",
            emotionOptions: ["Страх", "Гнев", "Обида", "Вина", "Стыд", "Одиночество", "Беспомощность", "Разочарование"],
            customOptionPlace: "Напишите свой вариант", analyzeBtn: "Получить глубокий разбор",
            analyzingText: "Составляем детальный анализ ваших блокировок...", resultTitle: "Ваш персональный разбор",
            lessonsBtn: "Посмотреть 3 бесплатных урока «Телесно-ориентированной терапии»", consultBtn: "Запись на персональный разбор",
            healthPlace: "Сюда напишите свою проблему со здоровьем",
            relPlace: "Сюда напишите свою проблему в отношениях",
            moneyPlace: "Сюда напишите свою проблему с деньгами и карьерой",
            selfPlace: "Сюда напишите свою проблему с самооценкой",
            situationPlace: "Сюда напишите, какая ситуация тогда произошла",
            stepLabel: (n) => `Шаг ${n} из ${TOTAL_STEPS}`,
            backBtn: "Назад",
            errRequired: "Пожалуйста, заполните это поле — без него дальше не перейти",
            errChoose: "Пожалуйста, выберите хотя бы один вариант",
            errName: "Пожалуйста, напишите своё имя",
            errPhone: "Проверьте номер телефона. Пример: +7 707 123 45 67"
        },
        kz: {
            chooseLang: "Тілді таңдаңыз", welcomeTitle: "Тест туралы",
            welcomeDesc: "Денсаулық, қарым-қатынас, қаржы және руханият саласындағы жағдайыңыздың нағыз себептерін біліңіз.",
            welcomeDetails: "Бұл тест сіздің жауаптарыңызды терең талдап, ішкі блоктарыңыздың толық психосоматикалық көрінісін және дене картасын — кернеу дәл қай жерде тұрғанын көрсетеді.",
            startBtn: "Тестті бастау", contactsTitle: "Танысайық", nameLabel: "Есіміңіз кім?",
            phoneLabel: "Телефон нөміріңіз", nextBtn: "Жалғастыру", healthTitle: "Денсаулық",
            healthDesc: "Мәселеңізді сипаттаңыз (мысалы: псориаз, жиі бас ауруы). Егер мәселе жоқ болса, «Мәселе жоқ» деп жазыңыз.",
            relTitle: "Қарым-қатынас", relDesc: "Мәселеңізді сипаттаңыз (мысалы: ұрыс-керіс, жалғыздық). Жоқ болса, «Мәселе жоқ» деп жазыңыз.",
            moneyTitle: "Ақша және карьера", moneyDesc: "Мәселені сипаттаңыз (мысалы: қарыздар, табыс көлемін асыра алмау). Жауап жоқ болса «Мәселе жоқ» деп жазыңыз.",
            selfTitle: "Өзін-өзі бағалау және руханият", selfDesc: "Мәселені сипаттаңыз (мысалы: өзін мойындамау, апатия, өмір мәнін жоғалту).",
            timeTitle: "Бұл қашан болды?", timeDesc: "Бұл мәселемен қанша уақыт өмір сүріп келесіз?",
            timeOptions: ["Жақында", "Жарты жыл", "1 жыл", "3-5 жыл", "5 жылдан астам", "Бала кезден", "Өз нұсқам"],
            situationTitle: "Жағдай", situationDesc: "Бұл мәселе пайда болған кезде өміріңізде қандай жағдай болды? Ашық жазыңыз.",
            emotionsTitle: "Эмоциялар", emotionsDesc: "Сол сәтте не сезіндіңіз?",
            emotionOptions: ["Қорқыныш", "Ашу", "Реніш", "Кінә", "Ұят", "Жалғыздық", "Дәрменсіздік", "Көңіл қалу"],
            customOptionPlace: "Өз нұсқаңызды жазыңыз", analyzeBtn: "Терең талдауды алу",
            analyzingText: "Сіздің ішкі блоктарыңыздың детальды талдауын құрастырудамыз...", resultTitle: "Сіздің жеке талдауыңыз",
            lessonsBtn: "«Дене-бағдарлы терапия» бойынша 3 тегін сабақты көру", consultBtn: "Жеке талдауға жазылу",
            healthPlace: "Денсаулық мәселеңізді осы жерге жазыңыз",
            relPlace: "Қарым-қатынастағы мәселеңізді осы жерге жазыңыз",
            moneyPlace: "Ақша мен карьерадағы мәселеңізді осы жерге жазыңыз",
            selfPlace: "Өзін-өзі бағалау мәселеңізді осы жерге жазыңыз",
            situationPlace: "Сол кезде қандай жағдай болғанын осы жерге жазыңыз",
            stepLabel: (n) => `${n} / ${TOTAL_STEPS} қадам`,
            backBtn: "Артқа",
            errRequired: "Бұл өрісті толтырыңыз — онсыз әрі қарай өту мүмкін емес",
            errChoose: "Кемінде бір нұсқаны таңдаңыз",
            errName: "Есіміңізді жазыңыз",
            errPhone: "Телефон нөмірін тексеріңіз. Мысалы: +7 707 123 45 67"
        }
    };

    const t = lang ? translations[lang] : translations.ru;

    const handleInputChange = (field, value) => {
        if (error) setError('');
        setFormData({ ...formData, [field]: value });
    };

    const toggleEmotion = (emo) => {
        if (error) setError('');
        const updated = formData.emotions.includes(emo)
            ? formData.emotions.filter(e => e !== emo)
            : [...formData.emotions, emo];
        setFormData({ ...formData, emotions: updated });
    };

    // Телефон считаем верным, если в нём 10–15 цифр (обычный номер, а не случайный набор)
    const phoneIsValid = (raw) => {
        const digits = String(raw || '').replace(/\D/g, '');
        return digits.length >= 10 && digits.length <= 15;
    };

    function isOwnOption(value) {
        return value === 'Свой вариант' || value === 'Өз нұсқам';
    }

    // Проверка текущего шага. Пустая строка — можно идти дальше.
    const validateStep = () => {
        switch (step) {
            case 2:
                if (!formData.name.trim()) return t.errName;
                if (!phoneIsValid(formData.phone)) return t.errPhone;
                return '';
            case 3: return formData.health.trim() ? '' : t.errRequired;
            case 4: return formData.relationships.trim() ? '' : t.errRequired;
            case 5: return formData.money.trim() ? '' : t.errRequired;
            case 6: return formData.selfEsteem.trim() ? '' : t.errRequired;
            case 7:
                if (!formData.time) return t.errChoose;
                if (isOwnOption(formData.time) && !formData.customTime.trim()) return t.errRequired;
                return '';
            case 8: return formData.situation.trim() ? '' : t.errRequired;
            case 9:
                if (formData.emotions.length === 0 && !formData.customEmotion.trim()) return t.errChoose;
                return '';
            case 10:
                return statements().every((_, i) => formData.clarify[i]) ? '' : t.errChoose;
            default: return '';
        }
    };

    const handleNext = () => {
        const problem = validateStep();
        if (problem) {
            setError(problem);
            return;
        }
        setError('');
        if (step === 10) generateReport();
        else setStep(step + 1);
    };

    // Утверждения на шаге уточнений: первое подбирается под сферу клиента
    const statements = () => {
        const l = lang || 'ru';
        const key = findMatch().key;
        return [
            (ADAPTIVE_STATEMENT[l] || ADAPTIVE_STATEMENT.ru)[key],
            ...(COMMON_STATEMENTS[l] || COMMON_STATEMENTS.ru),
        ];
    };

    const setClarify = (index, answer) => {
        if (error) setError('');
        setFormData({ ...formData, clarify: { ...formData.clarify, [index]: answer } });
    };

    const prevStep = () => { setError(''); setStep(step - 1); };

    // Подбираем блок разбора и ключ телесной карты по ответам клиента
    const findMatch = () => {
        const currentDb = PSYCHO_DB[lang || 'ru'];
        const userHealthText = formData.health.toLowerCase();
        const userRelText = formData.relationships.toLowerCase();
        const userMoneyText = formData.money.toLowerCase();
        const userSelfText = formData.selfEsteem.toLowerCase();

        const noProblem = (text) => text.includes('нет проблем') || text.includes('мәселе жоқ');

        const healthIndex = currentDb.categories.health.findIndex(item =>
            item.keywords.some(keyword => textHasKeyword(userHealthText, keyword))
        );

        if (healthIndex !== -1) {
            return { block: currentDb.categories.health[healthIndex], key: HEALTH_KEYS[healthIndex] };
        }
        if (userRelText.length > 10 && !noProblem(userRelText)) {
            return { block: currentDb.categories.relationships, key: 'relationships' };
        }
        if (userMoneyText.length > 10 && !noProblem(userMoneyText)) {
            return { block: currentDb.categories.money, key: 'money' };
        }
        if (userSelfText.length > 10 && !noProblem(userSelfText)) {
            return { block: currentDb.categories.selfEsteem, key: 'selfEsteem' };
        }
        return { block: currentDb.default, key: 'default' };
    };

    // Ключевой алгоритм генерации длинного разбора
    const buildStaticReport = (matchedBlock) => {
        const allEmotions = [...formData.emotions];
        if (formData.customEmotion) allEmotions.push(formData.customEmotion);
        const emotionsStr = allEmotions.join(', ') || (lang === 'kz' ? 'айқындалмаған сезімдер' : 'невыраженные чувства');
        const problemDuration = isOwnOption(formData.time) ? formData.customTime : formData.time;
        const userSituation = formData.situation || (lang === 'kz' ? 'айтылмаған, бірақ іште қалған жағдай' : 'болезненная ситуация, скрытая внутри');

        if (lang === 'kz') {
            return `
                <h3>1. Физикалық блокировка (Дененің реакциясы)</h3>
                <p><strong>Маркер:</strong> ${matchedBlock.title}</p>
                <p>${matchedBlock.физическая}</p>

                <h3>2. Эмоционалдық блокировка (Сезімдер деңгейі)</h3>
                <p>Сіз жазған мына жағдайға назар аударып көрейік: <em>«${userSituation}»</em>. Дәл осы оқиға сіздің проблемаңыздың немесе ауруыңыздың нақты триггеріне айналды. Сол сәтте сіз <strong>${emotionsStr}</strong> сияқты өте ауыр эмоцияларды бастан өткердіңіз.</p>
                <p>Бұл эмоциялар соңына дейін шығарылмады және өмір сүрілмеді. Нәтижесінде сіздің психикаңыз осы ауыр сезімдерді бейсанаға (подсознаниеге) итеріп жіберді, ал ол жерден олар денеге немесе өмірлік ситуацияларға көшіп, блокировка тудырды. Сіз бұл ауыр жүкпен <strong>${problemDuration}</strong> бойы өмір сүріп келесіз, ал денеңіз бен өміріңіз бұл туралы айқайлап ескертуге мәжбүр.</p>

                <h3>3. Ментальды блокировка (Түпсана сенімдері)</h3>
                <p>${matchedBlock.ментальная}</p>

                <h3>4. Түпкі себепті табуға арналған терең сұрақтар</h3>
                <p>Бұл сұрақтарға үстіртін жауап бермеңіз. Өзіңізбен оңаша қалып, шынайы ойланыңыз:</p>
                <ul>
                    ${matchedBlock.вопросы.map(q => `<li>${q}</li>`).join('')}
                    <li>Осы проблемаңыз бен блокировкаңыз сізге қандай "жасырын пайда" (скрытая выгода) әкеліп тұр (мүмкін сізді аяйды, демалуға рұқсат береді немесе жауапкершіліктен қашасыз)?</li>
                </ul>

                <h3>5. Психосоматика қашан көмектеседі?</h3>
                <blockquote>
                    Есіңізде болсын, психосоматикалық талдау және дене терапиясы мына жағдайларда өте тиімді:
                    <ul style="margin-top: 10px; margin-bottom: 0;">
                        <li>Дәстүрлі медицина диагноз қоя алмай, берген емі нәтиже бермесе;</li>
                        <li>Ауру немесе жағымсыз жағдай (қарыз, ұрыс) қайта-қайта қайталана берсе;</li>
                        <li>Денеңіз бұл ауру арқылы сізді бір ауыр міндеттен "құтқарып" жүрсе;</li>
                        <li>Мәселе тек денсаулық емес, ақша мен қарым-қатынастың бұзылуына алып келсе.</li>
                    </ul>
                </blockquote>

                <div class="highlight-box">
                    <p><strong>Келесі қадам:</strong> Тест бағытты көрсетеді — терең жұмыс консультацияда жүреді. Осы паттерн туралы білу ғана емес, оны денеден шығару үшін жазылыңыз.</p>
                </div>
            `;
        }
        return `
            <h3>1. Физическая блокировка (Реакция тела)</h3>
            <p><strong>Маркер:</strong> ${matchedBlock.title}</p>
            <p>${matchedBlock.физическая}</p>

            <h3>2. Эмоциональная блокировка (Уровень чувств)</h3>
            <p>Давайте посмотрим на ситуацию, которую вы описали: <em>«${userSituation}»</em>. Именно это событие стало мощным триггером для запуска вашей проблемы. В тот момент вы испытали целый коктейль тяжелых эмоций: <strong>${emotionsStr}</strong>.</p>
            <p>Проблема в том, что эти эмоции не были прожиты до конца. Вы их проглотили или подавили. Психика не смогла экологично переварить этот стресс и вытеснила его в тело (или в событийный ряд). Вы носите этот груз внутри себя уже <strong>${problemDuration}</strong>, и ваш организм вынужден сигнализировать о перегрузке через симптомы или жизненные тупики.</p>

            <h3>3. Ментальная блокировка (Подсознательные программы)</h3>
            <p>${matchedBlock.ментальная}</p>

            <h3>4. Глубокие вопросы для поиска первопричины</h3>
            <p>Не отвечайте на эти вопросы поверхностно. Побудьте в тишине и будьте максимально честны с собой:</p>
            <ul>
                ${matchedBlock.вопросы.map(q => `<li>${q}</li>`).join('')}
                <li>Какую «скрытую выгоду» вы получаете от этой болезни или проблемы (возможно, это единственный способ заставить других заботиться о вас, или легальный способ отдохнуть от обязательств)?</li>
            </ul>

            <h3>5. Когда помогает работа с телом и психосоматикой?</h3>
            <blockquote>
                Такой подход незаменим и дает самые быстрые результаты, если:
                <ul style="margin-top: 10px; margin-bottom: 0;">
                    <li>Официальная медицина разводит руками, анализы в норме, а вам плохо;</li>
                    <li>Медикаментозное лечение дает лишь временный эффект, и болезнь возвращается;</li>
                    <li>Проблема носит хронический характер и выматывает вас;</li>
                    <li>Ситуация жестко привязана к конфликтам в отношениях, страхам или потере денег.</li>
                </ul>
            </blockquote>

            <div class="highlight-box">
                <p><strong>Следующий шаг:</strong> тест показывает направление — глубинная работа происходит на консультации. Запишитесь, чтобы снять этот паттерн из тела, а не просто узнать о нём.</p>
            </div>
        `;
    };

    // Цепочка «как одно перешло в другое» — собирается из ответов клиента
    const buildChain = (key, extra) => {
        const l = lang || 'ru';
        const info = ZONE_INFO[l] || ZONE_INFO.ru;
        const base = BODY_ZONES[key] || BODY_ZONES.default;
        const zones = extra && !base.includes(extra) ? [...base, extra] : base;
        const zonesStr = zones.map(z => info[z].name.toLowerCase()).join(', ');

        const emotions = [...formData.emotions, formData.customEmotion].filter(Boolean).join(', ');
        const duration = isOwnOption(formData.time) ? formData.customTime : formData.time;
        const situation = formData.situation.trim().replace(/\s+/g, ' ').slice(0, 90);

        if (l === 'kz') {
            return [
                situation ? `Жағдай: «${situation}»` : 'Ұзаққа созылған ішкі кернеу',
                emotions ? `Соңына дейін өмір сүрілмеген сезімдер: ${emotions}` : 'Айтылмай қалған сезімдер',
                `Кернеу ${duration || 'ұзақ уақыт'} сақталып келеді`,
                `Дене оны ұстап тұрған аймақтар: ${zonesStr}`,
                'Энергияның төмендеуі және қайталанатын симптомдар',
            ];
        }
        return [
            situation ? `Ситуация: «${situation}»` : 'Длительное внутреннее напряжение',
            emotions ? `Непрожитые эмоции: ${emotions}` : 'Невыраженные чувства',
            `Напряжение держится ${duration || 'уже долго'}`,
            `Тело удерживает его в зонах: ${zonesStr}`,
            'Снижение энергии и повторяющиеся симптомы',
        ];
    };

    // Что из уточнений поддерживает состояние + какая зона добавляется на карту
    const readClarify = () => {
        const l = lang || 'ru';
        const options = ANSWER_OPTIONS[l] || ANSWER_OPTIONS.ru;
        const list = statements();

        const items = list
            .map((text, i) => ({ text, answer: formData.clarify[i], index: i }))
            .filter(x => x.answer && x.answer !== options[2]);

        // Первое «Да» среди общих утверждений добавляет свою зону на карту
        const yes = items.find(x => x.index > 0 && x.answer === options[0]);
        const zone = yes ? COMMON_ZONE[yes.index - 1] : null;

        return { items, zone };
    };

    // Фразы для экрана загрузки: печатаются по буквам, третья ссылается
    // на реально найденную зону — усиливает ощущение живого анализа
    const buildLoadingPhrases = () => {
        const l = lang || 'ru';
        const info = ZONE_INFO[l] || ZONE_INFO.ru;
        const matched = findMatch();
        const primaryZone = (BODY_ZONES[matched.key] || BODY_ZONES.default)[0];
        const zoneName = info[primaryZone].name.toLowerCase();

        if (l === 'kz') {
            return [
                'Жауаптарыңызды оқып жатырмыз…',
                'Эмоциялар мен дене реакцияларын салыстырамыз…',
                `«${zoneName}» аймағындағы сәйкестікті іздейміз…`,
                'Жеке паттеріңізді құрастырамыз…',
            ];
        }
        return [
            'Читаем ваши ответы…',
            'Сопоставляем эмоции и реакции тела…',
            `Ищем совпадения в зоне «${zoneName}»…`,
            'Формируем ваш персональный паттерн…',
        ];
    };

    const generateReport = () => {
        setIsLoading(true);
        setStep(11);

        setTimeout(() => {
            const matched = findMatch();
            const htmlResult = buildStaticReport(matched.block);
            const clarified = readClarify();
            const chainSteps = buildChain(matched.key, clarified.zone);

            setReportHtml(htmlResult);
            setBodyKey(matched.key);
            setExtraZone(clarified.zone);
            setSupport(clarified.items);
            setChain(chainSteps);

            const reportId = Date.now();
            setCurrentRecordId(reportId);

            const newRecord = {
                id: reportId,
                ...formData,
                bodyKey: matched.key,
                extraZone: clarified.zone || '',
                chain: chainSteps,
                result: htmlResult,
                clickedButtons: [], // Для отслеживания нажатых кнопок
                date: new Date().toLocaleString(),
                lang
            };

            const updatedDb = [...db, newRecord];
            setDb(updatedDb);
            localStorage.setItem('bodyTherapistDB', JSON.stringify(updatedDb));

            sendToGoogleSheet(newRecord);

            setIsLoading(false);
        }, 3600); // время подобрано под цикл фраз в TypingLoader
    };

    // Функция для сохранения нажатий на кнопки
    const trackButtonClick = (btnName, url = null) => {
        if (currentRecordId) {
            const updatedDb = db.map(record => {
                if (record.id === currentRecordId) {
                    const btns = record.clickedButtons || [];
                    if (!btns.includes(btnName)) {
                        const updatedRecord = { ...record, clickedButtons: [...btns, btnName] };
                        sendToGoogleSheet(updatedRecord);
                        return updatedRecord;
                    }
                }
                return record;
            });
            setDb(updatedDb);
            localStorage.setItem('bodyTherapistDB', JSON.stringify(updatedDb));
        }
        if (url) {
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    };

    const handlePasswordSubmit = () => {
        if (passwordInput === ADMIN_PASSWORD) {
            setShowPasswordModal(false);
            setShowAdmin(true);
            setPasswordInput('');
        } else {
            alert('Неверный пароль!');
        }
    };

    const renderLanguage = () => {
        const em = (word) => <span style={{ color: 'var(--accent)' }}>{word}</span>;
        const offerHeadline = offerLang === 'kz'
            ? <>5 минутта {em('денсаулық')}, {em('қарым-қатынас')}, {em('ақшадағы')} мәселенің түпкі себебін тап!</>
            : <>За 5 минут найдите первопричину проблем со {em('здоровьем')}, в {em('отношениях')} и в {em('деньгах')}!</>;
        const offerCaption = offerLang === 'kz'
            ? <><span className="font-semibold">Телесный терапевт</span> — Жәнібек Мақаштың авторлық психосоматика және дене тесті</>
            : <><span className="font-semibold">Телесный терапевт</span> — авторский тест Жанибек Макаш по психосоматике и работе с телом</>;

        return (
        <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12 fade-in relative">
            <div className="max-w-[400px] w-full text-center">
                <div className="flex items-center justify-between mb-6">
                    <span className="badge">3 сферы · 8 шагов · 5 минут</span>
                    <div className="flex gap-1 p-1 rounded-full shrink-0" style={{ background: 'var(--surface-2)' }}>
                        {['kz', 'ru'].map(code => (
                            <button key={code} onClick={() => setOfferLang(code)}
                                    className="px-3 py-1 rounded-full text-[11px] font-semibold uppercase transition-colors"
                                    style={{
                                        background: offerLang === code ? 'var(--accent)' : 'transparent',
                                        color: offerLang === code ? 'var(--accent-ink)' : 'var(--ink-soft)',
                                    }}>
                                {code}
                            </button>
                        ))}
                    </div>
                </div>

                <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer"
                   className="eyebrow hover:opacity-70 transition-opacity inline-block mb-8" style={{ fontSize: 11 }}>
                    {INSTAGRAM_HANDLE}
                </a>

                <h1 className="display text-[28px] leading-tight">
                    {offerHeadline}
                </h1>

                <div className="flex items-center gap-3 mt-8 mb-8 text-left">
                    <img src={expertPhoto} alt="Жәнібек Мақаш"
                         className="w-14 h-16 rounded-xl object-cover shrink-0"
                         style={{ border: '1px solid var(--line)' }} />
                    <p className="text-[14px] leading-snug">
                        {offerCaption}
                    </p>
                </div>

                {/* та же фигура, что и на телесной карте результата — иконка с подсвеченными зонами */}
                <div className="relative w-[64px] mx-auto mb-7">
                    <svg viewBox="0 0 200 420" className="w-full h-auto" fill="none"
                         stroke="var(--figure)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
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
                        <circle cx="100" cy="107" r="30" fill="var(--heat)" opacity="0.5" style={{ filter: 'blur(9px)' }} stroke="none" />
                        <circle cx="68" cy="83" r="18" fill="var(--heat)" opacity="0.3" style={{ filter: 'blur(8px)' }} stroke="none" />
                        <circle cx="132" cy="83" r="18" fill="var(--heat)" opacity="0.3" style={{ filter: 'blur(8px)' }} stroke="none" />
                    </svg>
                </div>

                <div className="rule w-14 mx-auto my-9"></div>

                <p className="eyebrow eyebrow-soft mb-4">Тілді таңдаңыз · Выберите язык</p>

                <div className="space-y-3">
                    <button onClick={() => { setLang('ru'); setStep(1); }} className="btn btn-primary">
                        Русский
                    </button>
                    <button onClick={() => { setLang('kz'); setStep(1); }} className="btn btn-ghost">
                        Қазақша
                    </button>
                </div>
            </div>

            <button onClick={() => setShowPasswordModal(true)}
                    aria-label="Админка"
                    className="absolute bottom-4 muted opacity-40 hover:opacity-80 transition-opacity p-4">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                    <rect x="3" y="7" width="10" height="7" rx="2" />
                    <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
                </svg>
            </button>
        </div>
        );
    };

    const stepScreens = {
        3: ['healthTitle', 'healthDesc', 'health', 'healthPlace'],
        4: ['relTitle', 'relDesc', 'relationships', 'relPlace'],
        5: ['moneyTitle', 'moneyDesc', 'money', 'moneyPlace'],
        6: ['selfTitle', 'selfDesc', 'selfEsteem', 'selfPlace'],
        8: ['situationTitle', 'situationDesc', 'situation', 'situationPlace'],
    };

    // Крупная цифра шага — чтобы экран не выглядел пустым
    const stepMark = (n) => <div className="step-number mb-1">{String(n).padStart(2, '0')}</div>;

    const renderTextStep = (key) => {
        const [title, desc, field, place] = stepScreens[key];
        return (
            <div className="fade-in">
                {stepMark(key - 1)}
                <h2 className="display text-[27px] mb-3">{t[title]}</h2>
                <p className="muted text-[16px] leading-relaxed mb-5">{t[desc]}</p>
                <textarea className="field-input min-h-[180px] resize-none"
                          value={formData[field]}
                          onChange={e => handleInputChange(field, e.target.value)}
                          placeholder={t[place]}></textarea>
            </div>
        );
    };

    // Экран результата — отдельная страница: на большом экране в две колонки
    const renderResult = () => {
        if (isLoading) {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center px-8 fade-in">
                    <TypingLoader phrases={buildLoadingPhrases()} />
                </div>
            );
        }
        if (!reportHtml) return null;

        return (
            <div className="min-h-screen flex flex-col fade-in">
                <header className="sticky top-0 z-20 blur-bar" style={{ borderBottom: '1px solid var(--line)' }}>
                    <div className="mx-auto w-full max-w-[680px] xl:max-w-[1120px] px-6 md:px-10 pt-8 md:pt-6 pb-4 text-center">
                        <p className="eyebrow">{t.resultTitle}</p>
                        <p className="text-[15px] font-semibold mt-1">{formData.name}</p>
                    </div>
                </header>

                <main className="flex-1 w-full max-w-[680px] xl:max-w-[1120px] mx-auto px-6 md:px-10 py-6 md:py-10">
                    <div className="grid gap-5 xl:grid-cols-2 xl:items-start">
                        <div className="space-y-5">
                            <Summary bodyKey={bodyKey} lang={lang || 'ru'} extraZone={extraZone} delay={0}
                                     duration={isOwnOption(formData.time) ? formData.customTime : formData.time}
                                     emotions={[...formData.emotions, formData.customEmotion]} />
                            <div className="surface p-6 md:p-8 report fade-in" style={{ animationDelay: '90ms' }}
                                 dangerouslySetInnerHTML={{ __html: reportHtml }}></div>
                        </div>
                        <div className="space-y-5">
                            <BodyMap key={`${bodyKey}-${extraZone || 'x'}`} bodyKey={bodyKey} lang={lang || 'ru'} extraZone={extraZone} delay={140} />
                            <Chain steps={chain} lang={lang || 'ru'} delay={230} />
                            <Support items={support} lang={lang || 'ru'} delay={320} />
                            <Conclusion bodyKey={bodyKey} lang={lang || 'ru'} delay={410} />
                            <NextStep lang={lang || 'ru'} delay={500} />
                            <ShareCard bodyKey={bodyKey} extraZone={extraZone} lang={lang || 'ru'} delay={590} />
                        </div>
                    </div>
                </main>

                <footer className="sticky bottom-0 z-20 blur-bar" style={{ borderTop: '1px solid var(--line)' }}>
                    <div className="mx-auto w-full max-w-[680px] xl:max-w-[900px] px-6 md:px-10 py-4 md:py-5">
                        {(() => {
                            const l = lang || 'ru';
                            const ui = UI[l] || UI.ru;
                            const label = (PATTERN_LABEL[l] || PATTERN_LABEL.ru)[bodyKey] || (PATTERN_LABEL[l] || PATTERN_LABEL.ru).default;
                            return (
                                <div className="mb-4 text-center md:text-left">
                                    <p className="eyebrow mb-1">{ui.patternEyebrow}</p>
                                    <p className="text-[15.5px] leading-snug">
                                        <strong>{label}</strong> — {ui.patternSuffix}
                                    </p>
                                </div>
                            );
                        })()}
                        <div className="flex flex-col md:flex-row gap-3">
                            <button onClick={() => trackButtonClick('Консультация', LINK_CONSULTATION)}
                                    disabled={!LINK_CONSULTATION} className="btn btn-primary md:flex-1">
                                {t.consultBtn}
                            </button>
                            <button onClick={() => trackButtonClick('Бесплатные уроки', LINK_LESSONS)}
                                    disabled={!LINK_LESSONS} className="btn btn-ghost md:flex-1">
                                {t.lessonsBtn}
                            </button>
                        </div>
                    </div>
                </footer>
            </div>
        );
    };

    const renderStep = () => {
        if (step === 0) return renderLanguage();
        if (step === 11) return renderResult();

        const progress = ((step - 1) / TOTAL_STEPS) * 100;

        return (
            <div className="min-h-screen flex flex-col fade-in">
                <header className="sticky top-0 z-20 blur-bar">
                    <div className="mx-auto w-full max-w-[680px] px-6 md:px-10 pt-8 md:pt-6 pb-4">
                        <div className="flex items-center justify-between h-6">
                            {step > 1 ? (
                                <button onClick={prevStep} className="flex items-center text-[15px] muted hover:opacity-70 active:opacity-50 transition-opacity">
                                    <svg width="7" height="12" viewBox="0 0 7 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                                        <path d="M6 1 L1 6 L6 11" />
                                    </svg>
                                    {t.backBtn}
                                </button>
                            ) : <div />}
                            <span className="eyebrow">{step > 1 ? t.stepLabel(step - 1) : ''}</span>
                        </div>
                        {step > 1 && (
                            <div className="progress-track mt-4">
                                <div className="progress-fill" style={{ width: `${progress}%` }} />
                            </div>
                        )}
                    </div>
                </header>

                <main className="flex-1 w-full max-w-[680px] mx-auto px-6 md:px-10 py-8 md:py-12">
                    {step === 1 && (
                        <div className="fade-in">
                            <p className="eyebrow mb-4">{t.welcomeTitle}</p>
                            <h2 className="display text-[29px] md:text-[36px] mb-5">{t.welcomeDesc}</h2>
                            <p className="muted text-[16.5px] md:text-[18px] leading-relaxed mb-7">{t.welcomeDetails}</p>
                            <div className="surface-flat p-5 md:p-7 grid gap-3 sm:grid-cols-2">
                                {[t.healthTitle, t.relTitle, t.moneyTitle, t.selfTitle].map(item => (
                                    <div key={item} className="flex items-center text-[15px] md:text-[16px]">
                                        <span className="w-1.5 h-1.5 rounded-full mr-3 shrink-0" style={{ background: 'var(--accent)' }} />
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="fade-in">
                            {stepMark(1)}
                            <h2 className="display text-[27px] md:text-[33px] mb-6">{t.contactsTitle}</h2>
                            <div className="space-y-4 sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0">
                                <div>
                                    <label className="block eyebrow eyebrow-soft mb-2">{t.nameLabel}</label>
                                    <input type="text" className="field-input" value={formData.name} onChange={e => handleInputChange('name', e.target.value)} placeholder="Имя / Есіміңіз" />
                                </div>
                                <div>
                                    <label className="block eyebrow eyebrow-soft mb-2">{t.phoneLabel}</label>
                                    <input type="tel" className="field-input" value={formData.phone} onChange={e => handleInputChange('phone', e.target.value)} placeholder="+7 (707) 123-4567" />
                                </div>
                            </div>
                        </div>
                    )}

                    {stepScreens[step] && renderTextStep(step)}

                    {step === 7 && (
                        <div className="fade-in">
                            {stepMark(6)}
                            <h2 className="display text-[27px] md:text-[33px] mb-3">{t.timeTitle}</h2>
                            <p className="muted text-[16px] md:text-[17px] leading-relaxed mb-5">{t.timeDesc}</p>
                            <div className="surface overflow-hidden flex flex-col">
                                {t.timeOptions.map(opt => (
                                    <button key={opt} onClick={() => handleInputChange('time', opt)}
                                            className={`option-row ${formData.time === opt ? 'is-on' : ''}`}>
                                        {opt}
                                        {formData.time === opt && (
                                            <svg width="14" height="11" viewBox="0 0 14 11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M1 5.5 L5 9.5 L13 1.5" />
                                            </svg>
                                        )}
                                    </button>
                                ))}
                            </div>
                            {isOwnOption(formData.time) && (
                                <div className="fade-in mt-4">
                                    <input type="text" className="field-input" placeholder={t.customOptionPlace} value={formData.customTime} onChange={e => handleInputChange('customTime', e.target.value)} />
                                </div>
                            )}
                        </div>
                    )}

                    {step === 9 && (
                        <div className="fade-in">
                            {stepMark(8)}
                            <h2 className="display text-[27px] md:text-[33px] mb-3">{t.emotionsTitle}</h2>
                            <p className="muted text-[16px] md:text-[17px] leading-relaxed mb-5">{t.emotionsDesc}</p>
                            <div className="flex flex-wrap gap-2.5 mb-5">
                                {t.emotionOptions.map(emo => (
                                    <button key={emo} onClick={() => toggleEmotion(emo)}
                                            className={`chip ${formData.emotions.includes(emo) ? 'is-on' : ''}`}>
                                        {emo}
                                    </button>
                                ))}
                            </div>
                            <input type="text" className="field-input" placeholder={t.customOptionPlace} value={formData.customEmotion} onChange={e => handleInputChange('customEmotion', e.target.value)} />
                        </div>
                    )}

                    {step === 10 && (() => {
                        const ui = UI[lang || 'ru'] || UI.ru;
                        const options = ANSWER_OPTIONS[lang || 'ru'] || ANSWER_OPTIONS.ru;
                        return (
                            <div className="fade-in">
                                {stepMark(9)}
                                <h2 className="display text-[27px] md:text-[33px] mb-3">{ui.clarifyTitle}</h2>
                                <p className="muted text-[16px] md:text-[17px] leading-relaxed mb-5">{ui.clarifyDesc}</p>
                                <div className="space-y-3">
                                    {statements().map((text, i) => (
                                        <div key={i} className="surface p-5 md:p-6 md:flex md:items-center md:gap-6">
                                            <p className="text-[16px] md:text-[17px] leading-snug mb-4 md:mb-0 md:flex-1">{text}</p>
                                            <div className="flex gap-2 md:shrink-0">
                                                {options.map(opt => (
                                                    <button key={opt} onClick={() => setClarify(i, opt)}
                                                            className={`chip flex-1 md:flex-none md:min-w-[86px] ${formData.clarify[i] === opt ? 'is-on' : ''}`}>
                                                        {opt}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })()}
                </main>

                <footer className="sticky bottom-0 z-20 blur-bar" style={{ borderTop: '1px solid var(--line)' }}>
                    <div className="mx-auto w-full max-w-[680px] px-6 md:px-10 py-4 md:py-5">
                        {error && (
                            <div className="mb-3 flex items-start text-[#FB7185] text-[14px] leading-snug fade-in">
                                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" className="mt-[3px] mr-2 shrink-0">
                                    <circle cx="8" cy="8" r="6.6" />
                                    <path d="M8 4.6v4.2" strokeLinecap="round" />
                                    <circle cx="8" cy="11.4" r="0.8" fill="currentColor" stroke="none" />
                                </svg>
                                <span>{error}</span>
                            </div>
                        )}
                        <button onClick={handleNext} className="btn btn-primary md:max-w-[320px] md:mx-auto">
                            {step === 10 ? t.analyzeBtn : (step === 1 ? t.startBtn : t.nextBtn)}
                        </button>
                    </div>
                </footer>
            </div>
        );
    };

    if (showAdmin) {
        const search = adminSearch.trim().toLowerCase();
        const searchDigits = search.replace(/\D/g, '');
        const visibleRecords = db.slice().reverse().filter(record => {
            if (!search) return true;
            const nameMatch = (record.name || '').toLowerCase().includes(search);
            const phoneMatch = searchDigits && (record.phone || '').replace(/\D/g, '').includes(searchDigits);
            return nameMatch || phoneMatch;
        });

        return (
            <div className="min-h-screen page p-6 md:p-10 fade-in">
                <PrintableReport record={printingRecord} />
                <div className="max-w-3xl mx-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="display text-[24px]">Анкеты клиентов</h1>
                        <button onClick={() => setShowAdmin(false)} className="px-4 py-2 rounded-xl text-[14px] muted transition-colors" style={{ border: '1px solid var(--line)' }}>Выйти</button>
                    </div>

                    {db.length > 0 && (
                        <input type="text" className="field-input mb-6" placeholder="Поиск по имени или номеру телефона"
                               value={adminSearch} onChange={e => setAdminSearch(e.target.value)} />
                    )}

                    {db.length === 0 ? (
                        <p className="muted">Пока нет ни одной анкеты</p>
                    ) : visibleRecords.length === 0 ? (
                        <p className="muted">Ничего не найдено по запросу «{adminSearch}»</p>
                    ) : (
                        <div className="space-y-3 pb-20">
                            {visibleRecords.map((record) => {
                                const isOpen = expandedRecordId === record.id;
                                return (
                                    <div key={record.id} className="surface overflow-hidden">
                                        <button onClick={() => setExpandedRecordId(isOpen ? null : record.id)}
                                                className="w-full flex justify-between items-center gap-4 p-5 text-left">
                                            <div>
                                                <h3 className="text-[16px] font-semibold">{record.name || '—'}</h3>
                                                <p className="muted text-[14.5px] mt-0.5">{record.phone || '—'} · {record.date}</p>
                                            </div>
                                            <svg width="14" height="9" viewBox="0 0 14 9" fill="none" stroke="currentColor"
                                                 strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                                                 className="muted shrink-0 transition-transform"
                                                 style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }}>
                                                <path d="M1 1.5 L7 7.5 L13 1.5" />
                                            </svg>
                                        </button>

                                        {isOpen && (
                                            <div className="px-5 pb-5 fade-in" style={{ borderTop: '1px solid var(--line)' }}>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-[14px] leading-relaxed pt-5">
                                                    <div className="space-y-3">
                                                        <p><span className="eyebrow block mb-0.5">Здоровье</span> {record.health || '—'}</p>
                                                        <p><span className="eyebrow block mb-0.5">Отношения</span> {record.relationships || '—'}</p>
                                                        <p><span className="eyebrow block mb-0.5">Деньги</span> {record.money || '—'}</p>
                                                        <p><span className="eyebrow block mb-0.5">Самооценка</span> {record.selfEsteem || '—'}</p>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <p><span className="eyebrow block mb-0.5">Давность</span> {isOwnOption(record.time) ? record.customTime : (record.time || '—')}</p>
                                                        <p><span className="eyebrow block mb-0.5">Ситуация</span> {record.situation || '—'}</p>
                                                        <p><span className="eyebrow block mb-0.5">Эмоции</span> {record.emotions?.join(', ')} {record.customEmotion ? `(${record.customEmotion})` : ''}</p>
                                                        <p><span className="eyebrow block mb-0.5">Уточнения</span> {Object.values(record.clarify || {}).join(', ') || '—'}</p>
                                                        <p><span className="eyebrow block mb-0.5">Зоны напряжения</span> {[record.bodyKey, record.extraZone].filter(Boolean).join(', ') || '—'}</p>
                                                        <p><span className="eyebrow block mb-0.5">Цепочка</span> {(record.chain || []).join(' → ') || '—'}</p>
                                                        <p>
                                                            <span className="eyebrow block mb-0.5">Нажатые кнопки</span>
                                                            {record.clickedButtons?.length > 0 ? record.clickedButtons.join(' → ') : '—'}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="surface-flat p-5 mt-4 text-center">
                                                    <span className="eyebrow block mb-3">Телесная карта результата</span>
                                                    <BodyMapStatic bodyKey={record.bodyKey} extraZone={record.extraZone}
                                                                   strokeColor="var(--figure)" heatColor="var(--heat)"
                                                                   gradientId={`admin-${record.id}`} />
                                                    <p className="muted text-[13px] mt-3">
                                                        {[record.bodyKey, record.extraZone].filter(Boolean).join(', ') || '—'}
                                                    </p>
                                                </div>

                                                <div className="flex items-center justify-between gap-4 mt-5">
                                                    {record.result ? (
                                                        <details>
                                                            <summary className="text-[14px] accent-text cursor-pointer transition-opacity hover:opacity-70 outline-none">
                                                                Показать полную расшифровку
                                                            </summary>
                                                            <div className="mt-4 report surface-flat p-5 max-h-96 overflow-y-auto" dangerouslySetInnerHTML={{ __html: record.result }}></div>
                                                        </details>
                                                    ) : <span />}
                                                    <button onClick={() => setPrintingRecord(record)}
                                                            className="shrink-0 px-4 py-2 rounded-xl text-[13.5px] font-semibold transition-opacity hover:opacity-80"
                                                            style={{ border: '1px solid var(--line)' }}>
                                                        Скачать PDF
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <>
            {renderStep()}

            {showPasswordModal && (
                <div className="fixed inset-0 bg-black/35 backdrop-blur-sm z-50 flex items-center justify-center p-6 fade-in">
                    <div className="surface p-7 w-full max-w-[340px]">
                        <h3 className="display text-[19px] text-center mb-5">Вход в админку</h3>
                        <input type="password" className="field-input mb-4" placeholder="Пароль" value={passwordInput}
                               onChange={e => setPasswordInput(e.target.value)}
                               onKeyDown={e => { if (e.key === 'Enter') handlePasswordSubmit(); }} />
                        <div className="flex gap-3">
                            <button onClick={() => setShowPasswordModal(false)} className="btn btn-ghost flex-1 text-[15px]">Отмена</button>
                            <button onClick={handlePasswordSubmit} className="btn btn-primary flex-1 text-[15px]">Войти</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
