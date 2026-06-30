import { Button, Heading, Hint, OtpInput, Text } from "@medusajs/ui"
import type { AuthTypes } from "@medusajs/types"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useDisableStoreAuthMfa } from "../../hooks/use-store-mfa"
import { StoreSettingsModalShell } from "./StoreSettingsModalShell"

type StoreMfaDisableModalProps = {
  open: boolean
  factor: AuthTypes.AuthMfaDTO
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function StoreMfaDisableModal({
  open,
  factor,
  onOpenChange,
  onSuccess,
}: StoreMfaDisableModalProps) {
  const { t } = useTranslation()
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const { mutateAsync, isPending } = useDisableStoreAuthMfa(factor.id)

  const handleDisable = async (nextCode = code) => {
    if (nextCode.length !== 6) {
      return
    }

    setError(null)

    try {
      await mutateAsync({
        method: factor.provider,
        code: nextCode,
      })
      onSuccess()
    } catch (e) {
      setError(e instanceof Error ? e.message : t("profile.mfa.disableError"))
      setCode("")
    }
  }

  return (
    <StoreSettingsModalShell
      open={open}
      onOpenChange={onOpenChange}
      title={t("profile.mfa.disableTitle")}
      maxWidthClassName="!max-w-[420px]"
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {t("actions.cancel")}
          </Button>
          <Button
            variant="danger"
            isLoading={isPending}
            disabled={code.length !== 6}
            onClick={() => void handleDisable()}
          >
            {t("actions.disable")}
          </Button>
        </>
      }
    >
      <div className="flex w-full flex-col items-center gap-y-6 text-center">
        <div>
          <Heading>{t("profile.mfa.disableTitle")}</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            {t("profile.mfa.disableChallengeDescription")}
          </Text>
        </div>
        <OtpInput
          value={code}
          onChange={setCode}
          onComplete={(value) => void handleDisable(value)}
          disabled={isPending}
          autoFocus
        />
        {error ? (
          <Hint className="inline-flex" variant="error">
            {error}
          </Hint>
        ) : null}
      </div>
    </StoreSettingsModalShell>
  )
}
