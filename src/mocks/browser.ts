// src/mocks/browser.ts
import { setupWorker } from "msw/browser"
import { handlers } from "./handlers/customerHandlers"

export const worker = setupWorker(...handlers)
