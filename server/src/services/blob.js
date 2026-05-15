import { BlobServiceClient } from "@azure/storage-blob";

export async function uploadBufferToBlob(originalName, buffer, mimeType) {
  const conn = process.env.AZURE_STORAGE_CONNECTION_STRING;
  const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || "rent-documents";
  if (!conn) {
    throw new Error("AZURE_STORAGE_CONNECTION_STRING is not set");
  }
  const service = BlobServiceClient.fromConnectionString(conn);
  const container = service.getContainerClient(containerName);
  await container.createIfNotExists({ access: "blob" });
  const safe = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const blobName = `${Date.now()}-${safe}`;
  const block = container.getBlockBlobClient(blobName);
  await block.uploadData(buffer, {
    blobHTTPHeaders: { blobContentType: mimeType || "application/octet-stream" },
  });
  return block.url;
}

export function isBlobConfigured() {
  return Boolean(process.env.AZURE_STORAGE_CONNECTION_STRING);
}
