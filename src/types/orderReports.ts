// Types for the Order User-Activity reporting module (superAdmin only).

export interface OrderReportFilters {
  startDate?: string
  endDate?: string
  /** Filter the daily view to a single actor. */
  userId?: string
  /** Optional business segment (penhouse/customhouse/shoplik). Omit = all. */
  business?: string
}

/** status => count, keyed by the order status enum (plus any unknown buckets). */
export type StatusCounts = Record<string, number>

export interface UserActivity {
  userId: string
  userName: string
  total: number
  statusCounts: StatusCounts
}

export interface DailyActivityRow extends UserActivity {
  /** YYYY-MM-DD in PKT. */
  day: string
}

export interface TimeSeriesPoint {
  day: string
  total: number
}

export interface ReportRange {
  start: string
  end: string
}

export interface OrderActivitySummary {
  totalActions: number
  byStatus: StatusCounts
  byUser: UserActivity[]
  statusKeys: string[]
}

export interface OrderActivityDaily {
  daily: DailyActivityRow[]
  timeSeries: TimeSeriesPoint[]
  statusKeys: string[]
}

export interface OrderReportUser {
  _id: string
  name: string
}

export interface SummaryResponse {
  message: string
  range: ReportRange
  data: OrderActivitySummary
}

export interface DailyResponse {
  message: string
  range: ReportRange
  data: OrderActivityDaily
}

export interface UsersResponse {
  message: string
  data: OrderReportUser[]
}
