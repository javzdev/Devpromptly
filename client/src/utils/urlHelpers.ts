export function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function getLogoUrl(url: string): string {
  return `https://logo.clearbit.com/${getDomain(url)}`;
}

export function getFaviconUrl(url: string, size = 64): string {
  return `https://www.google.com/s2/favicons?domain=${getDomain(url)}&sz=${size}`;
}
