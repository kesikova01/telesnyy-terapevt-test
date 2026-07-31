import { useEffect, useState } from 'react';

// Фразы печатаются по букве — создаёт ощущение, что анализ
// собирается прямо сейчас, а не выводится по готовому шаблону.
export default function TypingLoader({ phrases, charDelay = 16, holdDelay = 380 }) {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState('');

  useEffect(() => {
    setIndex(0);
    setText('');
  }, [phrases]);

  useEffect(() => {
    if (index >= phrases.length) return undefined;
    const full = phrases[index];

    if (text.length < full.length) {
      const id = setTimeout(() => setText(full.slice(0, text.length + 1)), charDelay);
      return () => clearTimeout(id);
    }

    if (index < phrases.length - 1) {
      const id = setTimeout(() => { setIndex(index + 1); setText(''); }, holdDelay);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [text, index, phrases, charDelay, holdDelay]);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex gap-1.5" aria-hidden="true">
        {[0, 1, 2].map(i => (
          <span key={i} className="loader-dot" style={{ animationDelay: `${i * 0.18}s` }} />
        ))}
      </div>
      <p className="text-[16px] muted text-center min-h-[48px] max-w-[340px] leading-relaxed">
        {text}<span className="typing-cursor">|</span>
      </p>
    </div>
  );
}
