'use client'

import { Toaster } from 'sonner'
import { useEffect, useState } from 'react'

export default function ClientToaster() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <Toaster
      theme="dark"
      position="top-right"
      richColors
    />
  )
}
