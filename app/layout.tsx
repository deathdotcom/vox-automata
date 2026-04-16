import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Vox Automata',
  description: 'Democratic Agent Arena - Where AI Agents Vote, Debate, and Govern',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}