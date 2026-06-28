import { useEffect, useRef, useState } from "react"
import { Button, Input, Text } from "@medusajs/ui"
import { CheckMini, Plus, XMark } from "@medusajs/icons"
import {
  REGION_COUNTRY_OPTIONS,
  flagEmoji,
} from "../../lib/region-countries"
import type { CountryInput } from "../../lib/regions-api"

type Props = {
  selected: CountryInput[]
  onChange: (countries: CountryInput[]) => void
}

export function CountryConditionPicker({ selected, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const ref = useRef<HTMLDivElement>(null)

  const filtered = REGION_COUNTRY_OPTIONS.filter(
    (c) =>
      c.display_name.toLowerCase().includes(query.toLowerCase()) ||
      c.iso_2.toLowerCase().includes(query.toLowerCase())
  )

  const isSelected = (iso2: string) =>
    selected.some((s) => s.iso_2.toUpperCase() === iso2.toUpperCase())

  const toggle = (country: CountryInput) => {
    if (isSelected(country.iso_2)) {
      onChange(selected.filter((s) => s.iso_2.toUpperCase() !== country.iso_2.toUpperCase()))
    } else {
      onChange([...selected, country])
    }
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
    <div className="flex flex-col gap-y-3">
      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selected.map((c) => (
            <span
              key={c.iso_2}
              className="inline-flex items-center gap-x-1.5 rounded-lg border border-ui-border-base bg-ui-bg-subtle px-2.5 py-1 text-sm"
            >
              <span>{flagEmoji(c.iso_2)}</span>
              <span>{c.display_name}</span>
              <button
                type="button"
                className="text-ui-fg-muted hover:text-ui-fg-base"
                onClick={() => toggle(c)}
              >
                <XMark className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <Text size="small" className="text-ui-fg-muted">
          Agrega los países que forman parte de esta región.
        </Text>
      )}

      <div className="relative" ref={ref}>
        {!open ? (
          <Button
            type="button"
            variant="secondary"
            size="small"
            onClick={() => setOpen(true)}
          >
            <Plus />
            Agregar condición
          </Button>
        ) : (
          <div className="rounded-lg border border-ui-border-base bg-ui-bg-base p-3 shadow-elevation-card-rest">
            <Input
              placeholder="Buscar país..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              size="small"
              autoFocus
            />
            <div className="mt-2 max-h-48 overflow-y-auto">
              {filtered.map((c) => (
                <button
                  key={c.iso_2}
                  type="button"
                  className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm hover:bg-ui-bg-subtle"
                  onClick={() => toggle(c)}
                >
                  <span>
                    {flagEmoji(c.iso_2)} {c.display_name}
                  </span>
                  {isSelected(c.iso_2) ? (
                    <CheckMini className="text-ui-fg-interactive" />
                  ) : null}
                </button>
              ))}
            </div>
            <div className="mt-2 flex justify-end">
              <Button
                type="button"
                variant="transparent"
                size="small"
                onClick={() => setOpen(false)}
              >
                Listo
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
