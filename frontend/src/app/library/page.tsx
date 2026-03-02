'use client';

import * as React from 'react';

type Row = {
  id: string;
  relPath: string;
  absPath: string;
  name: string;
  ext: string;
  size: number;
  sha256: string;
  status: 'OK' | 'EMPTY' | 'TOO_LARGE' | 'UNSUPPORTED_EXT' | 'DUPLICATE';
  duplicateOf?: string;
};

export default function LibraryPage() {
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState('');
  const [root, setRoot] = React.useState('');
  const [rows, setRows] = React.useState<Row[]>([]);
  const [q, setQ] = React.useState('');
  const [filter, setFilter] = React.useState<'ALL' | 'ONLY_OK' | 'ONLY_PROBLEMS'>('ALL');
  const [selected, setSelected] = React.useState<Record<string, boolean>>({});
  const [savedMsg, setSavedMsg] = React.useState('');

  const fmtSize = (n: number) => {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  };

  const badgeClass = (s: Row['status']) => {
    if (s === 'OK') return 'bg-green-900 text-green-300 border-green-700 px-2 py-1 rounded-full text-xs font-medium';
    if (s === 'DUPLICATE') return 'bg-yellow-900 text-yellow-300 border-yellow-700 px-2 py-1 rounded-full text-xs font-medium';
    return 'bg-red-900 text-red-300 border-red-700 px-2 py-1 rounded-full text-xs font-medium';
  };

  const scan = async () => {
    setLoading(true);
    setErr('');
    try {
      const res = await fetch('/api/validation/scan', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      
      setRoot(data.root || '');
      setRows(data.rows || []);

      // Автовыбор OK файлов
      const nextSel: Record<string, boolean> = {};
      for (const r of data.rows || []) {
        if (r.status === 'OK') nextSel[r.relPath] = true;
      }
      setSelected(nextSel);
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  };

  const toggle = (relPath: string) => {
    setSelected(prev => ({ ...prev, [relPath]: !prev[relPath] }));
  };

  const saveManifest = async () => {
    setLoading(true);
    try {
      const selectedList = Object.entries(selected).filter(([,v]) => v).map(([k]) => k);
      
      const res = await fetch('/api/validation/manifest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selected: selectedList })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error);
      
      setSavedMsg(`✅ Сохранено: ${data.saved?.selected_count} файлов в ${data.manifestPath}`);
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  };

  const stats = React.useMemo(() => {
    const by: Record<string, number> = {};
    for (const r of rows) by[r.status] = (by[r.status] || 0) + 1;
    const selectedCount = Object.values(selected).filter(Boolean).length;
    return { by, selectedCount, total: rows.length };
  }, [rows, selected]);

  const visibleRows = React.useMemo(() => {
    let out = rows;
    if (filter === 'ONLY_OK') out = out.filter(r => r.status === 'OK');
    if (filter === 'ONLY_PROBLEMS') out = out.filter(r => r.status !== 'OK');
    if (q.trim()) {
      const qq = q.toLowerCase();
      out = out.filter(r => 
        r.relPath.toLowerCase().includes(qq) || 
        r.name.toLowerCase().includes(qq)
      );
    }
    return out.sort((a, b) => a.relPath.localeCompare(b.relPath));
  }, [rows, filter, q]);

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">📚 Библиотека файлов</h1>
          <p className="text-gray-400">Валидация собранных файлов + формирование корректной выборки</p>
        </div>
        <button
          onClick={scan}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900 text-white px-8 py-3 rounded-xl font-semibold text-lg shadow-lg flex items-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Сканирую...
            </>
          ) : (
            '🔍 Сканировать библиотеку'
          )}
        </button>
      </div>

      {root && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
          <div className="text-sm text-gray-400">📁 Папка библиотеки: <code className="bg-gray-800 px-3 py-1 rounded font-mono text-sm text-white">{root}</code></div>
        </div>
      )}

      {err && (
        <div className="bg-red-900/50 border border-red-700 text-red-200 p-6 rounded-xl mb-6">
          <div className="font-semibold mb-2">❌ Ошибка:</div>
          <code className="text-sm">{err}</code>
        </div>
      )}

      {savedMsg && (
        <div className="bg-green-900/50 border border-green-700 text-green-200 p-6 rounded-xl mb-6">
          <div className="font-semibold">✅ {savedMsg}</div>
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
        <div className="flex flex-wrap items-center gap-4 text-sm mb-4">
          <span>Всего файлов: <span className="text-white font-semibold">{stats.total}</span></span>
          <span>✓ OK: <span className="text-green-400 font-semibold">{stats.by?.OK || 0}</span></span>
          <span>📋 Выбрано: <span className="text-white font-semibold">{stats.selectedCount}</span></span>
          <span>Дубли: <span className="text-yellow-400 font-semibold">{stats.by?.DUPLICATE || 0}</span></span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="🔎 Поиск по имени или пути..."
            className="bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded-lg w-72 focus:outline-none focus:border-blue-500"
          />
          <select
            value={filter}
            onChange={e => setFilter(e.target.value as any)}
            className="bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none"
          >
            <option value="ALL">Показать все файлы</option>
            <option value="ONLY_OK">Только OK файлы</option>
            <option value="ONLY_PROBLEMS">Только проблемные</option>
          </select>
          <button
            onClick={() => {
              const nextSel: Record<string, boolean> = {};
              for (const r of rows) if (r.status === 'OK') nextSel[r.relPath] = true;
              setSelected(nextSel);
            }}
            className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg border border-gray-600 font-medium"
          >
            Автовыбор OK
          </button>
          <button
            onClick={() => setSelected({})}
            className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg border border-gray-600 font-medium"
          >
            Очистить выбор
          </button>
          <button
            onClick={saveManifest}
            disabled={loading || Object.values(selected).filter(Boolean).length === 0}
            className="bg-green-600 hover:bg-green-500 disabled:bg-green-900 text-white px-8 py-2 rounded-lg font-semibold shadow-lg flex items-center gap-2 disabled:shadow-none"
          >
            💾 Сохранить выборку
          </button>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-6 bg-gray-950/50 px-6 py-4 text-sm font-semibold text-gray-300 border-b border-gray-800">
          <span className="flex items-center justify-center">☑️</span>
          <span>Файл</span>
          <span>Размер</span>
          <span>Статус</span>
          <span className="text-center">📥</span>
          <span>Проблема</span>
        </div>
        
        {visibleRows.length === 0 ? (
          <div className="p-16 text-center text-gray-500">
            <div className="text-6xl mb-6 opacity-50">📂</div>
            <p className="text-xl mb-4">Файлы из библиотеки не найдены</p>
            <p className="text-lg mb-8">Нажми "🔍 Сканировать библиотеку" чтобы начать валидацию</p>
            <p className="text-sm opacity-75">
              Проверь, что папка <code className="bg-gray-800 px-2 py-1 rounded text-xs font-mono">/Users/vasilii/Desktop/rectifier-env/library</code> содержит PDF, DOCX, MD или TXT файлы
            </p>
          </div>
        ) : (
          visibleRows.map(r => (
            <div key={r.id} className="grid grid-cols-1 lg:grid-cols-6 items-start px-6 py-5 border-t border-gray-800 hover:bg-gray-850 transition-colors">
              <div className="pt-1">
                <input
                  type="checkbox"
                  checked={!!selected[r.relPath]}
                  onChange={() => toggle(r.relPath)}
                  className="w-5 h-5 rounded border-gray-600 focus:ring-blue-500 focus:ring-2"
                />
              </div>
              
              <div className="font-mono min-w-0">
                <div className="text-white truncate font-medium mb-1" title={r.relPath}>{r.relPath}</div>
                <div className="text-gray-500 text-xs">{r.ext.toUpperCase()} | {r.sha256.slice(0, 12)}...</div>
              </div>
              
              <div className="text-sm text-gray-300 font-mono">{fmtSize(r.size)}</div>
              
              <span className={badgeClass(r.status)}>
                {r.status}
              </span>
              
              <div className="text-center">
                <a 
                  href={`/api/library/file/${encodeURIComponent(r.relPath)}`}
                  className="text-blue-400 hover:text-blue-300 text-lg transition-colors p-1 -m-1 rounded hover:bg-blue-900/30 block"
                  title="Скачать файл"
                >
                  📥
                </a>
              </div>
              
              <div className="text-xs text-gray-500 leading-tight">
                {r.status === 'DUPLICATE' && `Дубликат: ${r.duplicateOf}`}
                {r.status === 'EMPTY' && 'Файл пустой'}
                {r.status === 'TOO_LARGE' && 'Слишком большой (>50MB)'}
                {r.status === 'UNSUPPORTED_EXT' && 'Неподдерживаемый тип'}
                {r.status === 'OK' && <span className="text-green-400">✓ Готов к использованию</span>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
