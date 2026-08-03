import { useEffect, useRef } from "react"

/**

 * @param riderId 
 */
export const useRiderLocation = (riderId: string | undefined) => {
  const wsRef = useRef<WebSocket | null>(null)
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
  
    if (!riderId) return

    
    const ws = new WebSocket("ws://localhost:8080/ws/rider-location")
    wsRef.current = ws

    ws.onopen = () => {
    //   console.log("✅ Connected to Rider Location Stream")

    
      intervalRef.current = setInterval(() => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
         
              if (ws.readyState === WebSocket.OPEN) {
             
                const payload = {
                  riderId: riderId,
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                  status: "AVAILABLE",
                }

                ws.send(JSON.stringify(payload))
                // console.log("📍 Sent Location Update:", payload)
              }
            },
            (error) => {
              console.error("❌ GPS Error:", error.message)
            },
            { enableHighAccuracy: true }
          )
        } else {
          console.error("❌ Geolocation is not supported by this browser.")
        }
      }, 5000)
    }

    ws.onerror = (error) => {
      console.error("❌ WebSocket Error:", error)
    }

    ws.onclose = () => {
      console.log("🔴 WebSocket Disconnected")
      if (intervalRef.current) clearInterval(intervalRef.current)
    }

    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (
        ws.readyState === WebSocket.OPEN ||
        ws.readyState === WebSocket.CONNECTING
      ) {
        ws.close()
      }
    }
  }, [riderId]) 
}
