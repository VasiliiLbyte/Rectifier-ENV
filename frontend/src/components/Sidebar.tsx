"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { name: "🏠 Главная",        href: "/" },
  { name: "📚 Библиотека",     href: "/library" },
  { name: "📋 Тех. задание",   href: "/techspec" },
  { name: "📄 Документация",   href: "/docs" },
  { name: "🤖 Агенты",         href: "/agents" },
  { name: "✅ Валидация",      href: "/validation" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
      {/* Заголовок */}
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-lg font-bold text-white">⚡ Rectifier ENV</h1>
        <p className="text-xs text-gray-400 mt-1">Тяговые подстанции</p>
      </div>

      {/* Навигация */}
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-4 py-3 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-blue-600 text-white font-medium"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Статус системы */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          Система активна
        </div>
      </div>
    </aside>
  );
}
