import { Label } from "@/components/ui/label"

interface FormFieldProps {
  label: string
  error?: string
  children: React.ReactNode
}

// ─── Shared form field wrapper ────────────────────────────────────────────────
export function FormField({ label, error, children }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-bold text-slate-700">{label}</Label>
      {children}
      {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}
    </div>
  )
}
