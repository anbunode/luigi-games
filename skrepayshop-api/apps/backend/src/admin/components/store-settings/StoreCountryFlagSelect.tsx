import { Select, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import {
  countryDisplayName,
  countryFlagEmoji,
  fetchUniversalCountries,
} from "../../lib/store-settings-api"
import { formatDialCodeLabel } from "../../lib/phone-country-codes"

type StoreCountryFlagSelectProps = {
  value: string
  onValueChange: (value: string) => void
  disabled?: boolean
  showDialCode?: boolean
}

export function StoreCountryFlagSelect({
  value,
  onValueChange,
  disabled = false,
  showDialCode = false,
}: StoreCountryFlagSelectProps) {
  const countriesQuery = useQuery({
    queryKey: ["skrepay", "countries"],
    queryFn: fetchUniversalCountries,
    staleTime: 1000 * 60 * 60,
  })

  const countries = countriesQuery.data ?? []
  const selected = value.toLowerCase()
  const flag = countryFlagEmoji(selected)

  return (
    <Select
      value={selected}
      disabled={disabled || countriesQuery.isPending}
      onValueChange={(next) => onValueChange(next.toLowerCase())}
    >
      <Select.Trigger
        className={
          showDialCode
            ? "w-[108px] shrink-0"
            : "w-[72px] shrink-0 justify-center px-2"
        }
      >
        <Select.Value>
          <span className="flex items-center gap-x-1.5">
            {flag ? <span aria-hidden>{flag}</span> : null}
            {showDialCode ? (
              <span className="txt-compact-small">
                {formatDialCodeLabel(selected)}
              </span>
            ) : null}
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
        ) : (
          countries.map((country) => {
            const itemFlag = countryFlagEmoji(country.iso_2)

            return (
              <Select.Item key={country.iso_2} value={country.iso_2}>
                <span className="flex items-center gap-x-2">
                  {itemFlag ? <span aria-hidden>{itemFlag}</span> : null}
                  <span>{country.display_name}</span>
                  {showDialCode ? (
                    <span className="text-ui-fg-subtle">
                      {formatDialCodeLabel(country.iso_2)}
                    </span>
                  ) : null}
                </span>
              </Select.Item>
            )
          })
        )}
      </Select.Content>
    </Select>
  )
}

export function getCountryLabel(
  countries: Array<{ iso_2: string; display_name: string }>,
  iso2: string
) {
  const match = countries.find((country) => country.iso_2 === iso2.toLowerCase())
  return match?.display_name ?? countryDisplayName(iso2) ?? iso2.toUpperCase()
}
