import { Button, Text } from "@medusajs/ui"
import type { ReactNode } from "react"
import { Link } from "react-router-dom"

type EmptyStateCardProps = {
  illustration: ReactNode
  title: string
  description: string
  primaryAction?: {
    label: string
    to?: string
    onClick?: () => void
  }
  footerLink?: {
    label: string
    href: string
  }
  secondaryPanel?: {
    title: string
    description: string
    action?: { label: string; to?: string; href?: string }
  }
}

export function EmptyStateCard({
  illustration,
  title,
  description,
  primaryAction,
  footerLink,
  secondaryPanel,
}: EmptyStateCardProps) {
  return (
    <div className="flex flex-col gap-y-6">
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col items-center px-6 py-20 text-center md:px-12 md:py-24">
          <div className="mb-6 flex justify-center">{illustration}</div>
          <Text size="large" weight="plus" className="text-gray-900 mb-2 font-semibold">
            {title}
          </Text>
          <Text size="small" className="text-gray-500 mb-6 max-w-[460px] leading-relaxed">
            {description}
          </Text>
          {primaryAction ? (
            primaryAction.to ? (
              <Button asChild variant="primary" size="small" className="bg-gray-900 hover:bg-gray-800 text-white">
                <Link to={primaryAction.to}>{primaryAction.label}</Link>
              </Button>
            ) : (
              <Button
                variant="primary"
                size="small"
                className="bg-gray-900 hover:bg-gray-800 text-white"
                onClick={primaryAction.onClick}
              >
                {primaryAction.label}
              </Button>
            )
          ) : null}
        </div>

        {secondaryPanel ? (
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-6 md:px-10">
            <div className="flex flex-col gap-y-4 md:flex-row md:items-center md:justify-between md:gap-x-8">
              <div className="text-left">
                <Text size="small" weight="plus" className="text-gray-900 mb-1 font-semibold">
                  {secondaryPanel.title}
                </Text>
                <Text size="small" className="text-gray-500 max-w-xl">
                  {secondaryPanel.description}
                </Text>
              </div>
              {secondaryPanel.action ? (
                secondaryPanel.action.to ? (
                  <Button asChild variant="secondary" size="small" className="shrink-0 bg-white shadow-sm">
                    <Link to={secondaryPanel.action.to}>
                      {secondaryPanel.action.label}
                    </Link>
                  </Button>
                ) : (
                  <Button asChild variant="secondary" size="small" className="shrink-0 bg-white shadow-sm">
                    <a
                      href={secondaryPanel.action.href}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {secondaryPanel.action.label}
                    </a>
                  </Button>
                )
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      {footerLink ? (
        <div className="text-center pt-2">
          <a
            href={footerLink.href}
            target="_blank"
            rel="noreferrer"
            className="text-gray-500 hover:text-gray-800 text-sm underline underline-offset-4 decoration-gray-300"
          >
            {footerLink.label}
          </a>
        </div>
      ) : null}
    </div>
  )
}
