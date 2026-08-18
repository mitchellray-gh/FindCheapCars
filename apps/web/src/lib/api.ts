const API_BASE = '/api';

export async function fetchListings(params: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== '' && val !== null) {
      searchParams.set(key, String(val));
    }
  });
  const res = await fetch(`${API_BASE}/listings?${searchParams}`);
  if (!res.ok) throw new Error('Failed to fetch listings');
  return res.json();
}

export async function fetchListing(id: number) {
  const res = await fetch(`${API_BASE}/listings/${id}`);
  if (!res.ok) throw new Error('Failed to fetch listing');
  return res.json();
}

export async function fetchStats() {
  const res = await fetch(`${API_BASE}/stats`);
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

export async function fetchMakes() {
  const res = await fetch(`${API_BASE}/makes`);
  if (!res.ok) throw new Error('Failed to fetch makes');
  return res.json();
}

export async function fetchModels(make: string) {
  const res = await fetch(`${API_BASE}/models?make=${make}`);
  if (!res.ok) throw new Error('Failed to fetch models');
  return res.json();
}
