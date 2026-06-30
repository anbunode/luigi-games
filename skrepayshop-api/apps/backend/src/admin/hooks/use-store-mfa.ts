import type { AuthMfaSetupResponse } from "@medusajs/js-sdk"
import type { AuthTypes } from "@medusajs/types"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  disableAuthMfa,
  generateAuthMfaRecoveryCodes,
  listAuthMfaFactors,
  startAuthMfa,
  verifyAuthMfa,
} from "../lib/store-mfa-api"

const MFA_QUERY_KEY = ["skrepay", "store-settings", "mfa"] as const

export function useStoreAuthMfa() {
  return useQuery({
    queryKey: MFA_QUERY_KEY,
    queryFn: listAuthMfaFactors,
  })
}

export function useStartStoreAuthMfa() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: {
      provider: AuthTypes.AuthMfaProviderMethod
      label?: string | null
      issuer?: string
      metadata?: Record<string, unknown> | null
    }) => startAuthMfa(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: MFA_QUERY_KEY })
    },
  })
}

export function useVerifyStoreAuthMfa(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: { code: string }) => verifyAuthMfa(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: MFA_QUERY_KEY })
    },
  })
}

export function useDisableStoreAuthMfa(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload?: {
      method?: AuthTypes.AuthMfaChallengeMethod
      code?: string
    }) => disableAuthMfa(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: MFA_QUERY_KEY })
    },
  })
}

export function useGenerateStoreAuthMfaRecoveryCodes() {
  return useMutation({
    mutationFn: (payload?: { count?: number }) =>
      generateAuthMfaRecoveryCodes(payload),
  })
}

export type { AuthMfaSetupResponse }
