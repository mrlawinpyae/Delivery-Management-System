// src/mocks/browser.ts
import { setupWorker } from "msw/browser"
import { handlers } from "./handlers/customerHandlers"
import { authHandlers } from "./handlers/authHandlers"
import { riderHandlers } from "./handlers/riderHandlers"
export const worker = setupWorker(...handlers, ...authHandlers, ...riderHandlers)

