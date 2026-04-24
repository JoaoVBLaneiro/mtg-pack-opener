import { useState } from "react";
import Button from "../components/common/Button";
import {
  preloadSetFromUI,
  generateRuleFromUI,
  bootstrapSetFromUI,
  type SetLoaderResponse,
} from "../api/setLoader";

export default function SetLoaderPage() {
  const [setCode, setSetCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SetLoaderResponse | null>(null);
  const [error, setError] = useState("");

  async function runAction(
    action: (setCode: string) => Promise<SetLoaderResponse>
  ) {
    const code = setCode.trim().toLowerCase();
    if (!code) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const data = await action(code);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="panel">
        <h2>Load Sets</h2>
        <p className="muted">
          Type a set code like lea, mir, tmp, usg, or eoe.
        </p>

        {error && <div className="error-box">{error}</div>}

        <div className="form-row" style={{ marginBottom: 16 }}>
          <input
            placeholder="Set code, e.g. eoe"
            value={setCode}
            onChange={(e) => setSetCode(e.target.value)}
          />

          <Button
            onClick={() => runAction(preloadSetFromUI)}
            disabled={loading}
          >
            Preload Set
          </Button>

          <button
            className="secondary-btn"
            type="button"
            onClick={() => runAction(generateRuleFromUI)}
            disabled={loading}
          >
            Generate Rule
          </button>

          <button
            className="secondary-btn"
            type="button"
            onClick={() => runAction(bootstrapSetFromUI)}
            disabled={loading}
          >
            Bootstrap Set
          </button>
        </div>

        {loading && <p className="loading">Working...</p>}

        {result && (
          <div className="info-grid" style={{ marginTop: 18 }}>
            <div className="info-card">
              <div className="info-card__label">Set code</div>
              <div className="info-card__value">
                {(result.set_code || result.preload?.set_code || "").toUpperCase()}
              </div>
            </div>

            <div className="info-card">
              <div className="info-card__label">Set name</div>
              <div className="info-card__value">
                {result.set_name || result.preload?.set_name || "—"}
              </div>
            </div>

            <div className="info-card">
              <div className="info-card__label">Imported cards</div>
              <div className="info-card__value">
                {result.imported_count ?? result.preload?.imported_count ?? "—"}
              </div>
            </div>

            <div className="info-card">
              <div className="info-card__label">Rule path</div>
              <div className="info-card__value">{result.rule_path || "—"}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}