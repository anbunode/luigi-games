import { useEffect } from "react"
import { useNavigate } from "react-router-dom"

/** Reemplaza la ruta nativa de Medusa; sin sidebar item propio. */
export default function LegacyTaxRegionsRedirectPage() {
  const navigate = useNavigate()

  useEffect(() => {
    navigate("/", { replace: true })
  }, [navigate])

  return null
}
