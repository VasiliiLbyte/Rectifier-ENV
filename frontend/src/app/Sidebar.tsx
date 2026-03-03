'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navigation = [
  { name: 'Главная', href: '/', icon: '🏠' },
  { name: 'ТЗ', href: '/tz', icon: '📄' },
  { name: 'Библиотека', href: '/library', icon: '📚' },
  // { name: 'Агенты', href: '/agents', icon: '🤖' }, // задел на будущее
]

export default function Sidebar() {
  const pathname = usePathname()

  // Определяем активный пункт
  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <aside className="fixed top-0 left-0 h-full w-60 bg-gray-950 border-r border-gray-800 flex flex-col p-4">
      <div className="mb-8 px-2">
        <h1 className="text-xl font-bold text-white">⚡ Rectifier</h1>
        <p className="text-xs text-gray-500 mt-1">ENV · v2</p>
      </div>

      <nav className="flex-1 space-y-1">
        {navigation.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`
              flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors
              ${isActive(item.href)
                ? 'bg-blue-600/20 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }
            `}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="text-sm font-medium">{item.name}</span>
          </Link>
        ))}
      </nav>

      <div className="pt-4 mt-auto border-t border-gray-800 text-xs text-gray-600 text-center">
        Rectifier-ENV © 2025
      </div>
    </aside>
  )
}
