import { useEffect } from 'react'

type ShortcutsOptions = {
  onAdd?: () => void
  onSearchFocus?: () => void
  onToggleView?: () => void
  onClearFilters?: () => void
  onCloseModal?: () => void
}

export function useAdminShortcuts(opts: ShortcutsOptions) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) return
      if (e.key === '/') {
        e.preventDefault()
        opts.onSearchFocus && opts.onSearchFocus()
        return
      }
      if (e.key.toLowerCase() === 'n') {
        e.preventDefault()
        opts.onAdd && opts.onAdd()
        return
      }
      if (e.key.toLowerCase() === 'v') {
        e.preventDefault()
        opts.onToggleView && opts.onToggleView()
        return
      }
      if (e.key.toLowerCase() === 'c') {
        e.preventDefault()
        opts.onClearFilters && opts.onClearFilters()
        return
      }
      if (e.key === 'Escape') {
        opts.onCloseModal && opts.onCloseModal()
      }
    }
    window.addEventListener('keydown', handler)
    return () => {
      window.removeEventListener('keydown', handler)
    }
  }, [opts.onAdd, opts.onSearchFocus, opts.onToggleView, opts.onClearFilters, opts.onCloseModal])
}
