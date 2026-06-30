import { Key, ShieldCheck } from "@medusajs/icons"
import type { AuthMfaSetupResponse } from "@medusajs/js-sdk"
import type { AuthTypes } from "@medusajs/types"
import {
  Badge,
  Button,
  Text,
  toast,
  usePrompt,
} from "@medusajs/ui"
import { useMemo, useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import {
  useDisableStoreAuthMfa,
  useStartStoreAuthMfa,
  useStoreAuthMfa,
} from "../../hooks/use-store-mfa"
import { StoreMfaDisableModal } from "./StoreMfaDisableModal"
import { StoreMfaSetupModal } from "./StoreMfaSetupModal"

const MFA_DISABLE_CODE_REQUIRED_ERROR =
  "MFA verification code is required to disable MFA"

function SettingsCard({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-ui-border-base bg-ui-bg-base shadow-borders-base">
      {children}
    </div>
  )
}

export function StoreMfaSection() {
  const { t } = useTranslation()
  const prompt = usePrompt()
  const { data, isPending } = useStoreAuthMfa()
  const factors = data?.mfa_factors ?? []
  const [setupResponse, setSetupResponse] =
    useState<AuthMfaSetupResponse | null>(null)
  const [disableChallengeFactor, setDisableChallengeFactor] =
    useState<AuthTypes.AuthMfaDTO | null>(null)
  const { mutateAsync: startMfa, isPending: isStarting } = useStartStoreAuthMfa()

  const enabledFactor = useMemo(
    () => factors.find((factor) => factor.status === "enabled"),
    [factors]
  )

  const pendingFactor = useMemo(
    () => factors.find((factor) => factor.status === "pending"),
    [factors]
  )

  const { mutateAsync: disableMfa, isPending: isDisabling } =
    useDisableStoreAuthMfa(enabledFactor?.id ?? "")
  const { mutateAsync: cancelPendingMfa, isPending: isCancellingPending } =
    useDisableStoreAuthMfa(pendingFactor?.id ?? "")

  const handleSetup = async () => {
    try {
      if (pendingFactor) {
        await cancelPendingMfa()
      }

      const response = await startMfa({
        provider: "totp",
        label: t("profile.mfa.authenticatorApp"),
      })

      setSetupResponse(response)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("profile.mfa.setupError"))
    }
  }

  const handleDisable = async () => {
    if (!enabledFactor) {
      return
    }

    const confirmed = await prompt({
      title: t("profile.mfa.disableTitle"),
      description: t("profile.mfa.disableDescription"),
      confirmText: t("actions.disable"),
      cancelText: t("actions.cancel"),
      variant: "danger",
    })

    if (!confirmed) {
      return
    }

    try {
      await disableMfa()
      toast.success(t("profile.mfa.disableSuccess"))
    } catch (e) {
      if (
        e instanceof Error &&
        e.message.includes(MFA_DISABLE_CODE_REQUIRED_ERROR)
      ) {
        setDisableChallengeFactor(enabledFactor)
        return
      }

      toast.error(
        e instanceof Error ? e.message : t("profile.mfa.disableError")
      )
    }
  }

  return (
    <>
      <SettingsCard>
        <div className="flex items-center justify-between gap-x-4 px-5 py-4">
          <div className="min-w-0">
            <Text size="small" weight="plus">
              {t("profile.mfa.title")}
            </Text>
            <Text size="small" className="text-ui-fg-subtle mt-0.5">
              {t("profile.mfa.description")}
            </Text>
          </div>
          {enabledFactor ? (
            <Button
              size="small"
              variant="danger"
              isLoading={isDisabling}
              onClick={() => void handleDisable()}
            >
              {t("actions.disable")}
            </Button>
          ) : (
            <Button
              size="small"
              variant="secondary"
              isLoading={isStarting || isCancellingPending}
              disabled={isPending}
              onClick={() => void handleSetup()}
            >
              {t("actions.enable")}
            </Button>
          )}
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 border-t border-ui-border-base px-5 py-4">
          <Text size="small" weight="plus">
            {t("profile.mfa.status")}
          </Text>
          <div>
            {enabledFactor ? (
              <Badge color="green" size="2xsmall">
                {t("profile.mfa.enabled")}
              </Badge>
            ) : pendingFactor ? (
              <Badge color="orange" size="2xsmall">
                {t("profile.mfa.pending")}
              </Badge>
            ) : (
              <Badge color="grey" size="2xsmall">
                {t("profile.mfa.disabled")}
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 border-t border-ui-border-base px-5 py-4">
          <Text size="small" weight="plus">
            {t("profile.mfa.method")}
          </Text>
          <div className="flex items-center gap-x-2">
            {enabledFactor || pendingFactor ? (
              <>
                <ShieldCheck className="text-ui-fg-subtle" />
                <Text size="small" leading="compact">
                  {t("profile.mfa.authenticatorApp")}
                </Text>
              </>
            ) : (
              <>
                <Key className="text-ui-fg-muted" />
                <Text size="small" leading="compact" className="text-ui-fg-subtle">
                  {t("profile.mfa.noMethod")}
                </Text>
              </>
            )}
          </div>
        </div>
      </SettingsCard>

      {setupResponse ? (
        <StoreMfaSetupModal
          open
          setup={setupResponse}
          onOpenChange={(open) => {
            if (!open) {
              setSetupResponse(null)
            }
          }}
        />
      ) : null}

      {disableChallengeFactor ? (
        <StoreMfaDisableModal
          open
          factor={disableChallengeFactor}
          onOpenChange={(open) => {
            if (!open) {
              setDisableChallengeFactor(null)
            }
          }}
          onSuccess={() => {
            setDisableChallengeFactor(null)
            toast.success(t("profile.mfa.disableSuccess"))
          }}
        />
      ) : null}
    </>
  )
}
