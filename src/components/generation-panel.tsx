import { useState } from "react";

import type { WorldAssets } from "@/lib/worldlabs/schemas";

const DEFAULT_WORLD_PROMPT =
  "A compact abandoned orbital greenhouse converted into an indie game level, with a clear entrance, a central observation platform, walkable concrete paths, dense overgrown planters, and one visibly narrow maintenance passage connecting two open areas. Realistic scale, coherent continuous floor, no people, no text or signs.";

type GenerationPanelProps = {
  assets: WorldAssets | null;
  message?: string | null;
  isGenerating?: boolean;
  generationProgress?: string | null;
  generationError?: string | null;
  onGenerate?(prompt: string): void;
};

export function GenerationPanel({
  assets,
  message,
  isGenerating = false,
  generationProgress,
  generationError,
  onGenerate,
}: GenerationPanelProps) {
  const [prompt, setPrompt] = useState(DEFAULT_WORLD_PROMPT);

  return (
    <section className="rail-section source-section" aria-labelledby="source-title">
      <div className="section-index">01 / Source</div>
      <h2 id="source-title">World under test</h2>
      <div className="source-readout">
        <span className="source-signal" aria-hidden="true" />
        <div>
          <strong>
            {message || assets?.displayName || "Calibration threshold"}
          </strong>
          <p>
            {assets
              ? "World Labs Marble / live assets"
              : "Deterministic local collider / system check"}
          </p>
        </div>
      </div>
      <dl className="source-metadata">
        <div>
          <dt>Visual</dt>
          <dd>{assets ? "SPZ 500K" : "Synthetic"}</dd>
        </div>
        <div>
          <dt>Geometry</dt>
          <dd>{assets ? "Marble GLB" : "Three.js"}</dd>
        </div>
        <div>
          <dt>Units</dt>
          <dd>Metres</dd>
        </div>
      </dl>

      {assets?.marbleUrl ? (
        <a
          className="marble-link"
          href={assets.marbleUrl}
          target="_blank"
          rel="noreferrer"
        >
          Open in Marble <span aria-hidden="true">↗</span>
        </a>
      ) : null}

      {onGenerate ? (
        <details className="generation-drawer">
          <summary>Generate another world</summary>
          <label>
            <span>World prompt</span>
            <textarea
              aria-label="World prompt"
              value={prompt}
              rows={4}
              maxLength={1_500}
              onChange={(event) => setPrompt(event.currentTarget.value)}
            />
          </label>
          <button
            type="button"
            onClick={() => onGenerate(prompt)}
            disabled={isGenerating || !prompt.trim()}
          >
            {isGenerating ? "Generating world" : "Generate with Marble"}
          </button>
          {generationProgress ? (
            <p className="generation-progress" role="status">
              {generationProgress}
            </p>
          ) : null}
          {generationError ? (
            <p className="generation-error" role="alert">
              {generationError}
            </p>
          ) : null}
        </details>
      ) : null}
    </section>
  );
}
