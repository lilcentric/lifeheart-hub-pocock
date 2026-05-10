export interface RecordMultiUploadDeps {
  recordDocument: (
    recordId: string,
    documentType: string,
    storagePath: string,
    filename: string
  ) => Promise<void>;
  setStatus: (
    recordId: string,
    statusField: string,
    status: "completed"
  ) => Promise<void>;
}

export type RecordMultiUploadResult = { success: true } | { error: string };

export async function recordMultiUploadAndUpdateStatus(
  recordId: string,
  documentType: string,
  storagePath: string,
  filename: string,
  deps: RecordMultiUploadDeps
): Promise<RecordMultiUploadResult> {
  try {
    await deps.recordDocument(recordId, documentType, storagePath, filename);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to record document" };
  }

  const statusField = `${documentType}_status`;
  try {
    await deps.setStatus(recordId, statusField, "completed");
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update status" };
  }

  return { success: true };
}
