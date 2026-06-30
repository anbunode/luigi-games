const DIAL_CODES: Record<string, string> = {
  ac: "247",
  ad: "376",
  ae: "971",
  af: "93",
  ag: "1",
  ai: "1",
  al: "355",
  am: "374",
  ao: "244",
  ar: "54",
  as: "1",
  at: "43",
  au: "61",
  aw: "297",
  ax: "358",
  az: "994",
  ba: "387",
  bb: "1",
  bd: "880",
  be: "32",
  bf: "226",
  bg: "359",
  bh: "973",
  bi: "257",
  bj: "229",
  bl: "590",
  bm: "1",
  bn: "673",
  bo: "591",
  bq: "599",
  br: "55",
  bs: "1",
  bt: "975",
  bw: "267",
  by: "375",
  bz: "501",
  ca: "1",
  cc: "61",
  cd: "243",
  cf: "236",
  cg: "242",
  ch: "41",
  ci: "225",
  ck: "682",
  cl: "56",
  cm: "237",
  cn: "86",
  co: "57",
  cr: "506",
  cu: "53",
  cv: "238",
  cw: "599",
  cx: "61",
  cy: "357",
  cz: "420",
  de: "49",
  dj: "253",
  dk: "45",
  dm: "1",
  do: "1",
  dz: "213",
  ec: "593",
  ee: "372",
  eg: "20",
  eh: "212",
  er: "291",
  es: "34",
  et: "251",
  fi: "358",
  fj: "679",
  fk: "500",
  fm: "691",
  fo: "298",
  fr: "33",
  ga: "241",
  gb: "44",
  gd: "1",
  ge: "995",
  gf: "594",
  gg: "44",
  gh: "233",
  gi: "350",
  gl: "299",
  gm: "220",
  gn: "224",
  gp: "590",
  gq: "240",
  gr: "30",
  gt: "502",
  gu: "1",
  gw: "245",
  gy: "592",
  hk: "852",
  hn: "504",
  hr: "385",
  ht: "509",
  hu: "36",
  id: "62",
  ie: "353",
  il: "972",
  im: "44",
  in: "91",
  io: "246",
  iq: "964",
  ir: "98",
  is: "354",
  it: "39",
  je: "44",
  jm: "1",
  jo: "962",
  jp: "81",
  ke: "254",
  kg: "996",
  kh: "855",
  ki: "686",
  km: "269",
  kn: "1",
  kp: "850",
  kr: "82",
  kw: "965",
  ky: "1",
  kz: "7",
  la: "856",
  lb: "961",
  lc: "1",
  li: "423",
  lk: "94",
  lr: "231",
  ls: "266",
  lt: "370",
  lu: "352",
  lv: "371",
  ly: "218",
  ma: "212",
  mc: "377",
  md: "373",
  me: "382",
  mf: "590",
  mg: "261",
  mh: "692",
  mk: "389",
  ml: "223",
  mm: "95",
  mn: "976",
  mo: "853",
  mp: "1",
  mq: "596",
  mr: "222",
  ms: "1",
  mt: "356",
  mu: "230",
  mv: "960",
  mw: "265",
  mx: "52",
  my: "60",
  mz: "258",
  na: "264",
  nc: "687",
  ne: "227",
  nf: "672",
  ng: "234",
  ni: "505",
  nl: "31",
  no: "47",
  np: "977",
  nr: "674",
  nu: "683",
  nz: "64",
  om: "968",
  pa: "507",
  pe: "51",
  pf: "689",
  pg: "675",
  ph: "63",
  pk: "92",
  pl: "48",
  pm: "508",
  pr: "1",
  ps: "970",
  pt: "351",
  pw: "680",
  py: "595",
  qa: "974",
  re: "262",
  ro: "40",
  rs: "381",
  ru: "7",
  rw: "250",
  sa: "966",
  sb: "677",
  sc: "248",
  sd: "249",
  se: "46",
  sg: "65",
  sh: "290",
  si: "386",
  sj: "47",
  sk: "421",
  sl: "232",
  sm: "378",
  sn: "221",
  so: "252",
  sr: "597",
  ss: "211",
  st: "239",
  sv: "503",
  sx: "1",
  sy: "963",
  sz: "268",
  tc: "1",
  td: "235",
  tg: "228",
  th: "66",
  tj: "992",
  tk: "690",
  tl: "670",
  tm: "993",
  tn: "216",
  to: "676",
  tr: "90",
  tt: "1",
  tv: "688",
  tw: "886",
  tz: "255",
  ua: "380",
  ug: "256",
  us: "1",
  uy: "598",
  uz: "998",
  va: "39",
  vc: "1",
  ve: "58",
  vg: "1",
  vi: "1",
  vn: "84",
  vu: "678",
  wf: "681",
  ws: "685",
  xk: "383",
  ye: "967",
  yt: "262",
  za: "27",
  zm: "260",
  zw: "263",
}

const DIAL_CODE_LOOKUP = Object.entries(DIAL_CODES)
  .map(([iso2, dialCode]) => ({ iso2, dialCode }))
  .sort((left, right) => right.dialCode.length - left.dialCode.length)

export function getDialCodeForCountry(iso2: string | null | undefined): string {
  if (!iso2) {
    return "1"
  }

  return DIAL_CODES[iso2.toLowerCase()] ?? "1"
}

export function formatDialCodeLabel(iso2: string): string {
  return `+${getDialCodeForCountry(iso2)}`
}

export function buildInternationalPhone(
  countryCode: string,
  nationalNumber: string
): string {
  const digits = nationalNumber.replace(/\D/g, "")

  if (!digits) {
    return ""
  }

  const dialCode = getDialCodeForCountry(countryCode)
  return `+${dialCode}${digits}`
}

export function parseInternationalPhone(
  phone: string | null | undefined,
  fallbackCountry = "us"
): { countryCode: string; nationalNumber: string } {
  const raw = (phone ?? "").trim()

  if (!raw) {
    return { countryCode: fallbackCountry.toLowerCase(), nationalNumber: "" }
  }

  if (raw.startsWith("+")) {
    const digits = raw.slice(1).replace(/\D/g, "")

    for (const entry of DIAL_CODE_LOOKUP) {
      if (digits.startsWith(entry.dialCode)) {
        return {
          countryCode: entry.iso2,
          nationalNumber: digits.slice(entry.dialCode.length),
        }
      }
    }
  }

  return {
    countryCode: fallbackCountry.toLowerCase(),
    nationalNumber: raw.replace(/\D/g, ""),
  }
}

export function formatNationalPhoneDisplay(nationalNumber: string): string {
  const digits = nationalNumber.replace(/\D/g, "")

  if (digits.length <= 3) {
    return digits
  }

  if (digits.length <= 6) {
    return `${digits.slice(0, 3)} ${digits.slice(3)}`
  }

  if (digits.length <= 10) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
  }

  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)} ${digits.slice(10)}`
}
