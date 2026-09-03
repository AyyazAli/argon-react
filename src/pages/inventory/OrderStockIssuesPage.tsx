import { RefreshCw, AlertTriangle, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Spinner,
} from '@/components/ui'
import { useOrderStockIssues, useRetryOrderDeduction } from '@/hooks'
import { formatDateTime } from '@/lib/utils'

const CODE_LABELS: Record<string, string> = {
  no_sku: 'No SKU on line',
  unmatched: 'SKU not in inventory',
  short: 'Not enough stock',
}

/**
 * Orders whose automatic stock deduction could not be completed: lines with
 * no SKU, SKUs that don't exist in inventory, or shortfalls. Fix the cause
 * (add the product / correct the SKU / receive stock) and retry.
 */
export function OrderStockIssuesPage() {
  const { data: issues, isLoading, refetch, isFetching } = useOrderStockIssues()
  const retry = useRetryOrderDeduction()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Order Stock Issues</h2>
          <p className="text-muted-foreground">
            Dispatched orders whose stock could not be fully deducted
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={isFetching ? 'size-4 animate-spin' : 'size-4'} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardContent className="p-4 text-sm text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">How to resolve:</span> for{' '}
            <em>SKU not in inventory</em>, create the product with that exact SKU (or fix the SKU in
            the store); for <em>No SKU on line</em>, set a SKU on the product in Shopify / WooCommerce
            so future orders carry it; for <em>Not enough stock</em>, receive or count the item. Then
            press <em>Retry</em>. Orders that were returned or cancelled drop off this list.
          </p>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : !issues || issues.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No orders need attention. Every dispatched order was deducted in full.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {issues.map((o) => {
            const inv = o.inventory
            const lines = inv.issues ?? []
            return (
              <Card key={o._id}>
                <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
                  <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                    <span>Order #{o.orderId ?? '—'}</span>
                    {o.cn != null && <span className="text-muted-foreground">CN {o.cn}</span>}
                    <Badge variant={inv.status === 'unmatched' ? 'destructive' : 'warning'}>
                      {inv.status === 'unmatched' ? 'Nothing deducted' : 'Partially deducted'}
                    </Badge>
                    <span className="text-sm font-normal text-muted-foreground">
                      {o.customer} · {o.status}
                      {inv.deductedAt ? ` · ${formatDateTime(inv.deductedAt)}` : ''}
                    </span>
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button asChild variant="ghost" size="sm">
                      <Link to="/orders">
                        <ExternalLink className="size-4" />
                        Orders
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => retry.mutate(o._id)}
                      disabled={retry.isPending && retry.variables === o._id}
                    >
                      {retry.isPending && retry.variables === o._id ? (
                        <Spinner size="sm" />
                      ) : (
                        <RefreshCw className="size-4" />
                      )}
                      Retry
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y border-t">
                    {lines.map((l, i) => (
                      <div key={i} className="flex flex-wrap items-center gap-3 px-4 py-2 text-sm">
                        <AlertTriangle className="size-4 shrink-0 text-amber-600" />
                        <span className="font-mono">{l.sku || '(no SKU)'}</span>
                        <span className="min-w-0 flex-1 truncate">{l.name}</span>
                        <Badge variant="outline">{CODE_LABELS[l.code] ?? l.code}</Badge>
                        <span className="text-muted-foreground">
                          {l.remaining} of {l.qty} outstanding
                        </span>
                      </div>
                    ))}
                    {(inv.deducted?.length ?? 0) > 0 && (
                      <p className="px-4 py-2 text-xs text-muted-foreground">
                        {inv.deducted!.length} line(s) already deducted
                        {inv.sessionId && (
                          <>
                            {' · '}
                            <Link className="underline" to={`/inventory/movements?sessionId=${inv.sessionId}`}>
                              view in ledger
                            </Link>
                          </>
                        )}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
