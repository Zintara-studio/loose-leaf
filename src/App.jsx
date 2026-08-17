import { useState } from 'react';
import Logo from './Logo.jsx';
import Gallery from './Gallery.jsx';
import Editor from './Editor.jsx';

export default function App() {
  const [tpl, setTpl] = useState(null);

  return (
    <>
      <header className="topbar">
        <button className="wordmark" onClick={() => setTpl(null)}
          aria-label="Loose Leaf, back to the shelf">
          <Logo />
          <span>loose leaf</span>
        </button>
        <p className="topnote">carousels that look handled</p>
      </header>

      {tpl
        // key resets every photo, word and page when the template changes
        ? <Editor key={tpl.template.id} tpl={tpl} onBack={() => setTpl(null)} />
        : <Gallery onPick={setTpl} />}
    </>
  );
}
