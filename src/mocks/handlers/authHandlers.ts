import { http, HttpResponse, delay } from "msw"

export const authHandlers = [
  http.post("/api/auth/login", async ({ request }) => {
    const body = await request.json()
    const { email, password } = body as Record<string, string>

    await delay(1000)

    if (email === "test@example.com" && password === "password123") {
      return HttpResponse.json({
        message: "Login successful",
        data: {
          userId: "usr_cust_001",
          name: "Test User",
          role: "CUSTOMER",
          // ဒီ Token ကို Frontend က LocalStorage မှာ သိမ်းပါမယ်
          token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy.token",
        },
      })
    }

    return HttpResponse.json(
      { error: "Invalid email or password" },
      { status: 401 }
    )
  }),

  // ─── 2. USER SIGN UP MOCK ───
  http.post("/api/auth/sign-up", async ({ request }) => {
    // Request body ကို ယူပါမယ်
    const body = await request.json()
    const { name, phone, email, password } = body as Record<string, string>

    await delay(1000)

    if (!name || !email || !password) {
      return HttpResponse.json(
        {
          message: "Validation failed",
          data: null,
          error: "Missing required fields",
        },
        { status: 400 }
      )
    }

    // Success Response ကို Contract အတိုင်း ပြန်ပေးပါမယ်
    return HttpResponse.json({
      message: "Registration successful",
      data: {
        userId: "usr_cust_001",
        name: name,
        email: email,
      },
      error: null,
    })
  }),
]
