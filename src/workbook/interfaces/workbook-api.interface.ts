export interface CreateWorkbookResult {
  workbookId: string;
  versionId: string;
  jobId: string;
  status: 'queued';
}

export interface WorkbookMetadata {
  workbook_id: string;
  organization_id: string;
  username: string;
  original_name: string;
  object_key: string;
  mime_type: string;
  size: number;
  sha256: string;
  status: string;
  current_version: number;
  last_error: string | null;
  created_at: string;
  updated_at: string;
  version_id: string;
  version_object_key: string;
}

export interface WorkbookResult {
  workbook: WorkbookMetadata;
}

export interface WorkbookSheetSummary {
  sheet_id: string;
  name: string;
  index: number;
  row_count: number;
  column_count: number;
}

export interface WorkbookSheetsResult {
  sheets: WorkbookSheetSummary[];
}
