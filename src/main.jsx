import React from 'react';
import ReactDOM from 'react-dom/client';

// Шрифты — из папки проекта, а не с чужих серверов
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/lora/500.css';
import '@fontsource/lora/600.css';
import '@fontsource/ibm-plex-mono/500.css';

import './styles.css';
import App from './App';
import LessonsPage from './components/LessonsPage';

// /lessons — отдельный мини-сайт с бесплатными уроками, минуя сам тест.
// Работает благодаря SPA-редиректу в vercel.json и serve.mjs (любой путь → index.html).
const isLessonsPage = window.location.pathname.replace(/\/+$/, '') === '/lessons';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isLessonsPage ? <LessonsPage /> : <App />}
  </React.StrictMode>
);
