import { z } from "zod"
import type { ChartConfig } from "@/components/ui/chart"

// ─── Modal type ───────────────────────────────────────────────────────────────
export type ModalType = "edit" | "vehicle" | "delete" | null

// ─── Status badge styles ──────────────────────────────────────────────────────
export const STATUS_STYLE = {
  AVAILABLE: "bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-bold",
  BUSY: "bg-amber-50 text-amber-700 border border-amber-200/80 font-bold",
  OFFLINE: "bg-slate-100 text-slate-700 border border-slate-200/80 font-bold",
} as const

// ─── Vehicle options ──────────────────────────────────────────────────────────
export const VEHICLE_OPTIONS = ["Scooter", "Motorcycle", "Car", "Bicycle", "Van"] as const

// ─── Zod Schemas ──────────────────────────────────────────────────────────────
import { isValidPhoneNumber } from "libphonenumber-js"

export const createRiderSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z
    .string()
    .min(1, "Phone number is required")
    .refine((val) => val !== "+95" && isValidPhoneNumber(val, "MM"), {
      message: "Please enter a valid Myanmar phone number",
    }),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[a-z]/, "Must contain at least one lowercase letter")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[0-9]/, "Must contain at least one number")
    .regex(/[^a-zA-Z0-9]/, "Must contain at least one special character"),
  vehicleType: z.string().min(1, "Vehicle type is required"),
  licenceNumber: z.string().min(3, "Licence number is required"),
  image: z.string().optional(),
})

export const updateRiderSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z
    .string()
    .optional()
    .refine((val) => !val || val === "+95" || isValidPhoneNumber(val, "MM"), {
      message: "Please enter a valid Myanmar phone number",
    }),
  email: z
    .string()
    .email("Invalid email address")
    .optional()
    .or(z.literal("")),
  password: z.string().optional(),
  vehicleType: z.string().optional(),
  licenceNumber: z.string().optional(),
  nrcNumber: z.string().optional(),
  image: z.string().optional(),
})

export const updateVehicleSchema = z.object({
  type: z.string().min(1, "Vehicle type is required"),
  licenceNumber: z.string().min(3, "Licence number is required"),
})

export type CreateRiderForm = z.infer<typeof createRiderSchema>
export type UpdateRiderForm = z.infer<typeof updateRiderSchema>
export type UpdateVehicleForm = z.infer<typeof updateVehicleSchema>

// ─── Chart config ─────────────────────────────────────────────────────────────
export const riderChartConfig = {
  count: { label: "Riders" },
  AVAILABLE: { label: "Available",   color: "oklch(0.765 0.177 163.22)" },
  BUSY:      { label: "On Delivery", color: "oklch(0.769 0.188 70.08)"  },
  OFFLINE:   { label: "Offline",     color: "oklch(0.556 0.02 286)"     },
} satisfies ChartConfig

// ─── Chart fill colours (matches config above) ────────────────────────────────
export const RIDER_STATUS_FILLS: Record<string, string> = {
  AVAILABLE: "oklch(0.765 0.177 163.22)",
  BUSY:      "oklch(0.769 0.188 70.08)",
  OFFLINE:   "oklch(0.556 0.02 286)",
}

// ─── Framer-motion variants ───────────────────────────────────────────────────
export const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: "easeOut" } },
}
