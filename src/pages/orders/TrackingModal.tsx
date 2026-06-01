import { useTraxTracking, useLeopardTracking, usePostexTracking } from '@/hooks'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Spinner,
} from '@/components/ui'

interface TrackingModalProps {
  trackingId: string
  company: string
  open: boolean
  onClose: () => void
}

interface TraxHistory {
  status: string
  date_time: string
  status_reason: string
}

interface LeopardHistory {
  Status: string
  Activity_datetime: string
}

interface PostexHistory {
  transactionStatusMessage: string
  transactionStatusMessageCode: string
}

export function TrackingModal({ trackingId, company, open, onClose }: TrackingModalProps) {
  // Normalize company to lowercase so DB values like "Trax" / "TRAX" all match
  const co = company?.toLowerCase() ?? ''

  // Each query only runs when the modal is open AND the company matches
  const trax = useTraxTracking(trackingId, open && co === 'trax')
  const leopard = useLeopardTracking(trackingId, open && co === 'leopard')
  const postex = usePostexTracking(trackingId, open && co === 'postex')

  const isLoading = trax.isLoading || leopard.isLoading || postex.isLoading
  const isError = trax.isError || leopard.isError || postex.isError

  const traxHistory = trax.data?.data as TraxHistory[] | undefined
  const leopardHistory = leopard.data?.data as LeopardHistory[] | undefined
  const postexHistory = postex.data?.data as PostexHistory[] | undefined

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Spinner size="lg" />
        </div>
      )
    }

    if (isError) {
      return (
        <p className="text-center text-destructive py-4 text-sm">
          Failed to fetch tracking history. Please try again.
        </p>
      )
    }

    if (co === 'trax' && traxHistory && traxHistory.length > 0) {
      return (
        <div className="space-y-2 max-h-96 overflow-y-auto rounded-lg border p-3">
          {traxHistory.map((item, i) => (
            <div key={i} className="py-2 border-b last:border-0">
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground text-xs">Status</span>
                  <p className="font-medium">{item.status}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Date & Time</span>
                  <p>{item.date_time}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Reason</span>
                  <p>{item.status_reason || '—'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )
    }

    if (co === 'leopard' && leopardHistory && leopardHistory.length > 0) {
      return (
        <div className="space-y-2 max-h-96 overflow-y-auto rounded-lg border p-3">
          {leopardHistory.map((item, i) => (
            <div key={i} className="py-2 border-b last:border-0">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground text-xs">Status</span>
                  <p className="font-medium">{item.Status}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Date & Time</span>
                  <p>{item.Activity_datetime}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )
    }

    if (co === 'postex' && postexHistory && postexHistory.length > 0) {
      return (
        <div className="space-y-2 max-h-96 overflow-y-auto rounded-lg border p-3">
          {postexHistory.map((item, i) => (
            <div key={i} className="py-2 border-b last:border-0">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground text-xs">Status</span>
                  <p className="font-medium">{item.transactionStatusMessage}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Code</span>
                  <p className="font-mono">{item.transactionStatusMessageCode}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )
    }

    return (
      <p className="text-center text-muted-foreground py-4 text-sm">
        No tracking history available
      </p>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="capitalize">
            {co} — {trackingId}
          </DialogTitle>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  )
}
