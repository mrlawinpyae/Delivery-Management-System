import * as React from "react"
import { getDistricts, getDistrictsByState, validateNricFormat } from "mm-nric"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Types & Constants ───────────────────────────────────────────────────────

export interface DistrictItem {
  en: string
  mm?: string
  fullEn?: string
  fullMm?: string
  code?: number
}

const STATE_CODES = Array.from({ length: 14 }, (_, i) => String(i + 1))
const NRC_TYPES = [
  { value: "(N)", label: "(N) (နိုင်)" },
  { value: "(E)", label: "(E) (ဧ)" },
  { value: "(P)", label: "(P) (ပြု)" },
]

// Fallback: Flatten ALL townships for selection when no state is selected
const ALL_TOWNSHIPS: DistrictItem[] = (getDistricts() as DistrictItem[]).filter(
  (d) => Boolean(d.en)
)

// ─── parseNrcString ───────────────────────────────────────────────────────────

export interface MyanmarNrcValue {
  stateCode: string
  townshipCode: string
  nrcType: string
  nrcNumber: string
}

export function parseNrcString(nrcString: string = ""): MyanmarNrcValue {
  const match = nrcString.match(/^(\d{1,2})\/([A-Z]+)(\([A-Z]+\))(\d{0,6})$/i)
  if (match) {
    return {
      stateCode: match[1],
      townshipCode: match[2].toUpperCase(),
      nrcType: match[3].toUpperCase(),
      nrcNumber: match[4],
    }
  }
  return { stateCode: "", townshipCode: "", nrcType: "", nrcNumber: "" }
}

export function formatNrcDisplay(nrcString: string = ""): string {
  const parsed = parseNrcString(nrcString)
  if (!parsed.stateCode) return nrcString

  const townshipCode = parsed.townshipCode
  let townshipDisplay = townshipCode
  const districts = getDistrictsByState(Number(parsed.stateCode)) as DistrictItem[]
  
  if (districts && districts.length > 0) {
    const district = districts.find((d) => d.en === townshipCode)
    if (district && district.mm) {
      townshipDisplay = `${district.en} (${district.mm})`
    }
  } else {
    const district = ALL_TOWNSHIPS.find((d) => d.en === townshipCode)
    if (district && district.mm) {
      townshipDisplay = `${district.en} (${district.mm})`
    }
  }

  const typeItem = NRC_TYPES.find((t) => t.value === parsed.nrcType)
  const typeDisplay = typeItem ? typeItem.label : parsed.nrcType

  return `${parsed.stateCode} / ${townshipDisplay} ${typeDisplay} ${parsed.nrcNumber}`
}

// ─── MyanmarNrcInput ──────────────────────────────────────────────────────────

export interface MyanmarNrcInputProps {
  value?: string
  onChange?: (nrcString: string, isValid: boolean) => void
  disabled?: boolean
  className?: string
}

export function MyanmarNrcInput({
  value = "",
  onChange,
  disabled = false,
  className,
}: MyanmarNrcInputProps) {
  const [stateCode, setStateCode] = React.useState("")
  const [townshipCode, setTownshipCode] = React.useState("")
  const [nrcType, setNrcType] = React.useState("")
  const [nrcNumber, setNrcNumber] = React.useState("")

  // Filter townships according to the currently selected state
  const availableTownships = React.useMemo<DistrictItem[]>(() => {
    if (!stateCode) return ALL_TOWNSHIPS
    const districts = getDistrictsByState(Number(stateCode)) as DistrictItem[]
    return districts && districts.length > 0 ? districts : ALL_TOWNSHIPS
  }, [stateCode])

  // Sync from external `value` (e.g. edit-mode pre-fill)
  React.useEffect(() => {
    const parsed = parseNrcString(value || "")
    if (parsed.stateCode !== stateCode) setStateCode(parsed.stateCode)
    if (parsed.townshipCode !== townshipCode) setTownshipCode(parsed.townshipCode)
    if (parsed.nrcType !== nrcType) setNrcType(parsed.nrcType)
    if (parsed.nrcNumber !== nrcNumber) setNrcNumber(parsed.nrcNumber)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const triggerChange = (
    state: string,
    township: string,
    type: string,
    num: string,
  ) => {
    const concatenated =
      state && township && type ? `${state}/${township}${type}${num}` : ""
    if (concatenated === value) return
    const isValid =
      concatenated !== "" && validateNricFormat(concatenated) !== false
    onChange?.(concatenated, isValid)
  }

  const handleState = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    setStateCode(val)

    const availableCodes = val
      ? ((getDistrictsByState(Number(val)) as DistrictItem[]) || []).map((d) => d.en)
      : ALL_TOWNSHIPS.map((d) => d.en)

    let nextTownship = townshipCode
    if (townshipCode && !availableCodes.includes(townshipCode)) {
      nextTownship = ""
      setTownshipCode("")
    }

    triggerChange(val, nextTownship, nrcType, nrcNumber)
  }

  const handleTownship = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    setTownshipCode(val)
    triggerChange(stateCode, val, nrcType, nrcNumber)
  }

  const handleType = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    setNrcType(val)
    triggerChange(stateCode, townshipCode, val, nrcNumber)
  }

  const handleNumber = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 6)
    setNrcNumber(val)
    triggerChange(stateCode, townshipCode, nrcType, val)
  }

  return (
    <div
      className={cn(
        "flex items-center w-full max-w-full overflow-hidden rounded-md border border-slate-300 bg-white p-0.5 shadow-xs transition-all",
        "focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-600/20 hover:border-slate-400",
        disabled && "pointer-events-none opacity-60 bg-slate-50",
        className
      )}
    >
      {/* Part 1 — State Select */}
      <div className="relative inline-flex items-center shrink-0">
        <select
          value={stateCode}
          onChange={handleState}
          disabled={disabled}
          aria-label="NRC State Code"
          className={cn(
            "h-9 appearance-none bg-transparent pl-2.5 pr-5 text-sm font-medium outline-none cursor-pointer border-none focus:ring-0",
            stateCode ? "text-slate-900" : "text-slate-400"
          )}
        >
          <option value="" disabled className="text-slate-400">
            State
          </option>
          {STATE_CODES.map((c) => (
            <option key={c} value={c} className="text-slate-900">
              {c}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-1 size-3.5 text-slate-400 shrink-0" />
      </div>

      <span className="shrink-0 select-none text-slate-400 font-semibold text-sm px-0.5">
        /
      </span>

      {/* Part 2 — Township Select */}
      <div className="relative inline-flex items-center flex-1 min-w-[60px] overflow-hidden">
        <select
          value={townshipCode}
          onChange={handleTownship}
          disabled={disabled}
          aria-label="NRC Township Code"
          className={cn(
            "h-9 w-full appearance-none bg-transparent pl-1.5 pr-5 text-sm font-medium outline-none cursor-pointer border-none focus:ring-0 truncate",
            townshipCode ? "text-slate-900" : "text-slate-400"
          )}
        >
          <option value="" disabled className="text-slate-400">
            Township
          </option>
          {availableTownships.map((d) => (
            <option key={d.en} value={d.en} className="text-slate-900">
              {d.en}{d.mm ? ` (${d.mm})` : ""}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-1 size-3.5 text-slate-400 shrink-0" />
      </div>

      {/* Part 3 — Type Select */}
      <div className="relative inline-flex items-center shrink-0">
        <select
          value={nrcType}
          onChange={handleType}
          disabled={disabled}
          aria-label="NRC Type"
          className={cn(
            "h-9 appearance-none bg-transparent pl-1.5 pr-5 text-sm font-medium outline-none cursor-pointer border-none focus:ring-0",
            nrcType ? "text-slate-900" : "text-slate-400"
          )}
        >
          <option value="" disabled className="text-slate-400">
            Type
          </option>
          {NRC_TYPES.map((t) => (
            <option key={t.value} value={t.value} className="text-slate-900">
              {t.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-1 size-3.5 text-slate-400 shrink-0" />
      </div>

      {/* Vertical Divider */}
      <div className="mx-0.5 h-4 w-px bg-slate-200 shrink-0" />

      {/* Part 4 — 6-digit Number Input */}
      <input
        type="text"
        inputMode="numeric"
        placeholder="012345"
        value={nrcNumber}
        onChange={handleNumber}
        maxLength={6}
        disabled={disabled}
        aria-label="NRC Number"
        className="w-[72px] shrink-0 border-none bg-transparent outline-none focus:ring-0 px-1.5 h-9 text-slate-900 font-mono text-sm placeholder:text-slate-400 tracking-wider"
      />
    </div>
  )
}
