import { useState, useRef, useEffect } from "react"
import { Input, Text } from "@medusajs/ui"
import { CheckMini, XMark } from "@medusajs/icons"
import type { CountryInput } from "../../lib/regions-api"

// ISO 3166-1 alpha-2 country list with flag emoji
const COUNTRIES: CountryInput[] = [
  { iso_2: "AD", display_name: "Andorra" },
  { iso_2: "AE", display_name: "Emiratos Árabes Unidos" },
  { iso_2: "AF", display_name: "Afganistán" },
  { iso_2: "AG", display_name: "Antigua y Barbuda" },
  { iso_2: "AL", display_name: "Albania" },
  { iso_2: "AM", display_name: "Armenia" },
  { iso_2: "AO", display_name: "Angola" },
  { iso_2: "AR", display_name: "Argentina" },
  { iso_2: "AT", display_name: "Austria" },
  { iso_2: "AU", display_name: "Australia" },
  { iso_2: "AZ", display_name: "Azerbaiyán" },
  { iso_2: "BA", display_name: "Bosnia y Herzegovina" },
  { iso_2: "BB", display_name: "Barbados" },
  { iso_2: "BD", display_name: "Bangladesh" },
  { iso_2: "BE", display_name: "Bélgica" },
  { iso_2: "BF", display_name: "Burkina Faso" },
  { iso_2: "BG", display_name: "Bulgaria" },
  { iso_2: "BH", display_name: "Baréin" },
  { iso_2: "BI", display_name: "Burundi" },
  { iso_2: "BJ", display_name: "Benín" },
  { iso_2: "BN", display_name: "Brunéi" },
  { iso_2: "BO", display_name: "Bolivia" },
  { iso_2: "BR", display_name: "Brasil" },
  { iso_2: "BS", display_name: "Bahamas" },
  { iso_2: "BT", display_name: "Bután" },
  { iso_2: "BW", display_name: "Botsuana" },
  { iso_2: "BY", display_name: "Bielorrusia" },
  { iso_2: "BZ", display_name: "Belice" },
  { iso_2: "CA", display_name: "Canadá" },
  { iso_2: "CD", display_name: "Congo (Rep. Dem.)" },
  { iso_2: "CF", display_name: "Rep. Centroafricana" },
  { iso_2: "CG", display_name: "Congo" },
  { iso_2: "CH", display_name: "Suiza" },
  { iso_2: "CI", display_name: "Costa de Marfil" },
  { iso_2: "CL", display_name: "Chile" },
  { iso_2: "CM", display_name: "Camerún" },
  { iso_2: "CN", display_name: "China" },
  { iso_2: "CO", display_name: "Colombia" },
  { iso_2: "CR", display_name: "Costa Rica" },
  { iso_2: "CU", display_name: "Cuba" },
  { iso_2: "CV", display_name: "Cabo Verde" },
  { iso_2: "CY", display_name: "Chipre" },
  { iso_2: "CZ", display_name: "Rep. Checa" },
  { iso_2: "DE", display_name: "Alemania" },
  { iso_2: "DJ", display_name: "Yibuti" },
  { iso_2: "DK", display_name: "Dinamarca" },
  { iso_2: "DM", display_name: "Dominica" },
  { iso_2: "DO", display_name: "Rep. Dominicana" },
  { iso_2: "DZ", display_name: "Argelia" },
  { iso_2: "EC", display_name: "Ecuador" },
  { iso_2: "EE", display_name: "Estonia" },
  { iso_2: "EG", display_name: "Egipto" },
  { iso_2: "ER", display_name: "Eritrea" },
  { iso_2: "ES", display_name: "España" },
  { iso_2: "ET", display_name: "Etiopía" },
  { iso_2: "FI", display_name: "Finlandia" },
  { iso_2: "FJ", display_name: "Fiyi" },
  { iso_2: "FR", display_name: "Francia" },
  { iso_2: "GA", display_name: "Gabón" },
  { iso_2: "GB", display_name: "Reino Unido" },
  { iso_2: "GD", display_name: "Granada" },
  { iso_2: "GE", display_name: "Georgia" },
  { iso_2: "GH", display_name: "Ghana" },
  { iso_2: "GM", display_name: "Gambia" },
  { iso_2: "GN", display_name: "Guinea" },
  { iso_2: "GQ", display_name: "Guinea Ecuatorial" },
  { iso_2: "GR", display_name: "Grecia" },
  { iso_2: "GT", display_name: "Guatemala" },
  { iso_2: "GW", display_name: "Guinea-Bisáu" },
  { iso_2: "GY", display_name: "Guyana" },
  { iso_2: "HN", display_name: "Honduras" },
  { iso_2: "HR", display_name: "Croacia" },
  { iso_2: "HT", display_name: "Haití" },
  { iso_2: "HU", display_name: "Hungría" },
  { iso_2: "ID", display_name: "Indonesia" },
  { iso_2: "IE", display_name: "Irlanda" },
  { iso_2: "IL", display_name: "Israel" },
  { iso_2: "IN", display_name: "India" },
  { iso_2: "IQ", display_name: "Irak" },
  { iso_2: "IR", display_name: "Irán" },
  { iso_2: "IS", display_name: "Islandia" },
  { iso_2: "IT", display_name: "Italia" },
  { iso_2: "JM", display_name: "Jamaica" },
  { iso_2: "JO", display_name: "Jordania" },
  { iso_2: "JP", display_name: "Japón" },
  { iso_2: "KE", display_name: "Kenia" },
  { iso_2: "KG", display_name: "Kirguistán" },
  { iso_2: "KH", display_name: "Camboya" },
  { iso_2: "KI", display_name: "Kiribati" },
  { iso_2: "KM", display_name: "Comoras" },
  { iso_2: "KN", display_name: "San Cristóbal y Nieves" },
  { iso_2: "KP", display_name: "Corea del Norte" },
  { iso_2: "KR", display_name: "Corea del Sur" },
  { iso_2: "KW", display_name: "Kuwait" },
  { iso_2: "KZ", display_name: "Kazajistán" },
  { iso_2: "LA", display_name: "Laos" },
  { iso_2: "LB", display_name: "Líbano" },
  { iso_2: "LC", display_name: "Santa Lucía" },
  { iso_2: "LI", display_name: "Liechtenstein" },
  { iso_2: "LK", display_name: "Sri Lanka" },
  { iso_2: "LR", display_name: "Liberia" },
  { iso_2: "LS", display_name: "Lesoto" },
  { iso_2: "LT", display_name: "Lituania" },
  { iso_2: "LU", display_name: "Luxemburgo" },
  { iso_2: "LV", display_name: "Letonia" },
  { iso_2: "LY", display_name: "Libia" },
  { iso_2: "MA", display_name: "Marruecos" },
  { iso_2: "MC", display_name: "Mónaco" },
  { iso_2: "MD", display_name: "Moldavia" },
  { iso_2: "ME", display_name: "Montenegro" },
  { iso_2: "MG", display_name: "Madagascar" },
  { iso_2: "MH", display_name: "Islas Marshall" },
  { iso_2: "MK", display_name: "Macedonia del Norte" },
  { iso_2: "ML", display_name: "Malí" },
  { iso_2: "MM", display_name: "Myanmar" },
  { iso_2: "MN", display_name: "Mongolia" },
  { iso_2: "MR", display_name: "Mauritania" },
  { iso_2: "MT", display_name: "Malta" },
  { iso_2: "MU", display_name: "Mauricio" },
  { iso_2: "MV", display_name: "Maldivas" },
  { iso_2: "MW", display_name: "Malaui" },
  { iso_2: "MX", display_name: "México" },
  { iso_2: "MY", display_name: "Malasia" },
  { iso_2: "MZ", display_name: "Mozambique" },
  { iso_2: "NA", display_name: "Namibia" },
  { iso_2: "NE", display_name: "Níger" },
  { iso_2: "NG", display_name: "Nigeria" },
  { iso_2: "NI", display_name: "Nicaragua" },
  { iso_2: "NL", display_name: "Países Bajos" },
  { iso_2: "NO", display_name: "Noruega" },
  { iso_2: "NP", display_name: "Nepal" },
  { iso_2: "NR", display_name: "Nauru" },
  { iso_2: "NZ", display_name: "Nueva Zelanda" },
  { iso_2: "OM", display_name: "Omán" },
  { iso_2: "PA", display_name: "Panamá" },
  { iso_2: "PE", display_name: "Perú" },
  { iso_2: "PG", display_name: "Papúa Nueva Guinea" },
  { iso_2: "PH", display_name: "Filipinas" },
  { iso_2: "PK", display_name: "Pakistán" },
  { iso_2: "PL", display_name: "Polonia" },
  { iso_2: "PT", display_name: "Portugal" },
  { iso_2: "PW", display_name: "Palaos" },
  { iso_2: "PY", display_name: "Paraguay" },
  { iso_2: "QA", display_name: "Catar" },
  { iso_2: "RO", display_name: "Rumania" },
  { iso_2: "RS", display_name: "Serbia" },
  { iso_2: "RU", display_name: "Rusia" },
  { iso_2: "RW", display_name: "Ruanda" },
  { iso_2: "SA", display_name: "Arabia Saudita" },
  { iso_2: "SB", display_name: "Islas Salomón" },
  { iso_2: "SC", display_name: "Seychelles" },
  { iso_2: "SD", display_name: "Sudán" },
  { iso_2: "SE", display_name: "Suecia" },
  { iso_2: "SG", display_name: "Singapur" },
  { iso_2: "SI", display_name: "Eslovenia" },
  { iso_2: "SK", display_name: "Eslovaquia" },
  { iso_2: "SL", display_name: "Sierra Leona" },
  { iso_2: "SM", display_name: "San Marino" },
  { iso_2: "SN", display_name: "Senegal" },
  { iso_2: "SO", display_name: "Somalia" },
  { iso_2: "SR", display_name: "Surinam" },
  { iso_2: "SS", display_name: "Sudán del Sur" },
  { iso_2: "ST", display_name: "Santo Tomé y Príncipe" },
  { iso_2: "SV", display_name: "El Salvador" },
  { iso_2: "SY", display_name: "Siria" },
  { iso_2: "SZ", display_name: "Esuatini" },
  { iso_2: "TD", display_name: "Chad" },
  { iso_2: "TG", display_name: "Togo" },
  { iso_2: "TH", display_name: "Tailandia" },
  { iso_2: "TJ", display_name: "Tayikistán" },
  { iso_2: "TL", display_name: "Timor Oriental" },
  { iso_2: "TM", display_name: "Turkmenistán" },
  { iso_2: "TN", display_name: "Túnez" },
  { iso_2: "TO", display_name: "Tonga" },
  { iso_2: "TR", display_name: "Turquía" },
  { iso_2: "TT", display_name: "Trinidad y Tobago" },
  { iso_2: "TV", display_name: "Tuvalu" },
  { iso_2: "TZ", display_name: "Tanzania" },
  { iso_2: "UA", display_name: "Ucrania" },
  { iso_2: "UG", display_name: "Uganda" },
  { iso_2: "US", display_name: "Estados Unidos" },
  { iso_2: "UY", display_name: "Uruguay" },
  { iso_2: "UZ", display_name: "Uzbekistán" },
  { iso_2: "VA", display_name: "Ciudad del Vaticano" },
  { iso_2: "VC", display_name: "San Vicente y las Granadinas" },
  { iso_2: "VE", display_name: "Venezuela" },
  { iso_2: "VN", display_name: "Vietnam" },
  { iso_2: "VU", display_name: "Vanuatu" },
  { iso_2: "WS", display_name: "Samoa" },
  { iso_2: "YE", display_name: "Yemen" },
  { iso_2: "ZA", display_name: "Sudáfrica" },
  { iso_2: "ZM", display_name: "Zambia" },
  { iso_2: "ZW", display_name: "Zimbabue" },
]

function getFlagEmoji(iso2: string) {
  const codePoints = iso2
    .toUpperCase()
    .split("")
    .map((c) => 127397 + c.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
}

type Props = {
  selected: CountryInput[]
  onChange: (countries: CountryInput[]) => void
}

export function CountryMultiSelect({ selected, onChange }: Props) {
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const filtered = COUNTRIES.filter(
    (c) =>
      c.display_name.toLowerCase().includes(query.toLowerCase()) ||
      c.iso_2.toLowerCase().includes(query.toLowerCase())
  )

  const isSelected = (iso2: string) => selected.some((s) => s.iso_2 === iso2)

  const toggle = (country: CountryInput) => {
    if (isSelected(country.iso_2)) {
      onChange(selected.filter((s) => s.iso_2 !== country.iso_2))
    } else {
      onChange([...selected, country])
    }
  }

  const remove = (iso2: string) => onChange(selected.filter((s) => s.iso_2 !== iso2))

  // Close on outside click
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
      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selected.map((c) => (
            <span
              key={c.iso_2}
              className="inline-flex items-center gap-x-1 bg-ui-bg-component border border-ui-border-base rounded-md px-2 py-0.5 text-xs text-ui-fg-base"
            >
              {getFlagEmoji(c.iso_2)} {c.display_name}
              <button
                type="button"
                onClick={() => remove(c.iso_2)}
                className="ml-0.5 text-ui-fg-muted hover:text-ui-fg-base"
              >
                <XMark className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <Input
          placeholder="Buscar país..."
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
                No se encontraron países
              </div>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.iso_2}
                  type="button"
                  className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-ui-bg-subtle text-ui-fg-base text-left"
                  onClick={() => {
                    toggle(c)
                    setQuery("")
                  }}
                >
                  <span>
                    {getFlagEmoji(c.iso_2)} {c.display_name}
                  </span>
                  {isSelected(c.iso_2) && (
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
