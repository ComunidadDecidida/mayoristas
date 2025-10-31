import { useEffect, useState } from 'react'
import { DollarSign } from 'lucide-react'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export function ExchangeRateDisplay() {
  const [rate, setRate] = useState<number>(17.5)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadExchangeRate()
    const interval = setInterval(loadExchangeRate, 3600000)
    return () => clearInterval(interval)
  }, [])

  async function loadExchangeRate() {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/syscom-api?action=exchange-rate`,
        {
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        if (data.normal) {
          setRate(parseFloat(data.normal))
        }
      }
    } catch (error) {
      console.error('Error cargando tipo de cambio:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center space-x-2 text-sm text-gray-700 bg-gray-100 px-3 py-1.5 rounded-lg">
      <DollarSign className="w-4 h-4" />
      <span className="font-medium">USD: ${rate.toFixed(2)} MXN</span>
    </div>
  )
}
