export interface WorkbookResponse {
  workbook: {
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
  };
}
