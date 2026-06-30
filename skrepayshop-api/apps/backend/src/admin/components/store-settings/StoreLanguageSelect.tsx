import { Select, toast } from "@medusajs/ui"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { ADMIN_LANGUAGES } from "../../lib/admin-languages"

export function StoreLanguageSelect() {
  const { i18n } = useTranslation()
  const [isChanging, setIsChanging] = useState(false)

  const options = useMemo(
    () =>
      [...ADMIN_LANGUAGES].sort((left, right) =>
        left.display_name.localeCompare(right.display_name)
      ),
    []
  )

  const selected =
    options.find((language) => language.code === i18n.language)?.code ??
    i18n.language

  return (
    <Select
      size="small"
      value={selected}
      disabled={isChanging}
      onValueChange={(next) => {
        if (next === selected) {
          return
        }

        setIsChanging(true)

        void i18n
          .changeLanguage(next)
          .then(() => {
            toast.success("Idioma actualizado")
          })
          .catch((error: unknown) => {
            toast.error(
              error instanceof Error
                ? error.message
                : "No se pudo cambiar el idioma"
            )
          })
          .finally(() => {
            setIsChanging(false)
          })
      }}
    >
      <Select.Trigger className="bg-ui-bg-subtle h-7 min-h-7 min-w-[160px] rounded-full border-0 px-3 shadow-none">
        <Select.Value />
      </Select.Trigger>
      <Select.Content>
        {options.map((language) => (
          <Select.Item key={language.code} value={language.code}>
            {language.display_name}
          </Select.Item>
        ))}
      </Select.Content>
    </Select>
  )
}
