import { useEffect, useState } from 'react'

type ToastProps = { message: string; onDone: () => void }

export default function Toast({ message, onDone }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onDone, 2000)
    return () => clearTimeout(t)
  }, [onDone])
  return <div className="toast">{message}</div>
}

export function useToast() {
  const [msg, setMsg] = useState<string | null>(null)
  const show = (m: string) => setMsg(m)
  const node = msg ? <Toast key={msg} message={msg} onDone={() => setMsg(null)} /> : null
  return { show, node }
}
