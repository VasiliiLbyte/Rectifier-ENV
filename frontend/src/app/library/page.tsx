"use client";
import { useState, useEffect } from "react";

const API_URL = "http://localhost:8000";

interface Document {
  id: string;
  title: string;
  description: string;
  file_type: string;
  source: string;
  status: string;
  tags: string;
  created_at: string;
}

const statusColors: Record<string, string> = {
  pending:  "bg-yellow-500/20 text-yellow-400",
  verified: "bg-green-500/20 text-green-400",
  disputed: "bg-orange-500/20 text-orange-400",
  rejected: "bg-red-500/20 text-red-400",
};

const statusLabels: Record<string, string> = {
  pending:  "⏳ Ожидает",
  verified: "✅ Проверен",
  disputed: "⚠️ Спорный",
  rejected: "❌ Отклонён",
};

export default function LibraryPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`${API_URL}/api/documents/`);
      const data = await res.json();
      setDocuments(data);
    } catch (e) {
      console.error("Ошибка загрузки документов:", e);
    }
  };

  useEffect(() => { fetchDocuments(); }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) return;
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title);
      formData.append("description", description);
      formData.append("tags", tags);
      const res = await fetch(`${API_URL}/api/documents/upload`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.detail || "Ошибка загрузки");
      } else {
        setTitle("");
        setDescription("");
        setTags("");
        setFile(null);
        fetchDocuments();
      }
    } catch (e) {
      setError("Не удалось подключиться к серверу");
    }
    setUploading(false);
  };

  const handleDelete = async (id: string) => {
    await fetch(`${API_URL}/api/documents/${id}`, { method: "DELETE" });
    fetchDocuments();
  };

  return (
    <div className="max-w-5xl">
      <h1 className="text-3xl font-bold text-white mb-2">📚 Библиотека данных</h1>
      <p className="text-gray-400 mb-6">Нормативы, стандарты и технические документы</p>

      {/* Форма загрузки */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Загрузить документ</h2>
        <form onSubmit={handleUpload} className="space-y-3">
          <input
            type="text"
            placeholder="Название документа *"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
            required
          />
          <input
            type="text"
            placeholder="Описание"
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
          />
          <input
            type="text"
            placeholder="Теги через запятую: ГОСТ, IEC, выпрямитель"
            value={tags}
            onChange={e => setTags(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
          />
          <div className="flex gap-3">
            <input
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={e => setFile(e.target.files?.[0] || null)}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-400 text-sm"
            />
            <button
              type="submit"
              disabled={uploading || !file || !title}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {uploading ? "Загрузка..." : "Загрузить"}
            </button>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
        </form>
      </div>

      {/* Список документов */}
      <div className="space-y-3">
        {documents.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Библиотека пуста. Загрузите первый документ.
          </div>
        ) : (
          documents.map(doc => (
            <div
              key={doc.id}
              className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-start justify-between hover:border-gray-700 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <span className="text-white font-medium">{doc.title}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[doc.status] || "bg-gray-700 text-gray-400"}`}>
                    {statusLabels[doc.status] || doc.status}
                  </span>
                  <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full uppercase">
                    {doc.file_type || "—"}
                  </span>
                  {doc.source === "agent" && (
                    <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">🤖 Агент</span>
                  )}
                </div>
                {doc.description && <p className="text-gray-400 text-sm">{doc.description}</p>}
                {doc.tags && <p className="text-gray-500 text-xs mt-1">🏷 {doc.tags}</p>}
                <p className="text-gray-600 text-xs mt-1">
                  {new Date(doc.created_at).toLocaleString("ru-RU")}
                </p>
              </div>
              <button
                onClick={() => handleDelete(doc.id)}
                className="ml-4 text-gray-600 hover:text-red-400 transition-colors text-sm"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
