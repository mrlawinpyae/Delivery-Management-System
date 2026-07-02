// src/mocks/browser.ts
import { setupWorker } from "msw/browser"
import { handlers } from "./handlers/customerHandlers"
import { authHandlers } from "./handlers/authHandlers"
export const worker = setupWorker(...handlers, ...authHandlers)
