const DEFAULT_LOCALE = "es"
const APPLIED_FLAG = "skrepay_default_locale_v1"

type I18nLike = {
  language: string
  changeLanguage: (code: string) => Promise<unknown>
}

/**
 * SkrepayShop usa español como idioma del panel por defecto.
 * Medusa ya incluye es.json; esto fuerza "es" en la primera sesión.
 * El usuario puede cambiar a otro idioma en Perfil → Editar perfil → Idioma.
 */
export function applySkrepayDefaultLocale(i18n: I18nLike): void {
  if (typeof window === "undefined") {
    return
  }

  try {
    if (localStorage.getItem(APPLIED_FLAG)) {
      return
    }
  } catch {
    // ignore storage errors
  }

  if (i18n.language.startsWith(DEFAULT_LOCALE)) {
    try {
      localStorage.setItem(APPLIED_FLAG, "1")
    } catch {
      // ignore
    }
    return
  }

  void i18n.changeLanguage(DEFAULT_LOCALE).finally(() => {
    try {
      localStorage.setItem(APPLIED_FLAG, "1")
    } catch {
      // ignore
    }
  })
}
