import { useState } from 'react';
import Gallery from './Gallery.jsx';
import Editor from './Editor.jsx';

export default function App() {
  const [tpl, setTpl] = useState(null);

  return (
    <>
      <header className="topbar">
        <button className="wordmark" onClick={() => setTpl(null)}>loose leaf</button>
        <p className="topnote">carousels that look handled</p>
      </header>

      {tpl
        // key resets every photo, word and page when the template changes
        ? <Editor key={tpl.template.id} tpl={tpl} onBack={() => setTpl(null)} />
        : <Gallery onPick={setTpl} />}
    </>
  );
}
