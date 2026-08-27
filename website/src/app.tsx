import { MDXProvider } from '@mdx-js/react';
import { useEffect, useState } from 'react';
import { chapters } from './chapters';
import { Sandpack } from './sandpack';

const mdxComponents = { Sandpack };

function slugFromHash(): string {
  return window.location.hash.replace(/^#\/?/, '');
}

export function App() {
  const [slug, setSlug] = useState(slugFromHash);

  useEffect(() => {
    const onHashChange = () => setSlug(slugFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const index = Math.max(
    0,
    chapters.findIndex((c) => c.slug === slug)
  );
  const chapter = chapters[index];
  const previous = chapters[index - 1];
  const next = chapters[index + 1];

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-title">Minecraft-like Workshop</div>
        <nav>
          {chapters.map((c, i) => (
            <a key={c.slug} href={`#/${c.slug}`} className={i === index ? 'active' : ''}>
              <span className="nav-number">{c.nav}</span> {c.title}
            </a>
          ))}
        </nav>
      </aside>

      <main className="content" key={chapter.slug}>
        <h1>{chapter.title}</h1>
        {chapter.description && <p className="description">{chapter.description}</p>}

        <MDXProvider components={mdxComponents}>
          <chapter.Content />
        </MDXProvider>

        <div className="pagination">
          {previous ? <a href={`#/${previous.slug}`}>← {previous.title}</a> : <span />}
          {next ? <a href={`#/${next.slug}`}>{next.title} →</a> : <span />}
        </div>
      </main>
    </div>
  );
}
