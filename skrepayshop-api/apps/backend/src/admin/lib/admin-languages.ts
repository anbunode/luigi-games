export type AdminLanguageOption = {
  code: string
  display_name: string
}

export const ADMIN_LANGUAGES: AdminLanguageOption[] = [
  { code: "bs", display_name: "Bosanski" },
  { code: "bg", display_name: "Български" },
  { code: "en", display_name: "English" },
  { code: "enGB", display_name: "English (UK)" },
  { code: "es", display_name: "Español" },
  { code: "el", display_name: "Ελληνικά" },
  { code: "de", display_name: "Deutsch" },
  { code: "fr", display_name: "Français" },
  { code: "he", display_name: "עברית" },
  { code: "hr", display_name: "Hrvatski" },
  { code: "hu", display_name: "Magyar" },
  { code: "it", display_name: "Italiano" },
  { code: "ja", display_name: "日本語" },
  { code: "pl", display_name: "Polski" },
  { code: "ptBR", display_name: "Português (Brasil)" },
  { code: "ptPT", display_name: "Português (Portugal)" },
  { code: "tr", display_name: "Türkçe" },
  { code: "th", display_name: "ไทย" },
  { code: "uk", display_name: "Українська" },
  { code: "ro", display_name: "Română" },
  { code: "mk", display_name: "Македонски" },
  { code: "mn", display_name: "Монгол" },
  { code: "ar", display_name: "العربية" },
  { code: "zhCN", display_name: "简体中文" },
  { code: "fa", display_name: "فارسی" },
  { code: "cs", display_name: "Čeština" },
  { code: "ru", display_name: "Русский" },
  { code: "lt", display_name: "Lietuviškai" },
  { code: "vi", display_name: "Tiếng Việt" },
  { code: "id", display_name: "Bahasa Indonesia" },
  { code: "ko", display_name: "한국어" },
  { code: "nl", display_name: "Nederlands" },
  { code: "zhTW", display_name: "繁體中文(臺灣)" },
].sort((left, right) => left.display_name.localeCompare(right.display_name))

export function resolveAdminLanguageLabel(code: string | undefined): string {
  if (!code) {
    return "—"
  }

  return (
    ADMIN_LANGUAGES.find((language) => language.code === code)?.display_name ??
    code
  )
}
