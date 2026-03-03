import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Sidebar from './Sidebar'

const inter = Inter({ subsets: ['latin', 'cyrillic'] })

export const metadata: Metadata = {
  title: 'Rectifier-ENV',
  description: 'Платформа для генерации ТЗ на промышленное оборудование',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru" className="dark">
      <body className={`${inter.className} bg-gray-950 text-gray-100`}>
        <div className="flex min-h-screen">
          {/* Левый фиксированный сайдбар */}
          <Sidebar />
          {/* Основной контент – с отступом под ширину сайдбара */}
          <main className="flex-1 ml-60 p-6 bg-gray-900">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
