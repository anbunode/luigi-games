import { Select, toast } from "@medusajs/ui"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useMemo } from "react"
import {
  type StoreCurrencyOption,
  updateStoreDefaultCurrency,
} from "../../lib/store-settings-api"

type StoreDefaultCurrencySelectProps = {
  storeId: string
  value: string | null
  currencies: StoreCurrencyOption[]
}

export function StoreDefaultCurrencySelect({
  storeId,
  value,
  currencies,
}: StoreDefaultCurrencySelectProps) {
  const queryClient = useQueryClient()

  const options = useMemo(() => {
    const seen = new Set<string>()

    return currencies
      .map((row) => row.currency_code.toLowerCase())
      .filter((code) => {
        if (!code || seen.has(code)) {
          return false
        }

        seen.add(code)
        return true
      })
      .sort((left, right) => left.localeCompare(right))
  }, [currencies])

  const selected = (value ?? options[0] ?? "usd").toLowerCase()

  const mutation = useMutation({
    mutationFn: (nextCode: string) =>
      updateStoreDefaultCurrency(storeId, currencies, nextCode),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["skrepay", "store-settings", "snapshot"],
      })
      void queryClient.invalidateQueries({ queryKey: ["store"] })
      toast.success("Moneda predeterminada actualizada")
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo actualizar la moneda predeterminada"
      )
    },
  })

  if (!options.length) {
    return null
  }

  return (
    <Select
      size="small"
      value={selected}
      disabled={mutation.isPending}
      onValueChange={(next) => {
        if (next.toLowerCase() === selected) {
          return
        }

        mutation.mutate(next)
      }}
    >
      <Select.Trigger className="bg-ui-bg-subtle h-7 min-h-7 rounded-full border-0 px-3 shadow-none">
        <Select.Value />
      </Select.Trigger>
      <Select.Content>
        {options.map((code) => (
          <Select.Item key={code} value={code}>
            {code.toUpperCase()}
          </Select.Item>
        ))}
      </Select.Content>
    </Select>
  )
}
