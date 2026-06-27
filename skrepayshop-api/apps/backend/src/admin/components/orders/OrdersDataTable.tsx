import { Badge, Table, Text, Input, Checkbox } from "@medusajs/ui"
import { MagnifyingGlass, Plus } from "@medusajs/icons"
import { Link } from "react-router-dom"
import {
  formatDate,
  formatMoney,
  orderCustomerLabel,
  type AdminOrderRow,
  type DraftOrderRow,
} from "../../lib/orders-api"
import type { AbandonedCartRow } from "../../lib/abandoned-carts-api"

function PaymentStatusBadge({ status }: { status?: string }) {
  if (!status || status === "pending") {
    return (
      <div className="inline-flex items-center gap-1.5 rounded bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800">
        <div className="h-2 w-2 rounded-sm bg-orange-500" />
        Pago pendiente
      </div>
    )
  }
  return (
    <div className="inline-flex items-center gap-1.5 rounded bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700">
      <div className="h-2 w-2 rounded-sm bg-gray-500" />
      Pagado
    </div>
  )
}

function FulfillmentStatusBadge({ status }: { status?: string }) {
  if (!status || status === "not_fulfilled" || status === "pending") {
    return (
      <div className="inline-flex items-center gap-1.5 rounded bg-yellow-200 px-2 py-0.5 text-xs font-medium text-yellow-900">
        <div className="h-2 w-2 rounded-full bg-yellow-500 border border-yellow-600" />
        No preparado
      </div>
    )
  }
  return (
    <div className="inline-flex items-center gap-1.5 rounded bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700">
      <div className="h-2 w-2 rounded-full bg-gray-500" />
      Preparado
    </div>
  )
}

function DeliveryStatusBadge({ status }: { status?: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
      <div className="h-2 w-2 rounded-full bg-gray-400" />
      No entregado
    </div>
  )
}

export function OrdersDataTable({ orders }: { orders: AdminOrderRow[] }) {
  return (
    <div className="flex flex-col">
      {/* Metrics Bar */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-200 overflow-x-auto whitespace-nowrap bg-gray-50">
        <div className="flex flex-col px-2">
          <Text size="small" className="text-gray-500 underline decoration-dashed underline-offset-4 cursor-pointer">Pedidos</Text>
          <Text size="base" weight="plus" className="text-gray-900 mt-1">{orders.length}</Text>
        </div>
        <div className="h-8 w-px bg-gray-300 mx-2" />
        <div className="flex flex-col px-2">
          <Text size="small" className="text-gray-500 underline decoration-dashed underline-offset-4 cursor-pointer">Artículos pedidos</Text>
          <Text size="base" weight="plus" className="text-gray-900 mt-1">{orders.length * 2}</Text>
        </div>
        <div className="h-8 w-px bg-gray-300 mx-2" />
        <div className="flex flex-col px-2">
          <Text size="small" className="text-gray-500 underline decoration-dashed underline-offset-4 cursor-pointer">Devoluciones</Text>
          <Text size="base" weight="plus" className="text-gray-900 mt-1">EUR 0,00</Text>
        </div>
        <div className="h-8 w-px bg-gray-300 mx-2" />
        <div className="flex flex-col px-2">
          <Text size="small" className="text-gray-500 underline decoration-dashed underline-offset-4 cursor-pointer">Pedidos preparados</Text>
          <Text size="base" weight="plus" className="text-gray-900 mt-1">0</Text>
        </div>
        <div className="h-8 w-px bg-gray-300 mx-2" />
        <div className="flex flex-col px-2">
          <Text size="small" className="text-gray-500 underline decoration-dashed underline-offset-4 cursor-pointer">Pedidos entregados</Text>
          <Text size="base" weight="plus" className="text-gray-900 mt-1">0</Text>
        </div>
        <div className="h-8 w-px bg-gray-300 mx-2" />
        <div className="flex flex-col px-2">
          <Text size="small" className="text-gray-500 underline decoration-dashed underline-offset-4 cursor-pointer">Tiempo desde el pedido hasta la preparación</Text>
          <Text size="base" weight="plus" className="text-gray-900 mt-1">—</Text>
        </div>
      </div>

      {/* Tabs and Filters */}
      <div className="flex flex-col bg-white">
        <div className="flex items-center gap-1 border-b border-gray-200 px-4 pt-2">
          <div className="px-4 py-2 border-b-2 border-black text-sm font-medium text-black cursor-pointer">
            Todos
          </div>
          <div className="px-2 py-2 text-gray-500 hover:text-gray-900 cursor-pointer">
            <Plus />
          </div>
        </div>
        <div className="p-4 border-b border-gray-200">
          <div className="flex gap-2">
            <Input type="search" placeholder="Buscar y filtrar" className="w-full md:w-96 shadow-none" />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <Table.Header className="bg-gray-50">
            <Table.Row>
              <Table.HeaderCell className="w-10 text-center"><Checkbox /></Table.HeaderCell>
              <Table.HeaderCell>Pedido</Table.HeaderCell>
              <Table.HeaderCell>Fecha</Table.HeaderCell>
              <Table.HeaderCell>Cliente</Table.HeaderCell>
              <Table.HeaderCell>Preparar antes de</Table.HeaderCell>
              <Table.HeaderCell>Canal</Table.HeaderCell>
              <Table.HeaderCell className="text-right">Total</Table.HeaderCell>
              <Table.HeaderCell>Estado del pago</Table.HeaderCell>
              <Table.HeaderCell>Estado de preparación</Table.HeaderCell>
              <Table.HeaderCell>Artículos</Table.HeaderCell>
              <Table.HeaderCell>Estado de la entrega</Table.HeaderCell>
              <Table.HeaderCell>Forma de entrega</Table.HeaderCell>
              <Table.HeaderCell>Etiquetas</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body className="bg-white">
            {orders.map((order) => (
              <Table.Row key={order.id} className="hover:bg-gray-50 border-b border-gray-200">
                <Table.Cell className="text-center"><Checkbox /></Table.Cell>
                <Table.Cell>
                  <Link to={`/orders/${order.id}`} className="font-semibold text-gray-900 hover:underline">
                    #{order.display_id ?? order.id.slice(-6)}
                  </Link>
                </Table.Cell>
                <Table.Cell><Text size="small" className="text-gray-600">{formatDate(order.created_at)}</Text></Table.Cell>
                <Table.Cell><Text size="small" className="text-gray-900">{orderCustomerLabel(order)}</Text></Table.Cell>
                <Table.Cell><Text size="small" className="text-gray-600">Hoy</Text></Table.Cell>
                <Table.Cell><Text size="small" className="text-gray-600">Tienda online</Text></Table.Cell>
                <Table.Cell className="text-right"><Text size="small" className="text-gray-900">{formatMoney(order.total, order.currency_code)}</Text></Table.Cell>
                <Table.Cell><PaymentStatusBadge status={(order as any).payment_status} /></Table.Cell>
                <Table.Cell><FulfillmentStatusBadge status={(order as any).fulfillment_status} /></Table.Cell>
                <Table.Cell><Text size="small" className="text-gray-600">{(order as any).items?.length || 1} artículo{(order as any).items?.length !== 1 ? 's' : ''}</Text></Table.Cell>
                <Table.Cell><DeliveryStatusBadge /></Table.Cell>
                <Table.Cell><Text size="small" className="text-gray-600">Envío estándar</Text></Table.Cell>
                <Table.Cell><Badge size="small" color="grey" className="bg-gray-100">Nuevo</Badge></Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </div>
    </div>
  )
}

export function DraftOrdersDataTable({ orders }: { orders: DraftOrderRow[] }) {
  return (
    <div className="flex flex-col bg-white">
      <div className="flex items-center gap-1 border-b border-gray-200 px-4 pt-2">
        <div className="px-4 py-2 border-b-2 border-black text-sm font-medium text-black cursor-pointer">Todos</div>
        <div className="px-2 py-2 text-gray-500 hover:text-gray-900 cursor-pointer"><Plus /></div>
      </div>
      <div className="p-4 border-b border-gray-200">
        <div className="flex gap-2">
          <Input type="search" placeholder="Buscar y filtrar" className="w-full md:w-96 shadow-none" />
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <Table.Header className="bg-gray-50">
            <Table.Row>
              <Table.HeaderCell className="w-10 text-center"><Checkbox /></Table.HeaderCell>
              <Table.HeaderCell>Borrador</Table.HeaderCell>
              <Table.HeaderCell>Fecha</Table.HeaderCell>
              <Table.HeaderCell>Cliente</Table.HeaderCell>
              <Table.HeaderCell>Estado</Table.HeaderCell>
              <Table.HeaderCell className="text-right">Total</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body className="bg-white">
            {orders.map((order) => (
              <Table.Row key={order.id} className="hover:bg-gray-50 border-b border-gray-200">
                <Table.Cell className="text-center"><Checkbox /></Table.Cell>
                <Table.Cell>
                  <Link to={`/draft-orders/${order.id}`} className="font-semibold text-gray-900 hover:underline">
                    #{order.display_id ?? order.id.slice(-6)}
                  </Link>
                </Table.Cell>
                <Table.Cell><Text size="small" className="text-gray-600">{formatDate(order.created_at)}</Text></Table.Cell>
                <Table.Cell><Text size="small" className="text-gray-900">{orderCustomerLabel(order)}</Text></Table.Cell>
                <Table.Cell><Badge size="small" color="blue" className="bg-blue-100 text-blue-800">Abierto</Badge></Table.Cell>
                <Table.Cell className="text-right"><Text size="small" className="text-gray-900">{formatMoney(order.total, order.currency_code)}</Text></Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </div>
    </div>
  )
}

export function AbandonedCartsDataTable({ carts }: { carts: AbandonedCartRow[] }) {
  return (
    <div className="flex flex-col bg-white">
      <div className="flex items-center gap-1 border-b border-gray-200 px-4 pt-2">
        <div className="px-4 py-2 border-b-2 border-black text-sm font-medium text-black cursor-pointer">Todos</div>
        <div className="px-2 py-2 text-gray-500 hover:text-gray-900 cursor-pointer"><Plus /></div>
      </div>
      <div className="p-4 border-b border-gray-200">
        <div className="flex gap-2">
          <Input type="search" placeholder="Buscar y filtrar" className="w-full md:w-96 shadow-none" />
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <Table.Header className="bg-gray-50">
            <Table.Row>
              <Table.HeaderCell className="w-10 text-center"><Checkbox /></Table.HeaderCell>
              <Table.HeaderCell>Pago</Table.HeaderCell>
              <Table.HeaderCell>Fecha de creación</Table.HeaderCell>
              <Table.HeaderCell>Nombre del cliente</Table.HeaderCell>
              <Table.HeaderCell>Región</Table.HeaderCell>
              <Table.HeaderCell>Estado de recuperación</Table.HeaderCell>
              <Table.HeaderCell className="text-right">Precio total</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body className="bg-white">
            {carts.map((cart) => (
              <Table.Row key={cart.id} className="hover:bg-gray-50 border-b border-gray-200">
                <Table.Cell className="text-center"><Checkbox /></Table.Cell>
                <Table.Cell>
                  <Text size="small" weight="plus" className="font-semibold text-gray-900 hover:underline cursor-pointer">
                    #{cart.id.slice(-8).toUpperCase()}
                  </Text>
                </Table.Cell>
                <Table.Cell><Text size="small" className="text-gray-600">{formatDate(cart.updated_at)}</Text></Table.Cell>
                <Table.Cell><Text size="small" className="text-gray-900">{cart.customer_email ?? cart.email ?? "Sin email"}</Text></Table.Cell>
                <Table.Cell><Text size="small" className="text-gray-600">España</Text></Table.Cell>
                <Table.Cell><Badge size="small" color="red" className="bg-red-100 text-red-800">No recuperado</Badge></Table.Cell>
                <Table.Cell className="text-right"><Text size="small" className="text-gray-900">{formatMoney(cart.subtotal, cart.currency_code)}</Text></Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </div>
    </div>
  )
}
