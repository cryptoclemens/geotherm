'use client'

import { useEffect } from 'react'
import { AlertTriangleIcon, RefreshCwIcon } from 'lucide-react'
import { Button } from '@/core/ui/button'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[AppError]', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4 text-center">
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30">
        <AlertTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-1">Seite konnte nicht geladen werden</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          {error.message || 'Ein unerwarteter Fehler ist aufgetreten.'}
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground/50 mt-1 font-mono">ID: {error.digest}</p>
        )}
      </div>
      <Button onClick={reset} variant="outline" size="sm">
        <RefreshCwIcon className="w-4 h-4" />
        Erneut versuchen
      </Button>
    </div>
  )
}
