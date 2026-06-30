import { Input } from "@medusajs/ui"
import { useEffect, useState } from "react"
import {
  buildInternationalPhone,
  formatNationalPhoneDisplay,
  parseInternationalPhone,
} from "../../lib/phone-country-codes"
import { StoreCountryFlagSelect } from "./StoreCountryFlagSelect"

type StorePhoneInputProps = {
  value: string
  defaultCountryCode?: string
  onChange: (fullPhone: string) => void
  disabled?: boolean
  id?: string
  placeholder?: string
}

export function StorePhoneInput({
  value,
  defaultCountryCode = "us",
  onChange,
  disabled = false,
  id,
  placeholder = "412 0605022",
}: StorePhoneInputProps) {
  const parsed = parseInternationalPhone(value, defaultCountryCode)
  const [countryCode, setCountryCode] = useState(parsed.countryCode)
  const [nationalNumber, setNationalNumber] = useState(
    formatNationalPhoneDisplay(parsed.nationalNumber)
  )

  useEffect(() => {
    const next = parseInternationalPhone(value, defaultCountryCode)
    setCountryCode(next.countryCode)
    setNationalNumber(formatNationalPhoneDisplay(next.nationalNumber))
  }, [value, defaultCountryCode])

  const emitChange = (nextCountry: string, nextNational: string) => {
    onChange(buildInternationalPhone(nextCountry, nextNational))
  }

  return (
    <div className="flex items-center gap-x-2">
      <StoreCountryFlagSelect
        value={countryCode}
        showDialCode
        disabled={disabled}
        onValueChange={(nextCountry) => {
          setCountryCode(nextCountry)
          emitChange(nextCountry, nationalNumber)
        }}
      />
      <Input
        id={id}
        type="tel"
        className="flex-1"
        disabled={disabled}
        value={nationalNumber}
        placeholder={placeholder}
        onChange={(event) => {
          const nextNational = formatNationalPhoneDisplay(event.target.value)
          setNationalNumber(nextNational)
          emitChange(countryCode, nextNational)
        }}
      />
    </div>
  )
}
