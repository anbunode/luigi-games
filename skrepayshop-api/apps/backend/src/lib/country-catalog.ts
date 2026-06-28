export type CountryRecord = {
  iso_2: string
  iso_3: string
  num_code: number
  name: string
  display_name: string
}

export type CountryInput = {
  iso_2: string
  display_name: string
}

/** ISO 3166-1 — catálogo compartido entre admin y backend */
export const COUNTRY_CATALOG: CountryRecord[] = [
  { iso_2: "AD", iso_3: "and", num_code: 20, name: "Andorra", display_name: "Andorra" },
  { iso_2: "AE", iso_3: "are", num_code: 784, name: "United Arab Emirates", display_name: "Emiratos Árabes Unidos" },
  { iso_2: "AR", iso_3: "arg", num_code: 32, name: "Argentina", display_name: "Argentina" },
  { iso_2: "AT", iso_3: "aut", num_code: 40, name: "Austria", display_name: "Austria" },
  { iso_2: "AU", iso_3: "aus", num_code: 36, name: "Australia", display_name: "Australia" },
  { iso_2: "BE", iso_3: "bel", num_code: 56, name: "Belgium", display_name: "Bélgica" },
  { iso_2: "BO", iso_3: "bol", num_code: 68, name: "Bolivia", display_name: "Bolivia" },
  { iso_2: "BR", iso_3: "bra", num_code: 76, name: "Brazil", display_name: "Brasil" },
  { iso_2: "CA", iso_3: "can", num_code: 124, name: "Canada", display_name: "Canadá" },
  { iso_2: "CH", iso_3: "che", num_code: 756, name: "Switzerland", display_name: "Suiza" },
  { iso_2: "CL", iso_3: "chl", num_code: 152, name: "Chile", display_name: "Chile" },
  { iso_2: "CN", iso_3: "chn", num_code: 156, name: "China", display_name: "China" },
  { iso_2: "CO", iso_3: "col", num_code: 170, name: "Colombia", display_name: "Colombia" },
  { iso_2: "CR", iso_3: "cri", num_code: 188, name: "Costa Rica", display_name: "Costa Rica" },
  { iso_2: "CU", iso_3: "cub", num_code: 192, name: "Cuba", display_name: "Cuba" },
  { iso_2: "CZ", iso_3: "cze", num_code: 203, name: "Czechia", display_name: "Rep. Checa" },
  { iso_2: "DE", iso_3: "deu", num_code: 276, name: "Germany", display_name: "Alemania" },
  { iso_2: "DK", iso_3: "dnk", num_code: 208, name: "Denmark", display_name: "Dinamarca" },
  { iso_2: "DO", iso_3: "dom", num_code: 214, name: "Dominican Republic", display_name: "Rep. Dominicana" },
  { iso_2: "EC", iso_3: "ecu", num_code: 218, name: "Ecuador", display_name: "Ecuador" },
  { iso_2: "ES", iso_3: "esp", num_code: 724, name: "Spain", display_name: "España" },
  { iso_2: "FI", iso_3: "fin", num_code: 246, name: "Finland", display_name: "Finlandia" },
  { iso_2: "FR", iso_3: "fra", num_code: 250, name: "France", display_name: "Francia" },
  { iso_2: "GB", iso_3: "gbr", num_code: 826, name: "United Kingdom", display_name: "Reino Unido" },
  { iso_2: "GR", iso_3: "grc", num_code: 300, name: "Greece", display_name: "Grecia" },
  { iso_2: "GT", iso_3: "gtm", num_code: 320, name: "Guatemala", display_name: "Guatemala" },
  { iso_2: "HN", iso_3: "hnd", num_code: 340, name: "Honduras", display_name: "Honduras" },
  { iso_2: "IE", iso_3: "irl", num_code: 372, name: "Ireland", display_name: "Irlanda" },
  { iso_2: "IL", iso_3: "isr", num_code: 376, name: "Israel", display_name: "Israel" },
  { iso_2: "IN", iso_3: "ind", num_code: 356, name: "India", display_name: "India" },
  { iso_2: "IT", iso_3: "ita", num_code: 380, name: "Italy", display_name: "Italia" },
  { iso_2: "JP", iso_3: "jpn", num_code: 392, name: "Japan", display_name: "Japón" },
  { iso_2: "MX", iso_3: "mex", num_code: 484, name: "Mexico", display_name: "México" },
  { iso_2: "NI", iso_3: "nic", num_code: 558, name: "Nicaragua", display_name: "Nicaragua" },
  { iso_2: "NL", iso_3: "nld", num_code: 528, name: "Netherlands", display_name: "Países Bajos" },
  { iso_2: "NO", iso_3: "nor", num_code: 578, name: "Norway", display_name: "Noruega" },
  { iso_2: "PA", iso_3: "pan", num_code: 591, name: "Panama", display_name: "Panamá" },
  { iso_2: "PE", iso_3: "per", num_code: 604, name: "Peru", display_name: "Perú" },
  { iso_2: "PL", iso_3: "pol", num_code: 616, name: "Poland", display_name: "Polonia" },
  { iso_2: "PT", iso_3: "prt", num_code: 620, name: "Portugal", display_name: "Portugal" },
  { iso_2: "PY", iso_3: "pry", num_code: 600, name: "Paraguay", display_name: "Paraguay" },
  { iso_2: "SE", iso_3: "swe", num_code: 752, name: "Sweden", display_name: "Suecia" },
  { iso_2: "US", iso_3: "usa", num_code: 840, name: "United States", display_name: "Estados Unidos" },
  { iso_2: "UY", iso_3: "ury", num_code: 858, name: "Uruguay", display_name: "Uruguay" },
  { iso_2: "VE", iso_3: "ven", num_code: 862, name: "Venezuela", display_name: "Venezuela" },
]

const catalogByIso2 = new Map(
  COUNTRY_CATALOG.map((c) => [c.iso_2.toUpperCase(), c])
)

export function resolveCountryRecord(input: CountryInput): CountryRecord {
  const known = catalogByIso2.get(input.iso_2.toUpperCase())
  if (known) {
    return known
  }

  const iso2 = input.iso_2.toLowerCase()
  return {
    iso_2: iso2,
    iso_3: iso2,
    num_code: 0,
    name: input.display_name,
    display_name: input.display_name,
  }
}

export function countryInputsForAdmin(): CountryInput[] {
  return COUNTRY_CATALOG.map(({ iso_2, display_name }) => ({ iso_2, display_name }))
}
