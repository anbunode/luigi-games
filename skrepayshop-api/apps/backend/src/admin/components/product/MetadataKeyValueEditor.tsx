import { Plus, Trash } from "@medusajs/icons"
import { Button, IconButton, Input, Label } from "@medusajs/ui"
import {
  createMetadataRow,
  type MetadataRow,
} from "../../lib/product-metadata"

type MetadataKeyValueEditorProps = {
  rows: MetadataRow[]
  onChange: (rows: MetadataRow[]) => void
}

export function MetadataKeyValueEditor({
  rows,
  onChange,
}: MetadataKeyValueEditorProps) {
  const addRow = () => {
    onChange([...rows, createMetadataRow()])
  }

  const updateRow = (
    id: string,
    patch: Partial<Pick<MetadataRow, "key" | "value">>
  ) => {
    onChange(rows.map((row) => (row.id === id ? { ...row, ...patch } : row)))
  }

  const removeRow = (id: string) => {
    onChange(rows.filter((row) => row.id !== id))
  }

  return (
    <div className="flex flex-col gap-y-3">
      {rows.length === 0 ? (
        <p className="text-ui-fg-subtle text-sm">
          Sin metadatos personalizados. Agrega pares clave/valor.
        </p>
      ) : null}
      {rows.map((row) => (
        <div
          key={row.id}
          className="grid grid-cols-1 items-end gap-2 md:grid-cols-[1fr_1fr_auto]"
        >
          <div className="flex flex-col gap-y-2">
            <Label>Clave</Label>
            <Input
              value={row.key}
              placeholder="ej. material"
              onChange={(event) =>
                updateRow(row.id, { key: event.target.value })
              }
            />
          </div>
          <div className="flex flex-col gap-y-2">
            <Label>Valor</Label>
            <Input
              value={row.value}
              placeholder="ej. algodón"
              onChange={(event) =>
                updateRow(row.id, { value: event.target.value })
              }
            />
          </div>
          <IconButton
            type="button"
            variant="transparent"
            onClick={() => removeRow(row.id)}
          >
            <Trash />
          </IconButton>
        </div>
      ))}
      <Button
        type="button"
        variant="secondary"
        className="w-fit"
        onClick={addRow}
      >
        <Plus />
        Agregar campo
      </Button>
    </div>
  )
}
