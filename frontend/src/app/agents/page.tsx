"use client";
import { useState } from "react";

const API_URL = "http://localhost:8000";

const AGENTS = [
  { id: "research", label: "Research", icon: "🔍", color: "#3b82f6", x: 50, y: 15 },
  { id: "gost",     label: "ГОСТ",     icon: "📜", color: "#8b5cf6", x: 15, y: 45 },
  { id: "cyber",    label: "КиберЛенинка", icon: "🎓", color: "#06b6d4", x: 85, y: 45 },
  { id: "tavily",   label: "Tavily",   icon: "🌐", color: "#10b981", x: 50, y: 60 },
  { id: "gpt",      label: "GPT-4o",   icon: "🧠", color: "#f59e0b", x: 50, y: 85 },
  { id: "design",   label: "Design",   icon: "✏️",  color: "#ef4444", x: 15, y: 75 },
  { id: "library",  label: "Библиотека", icon: "📚", color: "#84cc16", x: 85, y: 75 },
];

const CONNECTIONS = [
  ["research", "gost"], ["research", "cyber"], ["research", "tavily"],
  ["gost", "gpt"], ["cyber", "gpt"], ["tavily", "gpt"],
  ["gpt", "design"], ["gpt", "library"],
];

interface ResearchResult {
  title: string;
  description: string;
  source_url: string;
  source: string;
  tags: string;
  confidence_score: number;
  saved: boolean;
}

function MissionControl({ activeAgents, statusMsg }: { activeAgents: Set<string>; statusMsg: string }) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500 uppercase tracking-wider">Mission Control</span>
        <span className={`text-xs ${activeAgents.size > 0 ? "text-blue-400 animate-pulse" : "text-gray-500"}`}>
          {statusMsg}
        </span>
      </div>
      <div className="relative w-full bg-gray-950 rounded-xl border border-gray-800 overflow-hidden" style={{ height: 260 }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle, #3b82f6 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {CONNECTIONS.map(([from, to], i) => {
            const f = AGENTS.find(a => a.id === from)!;
            const t = AGENTS.find(a => a.id === to)!;
            const isActive = activeAgents.has(from) || activeAgents.has(to);
            return (
              <line key={i}
                x1={f.x} y1={f.y} x2={t.x} y2={t.y}
                stroke={isActive ? "#3b82f6" : "rgba(255,255,255,0.06)"}
                strokeWidth={isActive ? "0.5" : "0.2"}
                style={{ transition: "all 0.5s" }}
              />
            );
          })}
        </svg>
        {AGENTS.map(agent => {
          const isActive = activeAgents.has(agent.id);
          return (
            <div key={agent.id}
              className="absolute flex flex-col items-center gap-1"
              style={{ left: `${agent.x}%`, top: `${agent.y}%`, transform: "translate(-50%, -50%)" }}>
              <div className="relative w-10 h-10 rounded-full flex items-center justify-center text-base"
                style={{
                  background: isActive ? `${agent.color}33` : "rgba(20,20,30,0.95)",
                  border: `1.5px solid ${isActive ? agent.color : "rgba(255,255,255,0.1)"}`,
                  boxShadow: isActive ? `0 0 18px ${agent.color}99` : "none",
                  transition: "all 0.4s ease"
                }}>
                {agent.icon}
                {isActive && (
                  <span className="absolute inset-0 rounded-full animate-ping opacity-20"
                    style={{ background: agent.color }} />
                )}
              </div>
              <span style={{ fontSize: 9, color: isActive ? "#fff" : "#6b7280", textAlign: "center", lineHeight: 1.2 }}>
                {agent.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AgentsPage() {
  const [query, setQuery] = useState("");
  const [tzTitle, setTzTitle] = useState("");
  const [maxResults, setMaxResults] = useState(10);
  const [autoSave, setAutoSave] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingTZ, setLoadingTZ] = useState(false);
  const [results, setResults] = useState<ResearchResult[]>([]);
  const [error, setError] = useState("");
  const [logs, setLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"search" | "design" | "logs">("search");
  const [activeAgents, setActiveAgents] = useState<Set<string>>(new Set());
  const [statusMsg, setStatusMsg] = useState("Система готова к работе");
  const [tzResult, setTzResult] = useState<any>(null);

  const animateResearch = () => {
    const steps: { agents: string[]; msg: string; delay: number }[] = [
      { agents: ["research"], msg: "Research Agent анализирует запрос...", delay: 0 },
      { agents: ["research", "gost", "cyber", "tavily"], msg: "Параллельный поиск: ГОСТ + КиберЛенинка + Tavily...", delay: 600 },
      { agents: ["gost", "cyber", "tavily", "gpt"], msg: "GPT-4o ранжирует найденные документы...", delay: 2000 },
      { agents: ["gpt", "library"], msg: "Сохранение в библиотеку...", delay: 3500 },
      { agents: [], msg: "✅ Поиск завершён", delay: 5000 },
    ];
    steps.forEach(({ agents, msg, delay }) => {
      setTimeout(() => {
        setActiveAgents(new Set(agents));
        setStatusMsg(msg);
      }, delay);
    });
  };

  const animateDesign = () => {
    const steps: { agents: string[]; msg: string; delay: number }[] = [
      { agents: ["design"], msg: "Design Agent читает библиотеку...", delay: 0 },
      { agents: ["design", "library"], msg: "Извлечение технических требований...", delay: 1000 },
      { agents: ["design", "gpt"], msg: "GPT-4o генерирует разделы ТЗ...", delay: 2500 },
      { agents: ["gpt", "design"], msg: "Финализация технического задания...", delay: 8000 },
      { agents: [], msg: "✅ ТЗ сгенерировано", delay: 13000 },
    ];
    steps.forEach(({ agents, msg, delay }) => {
      setTimeout(() => {
        setActiveAgents(new Set(agents));
        setStatusMsg(msg);
      }, delay);
    });
  };

  const handleResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    setLoading(true);
    setError("");
    setResults([]);
    animateResearch();
    try {
      const res = await fetch(`${API_URL}/api/agents/research`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, max_results: maxResults, auto_save: autoSave }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.detail || "Ошибка агента");
      else setResults(data);
    } catch { setError("Не удалось подключиться к серверу"); }
    setLoading(false);
  };

  const handleDesign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tzTitle) return;
    setLoadingTZ(true);
    setError("");
    setTzResult(null);
    animateDesign();
    try {
      const res = await fetch(`${API_URL}/api/agents/design`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: tzTitle }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.detail || "Ошибка агента");
      else setTzResult(data);
    } catch { setError("Не удалось подключиться к серверу"); }
    setLoadingTZ(false);
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch(`${API_URL}/api/agents/logs`);
      setLogs(await res.json());
    } catch {}
  };

  const scoreBar = (score: number) => {
    const w = Math.round(score * 100);
    const color = score >= 0.8 ? "bg-green-500" : score >= 0.6 ? "bg-yellow-500" : "bg-red-500";
    const textColor = score >= 0.8 ? "text-green-400" : score >= 0.6 ? "text-yellow-400" : "text-red-400";
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-gray-700 rounded-full">
          <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${w}%` }} />
        </div>
        <span className={`text-xs font-mono ${textColor}`}>{w}%</span>
      </div>
    );
  };

  return (
    <div className="max-w-5xl">
      <h1 className="text-3xl font-bold text-white mb-2">🤖 AI-агенты</h1>
      <p className="text-gray-400 mb-6">Mission Control — управление агентами в реальном времени</p>

      <MissionControl activeAgents={activeAgents} statusMsg={statusMsg} />

      {/* Табы */}
      <div className="flex gap-2 mb-6">
        {(["search", "design", "logs"] as const).map(tab => (
          <button key={tab}
            onClick={() => { setActiveTab(tab); if (tab === "logs") fetchLogs(); }}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"
            }`}>
            {tab === "search" ? "🔍 Research" : tab === "design" ? "✏️ Design" : "📋 Логи"}
          </button>
        ))}
      </div>

      {/* Research */}
      {activeTab === "search" && (
        <>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">Research Agent</h2>
            <form onSubmit={handleResearch} className="space-y-4">
              <textarea rows={3}
                placeholder="ГОСТ выпрямители тяговых подстанций требования"
                value={query} onChange={e => setQuery(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
                required />
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <label className="text-gray-400 text-sm">Результатов:</label>
                  <select value={maxResults} onChange={e => setMaxResults(Number(e.target.value))}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm">
                    {[5, 10, 15, 20].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                  <input type="checkbox" checked={autoSave} onChange={e => setAutoSave(e.target.checked)} className="accent-blue-500" />
                  Автосохранять (confidence ≥ 50%)
                </label>
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button type="submit" disabled={loading || !query}
                className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                {loading ? <><span className="animate-spin inline-block">⏳</span> Агент работает...</> : "🚀 Запустить поиск"}
              </button>
            </form>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { icon: "📜", name: "ГОСТ / Росстандарт", desc: "protect.gost.ru" },
              { icon: "🎓", name: "КиберЛенинка", desc: "2M+ научных статей" },
              { icon: "🌐", name: "Tavily (Рунет)", desc: "docs.cntd.ru и др." },
            ].map(s => (
              <div key={s.name} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <div className="text-xl mb-2">{s.icon}</div>
                <div className="text-white text-sm font-medium">{s.name}</div>
                <div className="text-gray-500 text-xs mt-1">{s.desc}</div>
              </div>
            ))}
          </div>

          {results.length > 0 && (
            <div>
              <div className="flex justify-between mb-3">
                <h2 className="text-lg font-semibold text-white">Найдено: {results.length}</h2>
                <span className="text-sm text-green-400">✅ Сохранено: {results.filter(r => r.saved).length}</span>
              </div>
              <div className="space-y-3">
                {results.map((result, i) => (
                  <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-white font-medium text-sm">{result.title}</span>
                          {result.saved && <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">✅ В библиотеке</span>}
                          <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">{result.source}</span>
                        </div>
                        {result.description && <p className="text-gray-400 text-xs mb-2 line-clamp-2">{result.description}</p>}
                        {result.source_url && (
                          <a href={result.source_url} target="_blank" rel="noopener noreferrer"
                            className="text-blue-400 text-xs hover:underline break-all">
                            🔗 {result.source_url}
                          </a>
                        )}
                      </div>
                      <div className="w-28 shrink-0">
                        <div className="text-xs text-gray-500 mb-1">Релевантность</div>
                        {scoreBar(result.confidence_score)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Design */}
      {activeTab === "design" && (
        <>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-2">Design Agent</h2>
            <p className="text-gray-400 text-sm mb-4">
              Читает все документы из библиотеки и генерирует структурированное ТЗ через GPT-4o
            </p>
            <form onSubmit={handleDesign} className="space-y-4">
              <input type="text"
                placeholder="Название ТЗ, например: Выпрямитель тяговый ВАК-350"
                value={tzTitle} onChange={e => setTzTitle(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500"
                required />
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button type="submit" disabled={loadingTZ || !tzTitle}
                className="px-8 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                {loadingTZ ? <><span className="animate-spin inline-block">⏳</span> Генерирую ТЗ...</> : "✏️ Создать ТЗ"}
              </button>
            </form>
          </div>

          {tzResult && (
            <div className="bg-gray-900 border border-green-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-green-400 mb-1">✅ ТЗ создано!</h2>
              <p className="text-gray-400 text-sm mb-4">{tzResult.title} • использовано документов: {tzResult.docs_used}</p>
              <div className="space-y-4">
                {Object.entries(tzResult.sections || {}).map(([title, content]) => (
                  <div key={title} className="border-l-2 border-blue-600 pl-4">
                    <h3 className="text-white font-medium mb-1">{title}</h3>
                    <p className="text-gray-400 text-sm whitespace-pre-wrap">{content as string}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-800">
                <a href="/techspec" className="text-blue-400 text-sm hover:underline">
                  📋 Открыть в разделе Тех. задание →
                </a>
              </div>
            </div>
          )}
        </>
      )}

      {/* Логи */}
      {activeTab === "logs" && (
        <div className="space-y-3">
          {logs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">Агенты ещё не запускались</div>
          ) : logs.map(log => (
            <div key={log.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-purple-400 font-medium text-sm">🤖 {log.agent_name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${log.status === "success" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                  {log.status}
                </span>
                <span className="text-gray-500 text-xs ml-auto">{new Date(log.created_at).toLocaleString("ru-RU")}</span>
              </div>
              <p className="text-gray-300 text-sm">{log.action}</p>
              {log.output_data && <p className="text-gray-500 text-xs mt-1">{log.output_data}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
