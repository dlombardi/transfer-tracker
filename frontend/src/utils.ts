export function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleString();
}

export function getStatusBadgeClass(status: string): string {
  return `badge badge-${status}`;
}
