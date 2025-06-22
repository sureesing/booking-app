// src/app/page.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/booking')
    }
  }, [router])

  return (
    <main className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-3xl">Welcome to the main page!</h1>
    </main>
  )
}