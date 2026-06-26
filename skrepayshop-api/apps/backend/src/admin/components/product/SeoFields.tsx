import { Input, Label, Text, Textarea } from "@medusajs/ui"
import { SEO_DESCRIPTION_MAX, SEO_TITLE_MAX } from "../../lib/product-metadata"

type SeoFieldsProps = {
  title: string
  description: string
  onTitleChange: (value: string) => void
  onDescriptionChange: (value: string) => void
}

function CharCounter({
  current,
  max,
}: {
  current: number
  max: number
}) {
  const overLimit = current > max

  return (
    <Text
      size="xsmall"
      className={overLimit ? "text-ui-fg-error" : "text-ui-fg-subtle"}
    >
      {current}/{max} caracteres recomendados
    </Text>
  )
}

export function SeoFields({
  title,
  description,
  onTitleChange,
  onDescriptionChange,
}: SeoFieldsProps) {
  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex flex-col gap-y-2">
        <Label>Título de página</Label>
        <Input
          value={title}
          placeholder="Título optimizado para buscadores"
          onChange={(event) => onTitleChange(event.target.value)}
        />
        <CharCounter current={title.length} max={SEO_TITLE_MAX} />
      </div>
      <div className="flex flex-col gap-y-2">
        <Label>Meta descripción</Label>
        <Textarea
          rows={4}
          value={description}
          placeholder="Descripción breve que aparecerá en los resultados de búsqueda"
          onChange={(event) => onDescriptionChange(event.target.value)}
        />
        <CharCounter current={description.length} max={SEO_DESCRIPTION_MAX} />
      </div>
    </div>
  )
}
