/** The recognizable part of a host: `www.youtube.com` → `youtube`, `ceramet.net` → `ceramet`. */
export function siteName(url: string): string {
  let hostname: string;
  try {
    hostname = new URL(url).hostname;
  } catch {
    return '';
  }

  const labels = hostname.split('.');
  // IP addresses and single-label hosts (localhost) have no site name to pick.
  if (labels.length < 2 || /^\d+$/.test(labels[labels.length - 1])) return hostname;

  return labels[labels.length - 2];
}
