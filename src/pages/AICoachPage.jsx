import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../lib/api";

export function AICoachPage() {
  const { t } = useTranslation();

  const [modules, setModules] = useState([]);
  const [contextOpen, setContextOpen] = useState(false);

  // null = Auto (recommended)
  const [selectedModuleId, setSelectedModuleId] = useState(null);

  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);

  const [result, setResult] = useState(null);
  // result shape:
  // {
  //   answer, takeaways, nextStep,
  //   notice,
  //   context: { requestedModule, usedModules },
  //   suggestedModules: [{id,title}]
  // }

  const selectedLabel = useMemo(() => {
    if (!selectedModuleId) return "Auto (recommended)";
    const m = modules.find((x) => x.id === selectedModuleId);
    return m ? m.title : "Selected module";
  }, [selectedModuleId, modules]);

  // Load role-accessible modules + hasContent
  useEffect(() => {
    (async () => {
      const data = await apiFetch("/api/ai/context-options");
      setModules(data.modules || []);
    })().catch((e) => console.error("AI context-options failed:", e));
  }, []);

  const ask = async () => {
    if (!question.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const data = await apiFetch("/api/ai/coach", {
        method: "POST",
        body: {
          question: question.trim(),
          moduleId: selectedModuleId, // null => Auto
        },
      });
      setResult(data);
    } catch (e) {
      console.error(e);
      setResult({
        answer: "",
        takeaways: [],
        nextStep: "",
        notice: e?.message || "Failed to get AI response",
        context: { requestedModule: null, usedModules: [] },
        suggestedModules: [],
      });
    } finally {
      setLoading(false);
    }
  };

  // IMPORTANT: name cannot start with "use" (eslint thinks it's a hook)
  const selectSuggestedModule = (mid) => {
    setSelectedModuleId(mid);
    setContextOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold">{t("pages.aiCoachTitle") || "AI Coach"}</h1>
        <p className="text-sm text-slate-600">Your personal training assistant</p>
        <p className="mt-1 text-xs text-slate-500">
          Context: <span className="font-semibold text-slate-700">{selectedLabel}</span>
        </p>
      </div>

      {/* Context selector (collapsed by default) */}
      <div className="card p-4">
        <button
          type="button"
          className="w-full flex items-center justify-between text-sm font-semibold"
          onClick={() => setContextOpen((v) => !v)}
        >
          <span>Context Module (optional)</span>
          <span className="text-slate-500">{contextOpen ? "▲" : "▼"}</span>
        </button>

        {contextOpen ? (
          <div className="mt-3 space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                checked={selectedModuleId === null}
                onChange={() => setSelectedModuleId(null)}
              />
              <span>Auto (recommended)</span>
            </label>

            <div className="mt-2 grid gap-2">
              {modules.map((m) => (
                <label key={m.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={selectedModuleId === m.id}
                      onChange={() => setSelectedModuleId(m.id)}
                    />
                    <span>{m.title}</span>
                  </span>
                  <span className="text-xs text-slate-500">
                    {m.hasContent ? "content ✓" : "no content"}
                  </span>
                </label>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {/* Main input */}
      <div className="card p-4 space-y-3">
        <p className="text-sm font-semibold">How can I help you today?</p>

        <textarea
          className="input-brand h-28"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask about the module, what to review, or what to do next..."
        />

        <div className="flex justify-end">
          <button className="btn-primary" type="button" disabled={loading} onClick={ask}>
            {loading ? "Thinking…" : "Ask AI Coach"}
          </button>
        </div>
      </div>

      {/* Notice (Case C improved) */}
      {result?.notice ? (
        <div className="card p-4 border border-amber-200 bg-amber-50">
          <p className="text-sm font-semibold text-amber-900">Notice</p>
          <p className="mt-1 text-sm text-amber-900">{result.notice}</p>

          {Array.isArray(result.suggestedModules) && result.suggestedModules.length > 0 ? (
            <div className="mt-3">
              <p className="text-xs font-semibold text-amber-900">Try one of these modules:</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {result.suggestedModules.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className="btn-outline-sm"
                    onClick={() => selectSuggestedModule(m.id)}
                    title="Use this module as context"
                  >
                    Use: {m.title}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Response cards */}
      {result?.answer ? (
        <div className="grid gap-3">
          <div className="card p-4">
            <p className="text-sm font-semibold">Answer</p>
            <p className="mt-2 text-sm text-slate-800 whitespace-pre-wrap">{result.answer}</p>
          </div>

          <div className="card p-4">
            <p className="text-sm font-semibold">Key Takeaways</p>
            <ul className="mt-2 list-disc pl-5 text-sm text-slate-800">
              {(result.takeaways || []).map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </div>

          <div className="card p-4">
            <p className="text-sm font-semibold">Next Step</p>
            <p className="mt-2 text-sm text-slate-800">{result.nextStep}</p>
          </div>
        </div>
      ) : null}

      {/* Footer */}
      <p className="text-center text-xs text-slate-400">Powered by your training content</p>
    </div>
  );
}
