"use client";

import { useMemo, useState } from "react";
import { CARDIAC_FLAGS, REASSURING_FLAGS } from "@/lib/triage";
import { FlagDef, RiskTier, TriageResult } from "@/lib/types";

const SECTIONS: { title: string; hint: string; flags: FlagDef[] }[] = [
  {
    title: "History — cardiac",
    hint: "Check anything present in the child's history.",
    flags: CARDIAC_FLAGS.filter((f) => f.group === "cardiacHistory")
  },
  {
    title: "Pain characteristics — cardiac",
    hint: "How the pain itself behaves.",
    flags: CARDIAC_FLAGS.filter((f) => f.group === "cardiacPain")
  },
  {
    title: "Exam findings — cardiac",
    hint: "Only check what was actually examined and found.",
    flags: CARDIAC_FLAGS.filter((f) => f.group === "cardiacExam")
  },
  {
    title: "History — reassuring",
    hint: "Features that point away from a cardiac cause.",
    flags: REASSURING_FLAGS.filter((f) => f.group === "reassuringHistory")
  },
  {
    title: "Pain characteristics — reassuring",
    hint: "",
    flags: REASSURING_FLAGS.filter((f) => f.group === "reassuringPain")
  },
  {
    title: "Exam findings — reassuring",
    hint: "",
    flags: REASSURING_FLAGS.filter((f) => f.group === "reassuringExam")
  }
];

const TIER_LABEL: Record<RiskTier, string> = {
  high: "High risk — cardiac red flag present",
  indeterminate: "Indeterminate — not yet reassuring",
  low: "Low risk — likely non-cardiac"
};

export default function Home() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [childAge, setChildAge] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<{ result: TriageResult; explanation: string | null } | null>(null);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedFlagIds: Array.from(selected),
          childAge,
          notes
        })
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = await res.json();
      setResponse(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = useMemo(() => !loading, [loading]);

  return (
    <main className="page">
      <div className="masthead">
        <h1>Pediatric chest pain triage</h1>
        <p>
          A red-flag checklist for distinguishing cardiac from non-cardiac (musculoskeletal or
          psychogenic) chest pain in children, with a plain-language explanation of the result.
        </p>
      </div>

      <div className="section">
        <h2>Child</h2>
        <div className="hint">Optional, used only to phrase the explanation.</div>
        <input
          className="text-input age-input"
          placeholder="Age, e.g. 11"
          value={childAge}
          onChange={(e) => setChildAge(e.target.value)}
        />
      </div>

      {SECTIONS.map((section) => (
        <div className="section" key={section.title}>
          <h2>{section.title}</h2>
          {section.hint && <div className="hint">{section.hint}</div>}
          {section.flags.map((flag) => (
            <div className="field-row" key={flag.id}>
              <input
                type="checkbox"
                id={flag.id}
                checked={selected.has(flag.id)}
                onChange={() => toggle(flag.id)}
              />
              <label htmlFor={flag.id}>{flag.label}</label>
            </div>
          ))}
        </div>
      ))}

      <div className="section">
        <h2>Additional context</h2>
        <div className="hint">Anything else relevant — this does not change the tier, only the explanation.</div>
        <textarea
          className="text-input"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional free text"
        />
      </div>

      <div className="submit-row">
        <button className="primary" onClick={submit} disabled={!canSubmit}>
          {loading ? "Assessing..." : "Run triage"}
        </button>
        {error && <span className="status-text">{error}</span>}
      </div>

      {response && (
        <div className="result">
          <span className={`tier-badge tier-${response.result.tier}`}>{TIER_LABEL[response.result.tier]}</span>

          <div className={`result-panel tier-${response.result.tier}`}>
            <h3>{response.result.headline}</h3>
            <p>{response.result.recommendation}</p>

            {response.result.cardiacFlagsMatched.length > 0 && (
              <div className="matched-flags">
                <h4>Cardiac red flags matched</h4>
                <ul>
                  {response.result.cardiacFlagsMatched.map((f) => (
                    <li key={f.id}>{f.label}</li>
                  ))}
                </ul>
              </div>
            )}

            {response.result.reassuringFlagsMatched.length > 0 && (
              <div className="matched-flags">
                <h4>Reassuring features matched</h4>
                <ul>
                  {response.result.reassuringFlagsMatched.map((f) => (
                    <li key={f.id}>{f.label}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {response.explanation && (
            <div className="explanation">
              <h4>Plain-language explanation</h4>
              <p>{response.explanation}</p>
            </div>
          )}
        </div>
      )}

      <div className="disclaimer">
        This tool is a clinical decision-support prototype based on a published red-flag checklist.
        It does not diagnose, and it does not replace in-person evaluation by a qualified clinician.
        Any concerning symptom — especially exertional pain, syncope, or palpitations — warrants
        prompt medical assessment regardless of this tool's output.
      </div>
    </main>
  );
}
