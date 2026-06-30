import type {
  AuthMfaFactorResponse,
  AuthMfaListResponse,
  AuthMfaRecoveryCodesResponse,
  AuthMfaSetupResponse,
} from "@medusajs/js-sdk"
import type { AuthTypes } from "@medusajs/types"
import { adminFetch } from "./admin-api"

export async function listAuthMfaFactors(): Promise<AuthMfaListResponse> {
  return adminFetch<AuthMfaListResponse>("/auth/mfa/factors")
}

export async function startAuthMfa(payload: {
  provider: AuthTypes.AuthMfaProviderMethod
  label?: string | null
  issuer?: string
  metadata?: Record<string, unknown> | null
}): Promise<AuthMfaSetupResponse> {
  return adminFetch<AuthMfaSetupResponse>("/auth/mfa/factors", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function verifyAuthMfa(
  id: string,
  payload: { code: string }
): Promise<AuthMfaFactorResponse> {
  return adminFetch<AuthMfaFactorResponse>(`/auth/mfa/factors/${id}/verify`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function disableAuthMfa(
  id: string,
  payload?: {
    method?: AuthTypes.AuthMfaChallengeMethod
    code?: string
  }
): Promise<AuthMfaFactorResponse> {
  return adminFetch<AuthMfaFactorResponse>(`/auth/mfa/factors/${id}`, {
    method: "DELETE",
    body: JSON.stringify(payload ?? {}),
  })
}

export async function generateAuthMfaRecoveryCodes(payload?: {
  count?: number
}): Promise<AuthMfaRecoveryCodesResponse> {
  return adminFetch<AuthMfaRecoveryCodesResponse>("/auth/mfa/recovery-codes", {
    method: "POST",
    body: JSON.stringify(payload ?? {}),
  })
}
