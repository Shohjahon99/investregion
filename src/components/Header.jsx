import { useState } from 'react';
import { useApp, go } from '../store.jsx';
import { LANGS } from '../i18n.js';

const NAV = ['map', 'specs', 'compare', 'calc', 'finder', 'offers', 'rating', 'method', 'api', 'admin'];

export default function Header({ path }) {
  const { t, lang, setLang, compare } = useApp();
  const [open, setOpen] = useState(false);
  return (
    <header className="hdr">
      <div className="hdr-in">
        <a className="logo" href="#/">
          <span className="logo-mark">
            <svg viewBox="0 0 32 32" width="30" height="30"><rect width="32" height="32" rx="8" fill="var(--brand)" /><path d="M7 22l6-7 5 4 7-9" stroke="#fff" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /><circle cx="25" cy="10" r="2.4" fill="#5eead4" /></svg>
          </span>
          <span><b>{t('brand')}</b><small>{t('brandSub')}</small></span>
        </a>
        <nav className={open ? 'nav open' : 'nav'} onClick={() => setOpen(false)}>
          {NAV.map((n) => (
            <a key={n} href={`#/${n}`} className={path === n ? 'on' : ''}>
              {t('nav_' + n)}{n === 'compare' && compare.length > 0 && <span className="pill">{compare.length}</span>}
            </a>
          ))}
        </nav>
        <div className="hdr-r">
          <div className="lang">
            {LANGS.map((l) => <button key={l.id} className={lang === l.id ? 'on' : ''} onClick={() => setLang(l.id)}>{l.id.toUpperCase()}</button>)}
          </div>
          <button className="burger" onClick={() => setOpen(!open)} aria-label="menu">☰</button>
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  const { t } = useApp();
  return (
    <footer className="ftr">
      <div className="wrap ftr-in">
        <div><b>{t('brand')}</b> — {t('brandSub')}<br /><small>{t('footer')}</small></div>
        <div className="ftr-links">
          <a onClick={() => go('method')}>{t('nav_method')}</a><a onClick={() => go('api')}>{t('nav_api')}</a><a onClick={() => go('admin')}>{t('nav_admin')}</a>
          <small>{t('footerData')}</small>
        </div>
      </div>
    </footer>
  );
}
