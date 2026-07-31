// Видео играется прямо на странице через встроенный YouTube-плеер (iframe) —
// пауза, перемотка и звук работают как в самом Ютубе, но пользователь
// не покидает сайт. Пока youtubeId пустой — показываем аккуратную заглушку.
export default function LessonPlayer({ youtubeId, title, placeholder }) {
    if (!youtubeId) {
        return (
            <div className="surface-flat flex items-center justify-center text-center px-6"
                 style={{ aspectRatio: '16 / 9' }}>
                <div>
                    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" stroke="var(--ink-soft)"
                         strokeWidth="1.4" className="mx-auto mb-2" style={{ opacity: 0.6 }}>
                        <circle cx="15" cy="15" r="12" />
                        <path d="M12 10.5 L20 15 L12 19.5 Z" fill="var(--ink-soft)" stroke="none" />
                    </svg>
                    <p className="text-[13px] muted">{placeholder}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-2xl overflow-hidden" style={{ aspectRatio: '16 / 9' }}>
            <iframe
                className="w-full h-full"
                src={`https://www.youtube-nocookie.com/embed/${youtubeId}`}
                title={title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
            />
        </div>
    );
}
