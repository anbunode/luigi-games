import { Button, Input, Text } from "@medusajs/ui"
import { XMark } from "@medusajs/icons"
import { useQuery } from "@tanstack/react-query"
import { useDeferredValue, useEffect, useRef, useState } from "react"
import {
  searchDraftCustomers,
  type DraftCustomer,
} from "../../lib/draft-orders-api"

const MIN_QUERY_LENGTH = 2

type DraftCustomerSearchProps = {
  value: DraftCustomer | null
  onChange: (customer: DraftCustomer | null) => void
}

export function DraftCustomerSearch({
  value,
  onChange,
}: DraftCustomerSearchProps) {
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const debouncedQuery = useDeferredValue(query.trim())

  const customersQuery = useQuery({
    queryKey: ["skrepay", "draft-orders", "customers", debouncedQuery],
    queryFn: () => searchDraftCustomers(debouncedQuery),
    enabled: debouncedQuery.length >= MIN_QUERY_LENGTH && !value,
    retry: 1,
  })

  const customers = customersQuery.data ?? []
  const canSearch = debouncedQuery.length >= MIN_QUERY_LENGTH && !value

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", onPointerDown)
    return () => document.removeEventListener("mousedown", onPointerDown)
  }, [])

  if (value) {
    const name = [value.first_name, value.last_name].filter(Boolean).join(" ")

    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-ui-border-base px-3 py-2">
        <div className="min-w-0">
          <Text size="small" weight="plus">
            {value.email}
          </Text>
          {name ? (
            <Text size="small" className="text-ui-fg-subtle truncate">
              {name}
            </Text>
          ) : null}
        </div>
        <Button
          type="button"
          size="small"
          variant="transparent"
          onClick={() => onChange(null)}
        >
          <XMark />
        </Button>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative">
      <Input
        value={query}
        placeholder="Buscar por correo o nombre"
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          setQuery(event.target.value)
          setOpen(true)
        }}
      />

      {open ? (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-lg border border-ui-border-base bg-ui-bg-base shadow-elevation-modal">
          {query.trim().length < MIN_QUERY_LENGTH ? (
            <div className="px-3 py-4">
              <Text size="small" className="text-ui-fg-subtle">
                Escribe al menos {MIN_QUERY_LENGTH} caracteres para buscar
                clientes.
              </Text>
            </div>
          ) : customersQuery.isLoading ? (
            <div className="px-3 py-4">
              <Text size="small" className="text-ui-fg-subtle">
                Buscando clientes…
              </Text>
            </div>
          ) : customers.length ? (
            <div className="max-h-56 overflow-y-auto">
              {customers.map((customer) => {
                const name = [customer.first_name, customer.last_name]
                  .filter(Boolean)
                  .join(" ")

                return (
                  <button
                    key={customer.id}
                    type="button"
                    className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-ui-bg-base-hover"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      onChange(customer)
                      setQuery("")
                      setOpen(false)
                    }}
                  >
                    <Text size="small" weight="plus">
                      {customer.email}
                    </Text>
                    {name ? (
                      <Text size="small" className="text-ui-fg-subtle">
                        {name}
                      </Text>
                    ) : null}
                  </button>
                )
              })}
            </div>
          ) : canSearch && customersQuery.isFetched ? (
            <div className="px-3 py-4">
              <Text size="small" className="text-ui-fg-subtle">
                No se encontraron clientes.
              </Text>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
