import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '圣诞帽头像生成器',
  description: '上传你的头像，为它戴上圣诞帽！',
  icons: {
    icon: '/icon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}

