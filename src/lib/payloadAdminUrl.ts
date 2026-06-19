export function payloadAdminUrl(collection: string, docId?: string | number): string {
  if (docId) return `/admin/collections/${collection}/${docId}`;
  return `/admin/collections/${collection}`;
}
