import { Text } from "@medusajs/ui"
import { flagEmoji } from "../../lib/region-countries"
import type { RegionCountry } from "../../lib/regions-api"

type Props = {
  countries: RegionCountry[]
  max?: number
}

export function RegionCountriesCell({ countries, max = 4 }: Props) {
  if (!countries?.length) {
    return (
      <Text size="small" className="text-ui-fg-muted">
        Sin países
      </Text>
    )
  }

  const visible = countries.slice(0, max)
  const rest = countries.length - visible.length

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {visible.map((c) => (
        <span
          key={c.iso_2}
          className="inline-flex items-center gap-x-1.5 text-sm text-ui-fg-base"
        >
          <span aria-hidden>{flagEmoji(c.iso_2)}</span>
          <span>{c.display_name}</span>
        </span>
      ))}
      {rest > 0 ? (
        <Text size="small" className="text-ui-fg-muted">
          +{rest}
        </Text>
      ) : null}
    </div>
  )
}
