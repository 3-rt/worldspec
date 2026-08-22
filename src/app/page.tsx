export default function Home() {
  return (
    <main
      aria-label="WorldSpec analysis workspace"
      className="app-shell"
    >
      <header className="masthead">
        <div className="wordmark" aria-label="WorldSpec">
          <span aria-hidden="true" className="wordmark-mark">
            WS
          </span>
          <h1>WorldSpec</h1>
        </div>
        <div className="event-label">
          <span>Ignition Hacks V7</span>
          <span>Spatial QA / 001</span>
        </div>
      </header>

      <section className="intro" aria-labelledby="intro-title">
        <p className="eyebrow">Functional verification for generated space</p>
        <h2 id="intro-title">Prove the world works.</h2>
        <p className="intro-copy">
          Generate with Marble. Inspect the collider. Test the route. See the
          exact place a beautiful world stops being usable.
        </p>
      </section>

      <section className="initializing-panel" aria-label="Application status">
        <span className="status-light" aria-hidden="true" />
        <span>Workspace initializing</span>
        <span className="status-code">SYS / READY</span>
      </section>
    </main>
  );
}
