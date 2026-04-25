const LEGACY_SCRIPTS = [
  '/legacy/math-engine.js',
  '/legacy/calc-engine.js',
  '/legacy/expression-engine.js',
  '/legacy/root-engine.js',
] as const;

let loadPromise: Promise<void> | null = null;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[data-legacy-engine="${src}"]`,
    );

    if (existing?.dataset.loaded === 'true') {
      resolve();
      return;
    }

    if (existing) {
      existing.remove();
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.dataset.legacyEngine = src;

    script.addEventListener('load', () => {
      script.dataset.loaded = 'true';
      resolve();
    });
    script.addEventListener('error', () => {
      script.remove();
      reject(new Error(`Failed to load legacy engine script: ${src}`));
    });

    document.head.appendChild(script);
  });
}

export function loadLegacyEngines(): Promise<void> {
  if (!loadPromise) {
    loadPromise = LEGACY_SCRIPTS.reduce(
      (chain, src) => chain.then(() => loadScript(src)),
      Promise.resolve(),
    )
      .then(() => {
        if (!window.RootEngine) {
          throw new Error('RootEngine did not initialize after legacy scripts loaded.');
        }
      })
      .catch((error) => {
        loadPromise = null;
        throw error;
      });
  }

  return loadPromise;
}
