export interface SheetRowsResponse {
  rows: Array<Record<string, unknown>>;
  offset: number;
  limit: number;
  total: number;
}
