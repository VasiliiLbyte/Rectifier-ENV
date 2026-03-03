'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

interface Section {
  id: number
  title: string
  content: string
  order_index: number
}

interface TZ {
  id: number
  title: string
  version: string
  status: string
  created_at: string
  sections: Section[]
}

export default function TZDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [tz, setTz] = useState<TZ | null>(null)
  const [loading, setLoading] = useState(true)
  const [validationResult, setValidationResult] = useState<string | null>(null)
  const [validating, setValidating] = useState(false)

  useEffect(() => {
    fetch(`/api/agents/tz/${id}`)
      .then(res => res.json())
      .then(data => {
        // Если секции не пришли, устанавливаем пустой массив
        if (!data.sections) {
          data.sections = []
        }
        setTz(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Ошибка загрузки ТЗ:', err)
        setLoading(false)
      })
  }, [id])

  const handleCopyJSON = () => {
    if (!tz) return
    navigator.clipboard.writeText(JSON.stringify(tz, null, 2))
    alert('JSON скопирован в буфер обмена')
  }

  const handleDownloadMD = () => {
    if (!tz) return
    let md = `# ${tz.title}\n\n`
    md += `**Версия:** ${tz.version}  \n`
    md += `**Статус:** ${tz.status}  \n`
    md += `**Создано:** ${new Date(tz.created_at).toLocaleString('ru-RU')}\n\n`
    // Сортируем секции, если они есть
    if (tz.sections && tz.sections.length > 0) {
      tz.sections.sort((a, b) => a.order_index - b.order_index).forEach(section => {
        md += `## ${section.title}\n\n`
        md += `${section.content}\n\n`
      })
    } else {
      md += '*Нет разделов*\n\n'
    }
    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${tz.title.replace(/\s+/g, '_')}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleValidate = async () => {
    if (!tz) return
    setValidating(true)
    setValidationResult(null)
    try {
      // Собираем полный текст ТЗ (если секций нет, используем только заголовок)
      let fullContent = tz.title
      if (tz.sections && tz.sections.length > 0) {
        fullContent = tz.sections.map(s => `${s.title}\n${s.content}`).join('\n\n')
      }
      const response = await fetch('/api/agents/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tz_content: fullContent })
      })
      if (!response.ok) throw new Error('Ошибка валидации')
      const data = await response.json()
      setValidationResult(data.analysis)
    } catch (err) {
      console.error(err)
      setValidationResult('Произошла ошибка при проверке. Попробуйте позже.')
    } finally {
      setValidating(false)
    }
  }

  if (loading) {
    return <div className="text-gray-400">Загрузка...</div>
  }

  if (!tz) {
    return <div className="text-red-400">ТЗ не найдено</div>
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">{tz.title}</h1>
          <div className="flex gap-4 mt-2 text-sm text-gray-400">
            <span>Версия: {tz.version}</span>
            <span>Статус: {tz.status}</span>
            <span>Создано: {new Date(tz.created_at).toLocaleString('ru-RU')}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCopyJSON}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm"
          >
            Копировать JSON
          </button>
          <button
            onClick={handleDownloadMD}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm"
          >
            Скачать .md
          </button>
          <button
            onClick={handleValidate}
            disabled={validating}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 rounded-lg text-sm flex items-center gap-2"
          >
            {validating ? 'Проверка...' : 'Проверить на ГОСТ'}
          </button>
        </div>
      </div>

      {validationResult && (
        <div className="mt-6 p-4 bg-gray-800 rounded-xl border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-3">Результат проверки</h2>
          <pre className="text-gray-300 whitespace-pre-wrap font-sans text-sm">
            {validationResult}
          </pre>
        </div>
      )}

      <div className="space-y-6 mt-8">
        {tz.sections && tz.sections.length > 0 ? (
          tz.sections.sort((a, b) => a.order_index - b.order_index).map((section) => (
            <div key={section.id} className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-semibold text-white mb-3">{section.title}</h2>
              <div className="text-gray-300 whitespace-pre-wrap">{section.content}</div>
            </div>
          ))
        ) : (
          <div className="text-gray-400 italic">Нет разделов для отображения</div>
        )}
      </div>
    </div>
  )
}
