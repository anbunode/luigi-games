import {
  Button,
  Container,
  Heading,
  Table,
  Text,
  Tooltip,
  TooltipProvider,
} from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { Link, Outlet, useMatch, useNavigate } from "react-router-dom"
import { adminFetch } from "../../lib/admin-api"

type DraftOrderRow = {
  id: string
  display_id?: number
  created_at?: string
  email?: string
  customer?: { email?: string }
  sales_channel?: { name?: string }
  region?: { name?: string }
}

type DraftOrdersResponse = {
  draft_orders: DraftOrderRow[]
  count: number
}

const LIST_FIELDS =
  "id,display_id,created_at,email,+customer.email,+sales_channel.name,+region.name"

function formatDraftDate(value?: string) {
  if (!value) {
    return { short: "-", full: "" }
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return { short: "-", full: "" }
  }

  return {
    short: date.toLocaleDateString(),
    full: date.toLocaleString(),
  }
}

const DraftOrdersListPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const isCreateRoute = useMatch("/draft-orders/create")

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["draft-orders", "list"],
    queryFn: () =>
      adminFetch<DraftOrdersResponse>(
        `/admin/draft-orders?limit=20&order=-created_at&fields=${encodeURIComponent(LIST_FIELDS)}`
      ),
    retry: 1,
    enabled: !isCreateRoute,
  })

  if (isCreateRoute) {
    return <Outlet />
  }

  const rows = data?.draft_orders ?? []

  return (
    <TooltipProvider>
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <Heading>{t("draftOrders.domain", "Draft Orders")}</Heading>
          <Button size="small" variant="secondary" asChild>
            <Link to="create">{t("actions.create", "Create")}</Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="px-6 py-10">
            <Text className="text-ui-fg-subtle">{t("general.loading", "Loading...")}</Text>
          </div>
        ) : isError ? (
          <div className="flex flex-col gap-3 px-6 py-10">
            <Text className="text-ui-fg-error">
              {t(
                "draftOrders.list.loadError",
                "No se pudieron cargar los borradores."
              )}
            </Text>
            <Text size="small" className="text-ui-fg-subtle">
              {error instanceof Error ? error.message : String(error)}
            </Text>
            <Button size="small" variant="secondary" onClick={() => refetch()}>
              {t("actions.retry", "Retry")}
            </Button>
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col gap-2 px-6 py-10">
            <Text weight="plus" size="large">
              {t(
                "draftOrders.list.noRecordsMessage",
                "No draft orders found"
              )}
            </Text>
            <Text className="text-ui-fg-subtle">
              {t(
                "draftOrders.list.description",
                "Create a new draft order to get started."
              )}
            </Text>
          </div>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>
                  {t("orders.fields.displayId", "Display ID")}
                </Table.HeaderCell>
                <Table.HeaderCell>{t("fields.createdAt", "Date")}</Table.HeaderCell>
                <Table.HeaderCell>
                  {t("fields.customer", "Customer")}
                </Table.HeaderCell>
                <Table.HeaderCell>
                  {t("fields.salesChannel", "Sales Channel")}
                </Table.HeaderCell>
                <Table.HeaderCell>{t("fields.region", "Region")}</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {rows.map((row) => {
                const createdAt = formatDraftDate(row.created_at)

                return (
                  <Table.Row
                    key={row.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`${row.id}`)}
                  >
                    <Table.Cell>#{row.display_id ?? "-"}</Table.Cell>
                    <Table.Cell>
                      {createdAt.full ? (
                        <Tooltip content={createdAt.full}>
                          <span>{createdAt.short}</span>
                        </Tooltip>
                      ) : (
                        createdAt.short
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      {row.customer?.email ?? row.email ?? "-"}
                    </Table.Cell>
                    <Table.Cell>{row.sales_channel?.name ?? "-"}</Table.Cell>
                    <Table.Cell>{row.region?.name ?? "-"}</Table.Cell>
                  </Table.Row>
                )
              })}
            </Table.Body>
          </Table>
        )}
      </Container>
    </TooltipProvider>
  )
}

export default DraftOrdersListPage
