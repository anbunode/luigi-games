import { useState, useRef, useEffect } from "react"
import { Input, Text } from "@medusajs/ui"
import { CheckMini, XMark } from "@medusajs/icons"
import type { CurrencyInput } from "../../lib/regions-api"

// ISO 4217 curated currency list
const CURRENCIES = [
  { code: "USD", name: "Dólar estadounidense" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "Libra esterlina" },
  { code: "JPY", name: "Yen japonés" },
  { code: "CAD", name: "Dólar canadiense" },
  { code: "AUD", name: "Dólar australiano" },
  { code: "CHF", name: "Franco suizo" },
  { code: "CNY", name: "Yuan chino" },
  { code: "SEK", name: "Corona sueca" },
  { code: "NOK", name: "Corona noruega" },
  { code: "DKK", name: "Corona danesa" },
  { code: "NZD", name: "Dólar neozelandés" },
  { code: "SGD", name: "Dólar de Singapur" },
  { code: "HKD", name: "Dólar de Hong Kong" },
  { code: "MXN", name: "Peso mexicano" },
  { code: "BRL", name: "Real brasileño" },
  { code: "ARS", name: "Peso argentino" },
  { code: "CLP", name: "Peso chileno" },
  { code: "COP", name: "Peso colombiano" },
  { code: "PEN", name: "Sol peruano" },
  { code: "UYU", name: "Peso uruguayo" },
  { code: "VES", name: "Bolívar venezolano" },
  { code: "BOB", name: "Boliviano" },
  { code: "PYG", name: "Guaraní paraguayo" },
  { code: "CRC", name: "Colón costarricense" },
  { code: "GTQ", name: "Quetzal guatemalteco" },
  { code: "HNL", name: "Lempira hondureño" },
  { code: "NIO", name: "Córdoba nicaragüense" },
  { code: "DOP", name: "Peso dominicano" },
  { code: "PAB", name: "Balboa panameño" },
  { code: "CUP", name: "Peso cubano" },
  { code: "INR", name: "Rupia india" },
  { code: "KRW", name: "Won surcoreano" },
  { code: "IDR", name: "Rupia indonesia" },
  { code: "MYR", name: "Ringgit malayo" },
  { code: "THB", name: "Baht tailandés" },
  { code: "PHP", name: "Peso filipino" },
  { code: "PKR", name: "Rupia pakistaní" },
  { code: "VND", name: "Dong vietnamita" },
  { code: "BDT", name: "Taka bangladesí" },
  { code: "TRY", name: "Lira turca" },
  { code: "RUB", name: "Rublo ruso" },
  { code: "PLN", name: "Esloti polaco" },
  { code: "CZK", name: "Corona checa" },
  { code: "HUF", name: "Forinto húngaro" },
  { code: "RON", name: "Leu rumano" },
  { code: "ZAR", name: "Rand sudafricano" },
  { code: "EGP", name: "Libra egipcia" },
  { code: "NGN", name: "Naira nigeriana" },
  { code: "KES", name: "Chelín keniano" },
  { code: "GHS", name: "Cedi ghanés" },
  { code: "MAD", name: "Dírham marroquí" },
  { code: "SAR", name: "Riyal saudí" },
  { code: "AED", name: "Dírham emiratí" },
  { code: "QAR", name: "Riyal catarí" },
  { code: "KWD", name: "Dinar kuwaití" },
  { code: "ILS", name: "Nuevo séquel israelí" },
  { code: "UAH", name: "Grivna ucraniana" },
]

type Props = {
  selected: CurrencyInput[]
  onChange: (currencies: CurrencyInput[]) => void
}

export function CurrencySelect({ selected, onChange }: Props) {
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const filtered = CURRENCIES.filter(
    (c) =>
      c.code.toLowerCase().includes(query.toLowerCase()) ||
      c.name.toLowerCase().includes(query.toLowerCase())
  )

  const isSelected = (code: string) => selected.some((s) => s.currency_code === code)

  const toggle = (code: string) => {
    if (isSelected(code)) {
      const next = selected.filter((s) => s.currency_code !== code)
      // If the removed currency was default and there are others, promote the first
      if (next.length > 0 && !next.some((s) => s.is_default)) {
        next[0] = { ...next[0], is_default: true }
      }
      onChange(next)
    } else {
      const isFirst = selected.length === 0
      onChange([...selected, { currency_code: code, is_default: isFirst }])
    }
  }

  const setDefault = (code: string) => {
    onChange(
      selected.map((s) => ({ ...s, is_default: s.currency_code === code }))
    )
  }

  const remove = (code: string) => {
    const next = selected.filter((s) => s.currency_code !== code)
    if (next.length > 0 && !next.some((s) => s.is_default)) {
      next[0] = { ...next[0], is_default: true }
    }
    onChange(next)
  }

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  return (
    <div className="flex flex-col gap-y-2" ref={ref}>
      {/* Selected currencies */}
      {selected.length > 0 && (
        <div className="flex flex-col gap-y-1">
          {selected.map((c) => (
            <div
              key={c.currency_code}
              className="flex items-center justify-between bg-ui-bg-component border border-ui-border-base rounded-md px-3 py-1.5 text-xs"
            >
              <div className="flex items-center gap-x-2">
                <span className="font-semibold text-ui-fg-base">
                  {c.currency_code}
                </span>
                <span className="text-ui-fg-subtle">
                  {CURRENCIES.find((cur) => cur.code === c.currency_code)?.name}
                </span>
                {c.is_default && (
                  <span className="text-[10px] bg-ui-tag-green-bg text-ui-tag-green-text rounded px-1">
                    predeterminada
                  </span>
                )}
              </div>
              <div className="flex items-center gap-x-2">
                {!c.is_default && (
                  <button
                    type="button"
                    onClick={() => setDefault(c.currency_code)}
                    className="text-ui-fg-interactive text-[10px] hover:underline"
                  >
                    Marcar predeterminada
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remove(c.currency_code)}
                  className="text-ui-fg-muted hover:text-ui-fg-base"
                >
                  <XMark className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <Input
          placeholder="Buscar moneda (ej: USD, Euro)..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          size="small"
        />

        {open && (
          <div className="absolute z-50 mt-1 w-full max-h-56 overflow-y-auto bg-ui-bg-base border border-ui-border-base rounded-md shadow-lg">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-ui-fg-muted text-xs">
                No se encontraron monedas
              </div>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-ui-bg-subtle text-ui-fg-base text-left"
                  onClick={() => {
                    toggle(c.code)
                    setQuery("")
                    setOpen(false)
                  }}
                >
                  <span>
                    <span className="font-semibold mr-2">{c.code}</span>
                    {c.name}
                  </span>
                  {isSelected(c.code) && (
                    <CheckMini className="w-3 h-3 text-ui-fg-interactive" />
                  )}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
