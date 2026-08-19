export async function fetchListings(params: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== '' && val !== null) {
      searchParams.set(key, String(val));
    }
  });
  const res = await fetch(`/api/listings?${searchParams}`);
  if (!res.ok) throw new Error('Failed to fetch listings');
  return res.json();
}

export async function fetchListing(id: number) {
  const res = await fetch(`/api/listings/${id}`);
  if (!res.ok) throw new Error('Failed to fetch listing');
  return res.json();
}

export async function fetchStats() {
  const res = await fetch('/api/stats');
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

export async function fetchMakes() {
  const res = await fetch('/api/makes');
  if (!res.ok) throw new Error('Failed to fetch makes');
  return res.json();
}

export async function fetchModels(make: string) {
  const res = await fetch(`/api/models?make=${encodeURIComponent(make)}`);
  if (!res.ok) throw new Error('Failed to fetch models');
  return res.json();
}

export async function triggerScrape(params: {
  source: string;
  zipCode: string;
  maxPages?: number;
  maxPrice?: number;
}) {
  const res = await fetch('/api/scrape', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || 'Scrape failed');
  return data;
}
