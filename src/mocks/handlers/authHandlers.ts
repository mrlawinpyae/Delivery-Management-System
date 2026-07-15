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
    const body = await request.json()
    const { name, email, password } = body as Record<string, string>

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

  // ─── GET USER PROFILE API MOCK ───
  http.get("/api/auth/user/:userId", async ({ params }) => {
    const { userId } = params

    await delay(500)

    // Return rider-specific data for rider userIds
    if (typeof userId === "string" && userId.startsWith("usr_rider")) {
      return HttpResponse.json({
        message: "User profile fetched successfully",
        data: {
          userId: userId,
          name: "Aung Ko Ko",
          image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80",
          phone: "09785412596",
          email: "aungkoko@delivx.com",
          role: "RIDER",
        },
        error: null,
      })
    }

    return HttpResponse.json({
      message: "User profile fetched successfully",
      data: {
        userId: userId,
        name: "Thiri",
        image: "https://github.com/shadcn.png",
        phone: "+9509454844898",
        email: "thiri@gmail.com",
        role: "CUSTOMER",
      },
      error: null,
    })
  }),

  // ─── UPDATE USER PROFILE API MOCK ───
  http.put("/api/auth/user/:userId", async ({ request, params }) => {
    const { userId } = params
    const body = await request.json()
    const { name, image, phone } = body as Record<string, string>

    await delay(1000)

    return HttpResponse.json({
      message: "User profile updated successfully",
      data: {
        userId: userId,
        name: name,
        image: image || "https://github.com/shadcn.png",
        phone: phone,
        role: "CUSTOMER",
      },
      error: null,
    })
  }),
]
