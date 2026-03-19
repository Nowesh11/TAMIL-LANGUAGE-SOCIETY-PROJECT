import { useEffect } from 'react'

type ShortcutsOptions = {
  onAdd?: () => void
  onSearchFocus?: () => void
  onToggleView?: () => void
  onClearFilters?: () => void
  onCloseModal?: () => void
}

export function useAdminShortcuts(opts: ShortcutsOptions) {
  // Keyboard shortcuts disabled by request
  /*
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // ...
    }
    window.addEventListener('keydown', handler)
    return () => {
      window.removeEventListener('keydown', handler)
    }
  }, [opts.onAdd, opts.onSearchFocus, opts.onToggleView, opts.onClearFilters, opts.onCloseModal])
  */
}
