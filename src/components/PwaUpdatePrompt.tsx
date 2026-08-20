import { useRegisterSW } from 'virtual:pwa-register/react'

export function PwaUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  const close = () => {
    setNeedRefresh(false)
  }

  if (!needRefresh) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 p-4 bg-zinc-900 text-white rounded-lg shadow-xl border border-zinc-700 max-w-sm w-full flex flex-col gap-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-lg">New updates available!</h3>
          <p className="text-zinc-300 text-sm mt-1">
            Click update to load the latest version.
          </p>
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button
          onClick={close}
          className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
        >
          Close
        </button>
        <button
          onClick={() => updateServiceWorker(true)}
          className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
        >
          Update
        </button>
      </div>
    </div>
  )
}
