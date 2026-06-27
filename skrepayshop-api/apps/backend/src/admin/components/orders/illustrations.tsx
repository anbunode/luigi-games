/** Ilustraciones SVG minimalistas inspiradas en el empty state de Shopify */

export function OrdersEmptyIllustration() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" aria-hidden="true" className="mx-auto">
      <circle cx="60" cy="60" r="54" fill="#F3F4F6" />
      <path d="M30 40C30 38.8954 30.8954 38 32 38H88C89.1046 38 90 38.8954 90 40V100H30V40Z" fill="white" stroke="#E5E7EB" strokeWidth="2" />
      <rect x="42" y="46" width="24" height="6" rx="3" fill="#1D4ED8" />
      <rect x="74" y="47" width="16" height="4" rx="2" fill="#E5E7EB" />
      
      {/* Bowl section */}
      <rect x="42" y="60" width="24" height="24" rx="4" fill="#E0F2FE" />
      <path d="M46 68C46 72 58 72 58 68V66H46V68Z" fill="#38BDF8" />
      <rect x="74" y="66" width="22" height="4" rx="2" fill="#E5E7EB" />
      <rect x="74" y="74" width="16" height="4" rx="2" fill="#E5E7EB" />

      {/* Watch section */}
      <rect x="42" y="90" width="24" height="24" rx="4" fill="#FFEDD5" />
      <rect x="50" y="94" width="8" height="16" rx="2" fill="#F97316" />
      <rect x="74" y="96" width="22" height="4" rx="2" fill="#E5E7EB" />
      <rect x="74" y="104" width="16" height="4" rx="2" fill="#E5E7EB" />

      {/* Green Folder Foreground */}
      <path d="M22 84H98L90 106H30L22 84Z" fill="#059669" />
      <path d="M22 84H50L54 90H66L70 84H98" stroke="#10B981" strokeWidth="2" strokeLinejoin="round" />
      <path d="M22 84H50L54 90H66L70 84H98V104C98 105.105 97.1046 106 96 106H24C22.8954 106 22 105.105 22 104V84Z" fill="#059669" />
    </svg>
  )
}

export function DraftOrdersEmptyIllustration() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" aria-hidden="true" className="mx-auto">
      <circle cx="60" cy="60" r="54" fill="#F3F4F6" />
      <path d="M30 40C30 38.8954 30.8954 38 32 38H88C89.1046 38 90 38.8954 90 40V100H30V40Z" fill="white" stroke="#E5E7EB" strokeWidth="2" />
      
      {/* T-Shirt section */}
      <rect x="42" y="50" width="28" height="28" rx="4" fill="#FEE2E2" />
      <path d="M48 56L51 54H61L64 56L66 62L62 64V72H50V64L46 62L48 56Z" fill="#EF4444" />
      
      <rect x="78" y="54" width="6" height="4" rx="2" fill="#EF4444" />
      <rect x="78" y="62" width="12" height="4" rx="2" fill="#E5E7EB" />
      <rect x="78" y="70" width="12" height="4" rx="2" fill="#E5E7EB" />

      {/* Light lines */}
      <rect x="42" y="86" width="36" height="4" rx="2" fill="#E5E7EB" />
      <rect x="42" y="94" width="24" height="4" rx="2" fill="#E5E7EB" />

      {/* Green Folder Foreground */}
      <path d="M22 84H98L90 106H30L22 84Z" fill="#059669" />
      <path d="M22 84H50L54 90H66L70 84H98V104C98 105.105 97.1046 106 96 106H24C22.8954 106 22 105.105 22 104V84Z" fill="#059669" />
    </svg>
  )
}

export function AbandonedCheckoutIllustration() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" aria-hidden="true" className="mx-auto">
      <circle cx="60" cy="60" r="54" fill="#F3F4F6" />
      <path d="M36 50L44 50L54 74H84" stroke="#059669" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M48 50H92L84 74H54" fill="#A7F3D0" />
      <circle cx="56" cy="84" r="5" fill="#059669" />
      <circle cx="80" cy="84" r="5" fill="#059669" />
      
      <rect x="52" y="40" width="24" height="24" rx="4" fill="#9CA3AF" />
      <path d="M60 40V36C60 33.7909 61.7909 32 64 32C66.2091 32 68 33.7909 68 36V40" stroke="#9CA3AF" strokeWidth="3" />

      <circle cx="92" cy="40" r="14" fill="#F87171" stroke="white" strokeWidth="2" />
      <path d="M86 34L98 46M98 34L86 46" stroke="white" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}
