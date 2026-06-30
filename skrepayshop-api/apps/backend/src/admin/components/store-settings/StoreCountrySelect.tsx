import { Select, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import {
  countryDisplayName,
  countryFlagEmoji,
  fetchUniversalCountries,
} from "../../lib/store-settings-api"

type StoreCountrySelectProps = {
  value: string
  onValueChange: (value: string) => void
  disabled?: boolean
}

export function StoreCountrySelect({
  value,
  onValueChange,
  disabled = false,
}: StoreCountrySelectProps) {
  const countriesQuery = useQuery({
    queryKey: ["skrepay", "countries"],
    queryFn: fetchUniversalCountries,
    staleTime: 1000 * 60 * 60,
  })

  const countries = countriesQuery.data ?? []
  const selected = value.toLowerCase()

  const selectedLabel = useMemo(() => {
    const match = countries.find((country) => country.iso_2 === selected)
    return match?.display_name ?? countryDisplayName(selected) ?? selected.toUpperCase()
  }, [countries, selected])

  const flag = countryFlagEmoji(selected)

  return (
    <Select
      value={selected}
      disabled={disabled || countriesQuery.isPending}
      onValueChange={(next) => onValueChange(next.toLowerCase())}
    >
      <Select.Trigger>
        <Select.Value placeholder="Seleccionar país">
          <span className="flex items-center gap-x-2">
            {flag ? <span aria-hidden>{flag}</span> : null}
            <span>{selectedLabel}</span>
          </span>
        </Select.Value>
      </Select.Trigger>
      <Select.Content className="max-h-72">
        {countriesQuery.isPending ? (
          <div className="px-3 py-2">
            <Text size="small" className="text-ui-fg-subtle">
              Cargando países…
            </Text>
          </div>
        ) : countries.length === 0 ? (
          <div className="px-3 py-2">
            <Text size="small" className="text-ui-fg-subtle">
              No hay países disponibles
            </Text>
          </div>
        ) : (
          countries.map((country) => {
            const itemFlag = countryFlagEmoji(country.iso_2)

            return (
              <Select.Item key={country.iso_2} value={country.iso_2}>
                <span className="flex items-center gap-x-2">
                  {itemFlag ? <span aria-hidden>{itemFlag}</span> : null}
                  <span>{country.display_name}</span>
                </span>
              </Select.Item>
            )
          })
        )}
      </Select.Content>
    </Select>
  )
}
