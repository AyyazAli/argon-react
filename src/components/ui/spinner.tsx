import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

interface SpinnerProps extends React.ComponentProps<"div"> {
  size?: "sm" | "default" | "lg"
}

function Spinner({ className, size = "default", ...props }: SpinnerProps) {
  return (
    <div
      data-slot="spinner"
      className={cn("flex items-center justify-center", className)}
      {...props}
    >
      <Loader2
        className={cn(
          "animate-spin text-muted-foreground",
          size === "sm" && "size-4",
          size === "default" && "size-6",
          size === "lg" && "size-8"
        )}
      />
    </div>
  )
}

export { Spinner }




