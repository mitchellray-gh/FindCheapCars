import type { NhtsaDecodedVin, NhtsaRecall } from '../types';

const VIN_API_BASE = 'https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues';
const RECALL_API_BASE = 'https://api.nhtsa.gov/recalls/recallsByVehicle';

const vinCache = new Map<string, NhtsaDecodedVin>();
const recallCache = new Map<string, NhtsaRecall[]>();

export async function decodeVin(vin: string): Promise<NhtsaDecodedVin> {
  const normalized = vin.toUpperCase().trim();

  const cached = vinCache.get(normalized);
  if (cached) {
    return cached;
  }

  const url = `${VIN_API_BASE}/${normalized}?format=json`;

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`NHTSA API returned ${response.status} for VIN ${normalized}`);
  }

  const data = (await response.json()) as { Results?: Array<Record<string, unknown>> };

  const result = data.Results?.[0];
  if (!result) {
    throw new Error(`No results returned from NHTSA for VIN ${normalized}`);
  }

  const decoded: NhtsaDecodedVin = {
    make: String(result.Make ?? ''),
    model: String(result.Model ?? ''),
    modelYear: parseInt(String(result.ModelYear ?? '0'), 10),
    trim: String(result.Trim ?? ''),
    bodyClass: String(result.BodyClass ?? ''),
    displacementL: String(result.DisplacementL ?? ''),
    engineCylinders: String(result.EngineCylinders ?? ''),
    engineModel: String(result.EngineModel ?? ''),
    fuelTypePrimary: String(result.FuelTypePrimary ?? ''),
    transmissionStyle: String(result.TransmissionStyle ?? ''),
    transmissionSpeeds: String(result.TransmissionSpeeds ?? ''),
    driveType: String(result.DriveType ?? ''),
    manufacturerId: String(result.ManufacturerId ?? ''),
    plantCity: String(result.PlantCity ?? ''),
    plantState: String(result.PlantState ?? ''),
    errorCode: String(result.ErrorCode ?? ''),
    errorText: String(result.ErrorText ?? ''),
  };

  vinCache.set(normalized, decoded);

  return decoded;
}

export async function getRecalls(
  make: string,
  model: string,
  modelYear: number,
): Promise<NhtsaRecall[]> {
  const cacheKey = `${modelYear}:${make}:${model}`.toUpperCase();

  const cached = recallCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const params = new URLSearchParams({
    make,
    model,
    modelYear: String(modelYear),
  });

  const url = `${RECALL_API_BASE}?${params.toString()}`;

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`NHTSA Recall API returned ${response.status}`);
  }

  const data = (await response.json()) as { results?: Array<Record<string, unknown>> };

  const recalls: NhtsaRecall[] = (data.results ?? []).map((r) => ({
    NHTSACampaignNumber: String(r.NHTSACampaignNumber ?? ''),
    Summary: String(r.Summary ?? ''),
    Consequence: String(r.Consequence ?? ''),
    Remedy: String(r.Remedy ?? ''),
    ModelYear: String(r.ModelYear ?? ''),
    Make: String(r.Make ?? ''),
    Model: String(r.Model ?? ''),
  }));

  recallCache.set(cacheKey, recalls);

  return recalls;
}

/** Build a human-readable engine string from decoded VIN data, e.g. "2.4L 4-Cyl (K24Z1)". */
export function buildEngineFromVin(decoded: NhtsaDecodedVin): string | null {
  const disp = decoded.displacementL ? parseFloat(decoded.displacementL) : NaN;
  const parts: string[] = [];
  if (!Number.isNaN(disp) && disp > 0) parts.push(`${disp.toFixed(1)}L`);
  if (decoded.engineCylinders) parts.push(`${decoded.engineCylinders}-Cyl`);
  if (decoded.fuelTypePrimary && !/gasoline/i.test(decoded.fuelTypePrimary)) {
    parts.push(decoded.fuelTypePrimary.replace(/\s*\(.*?\)\s*/g, '').trim());
  }
  let engine = parts.join(' ');
  const model = decoded.engineModel?.trim();
  if (engine && model) engine += ` (${model})`;
  else if (!engine && model) engine = model;
  return engine || null;
}

/** Build a human-readable transmission string, e.g. "5-Speed Automatic" or "CVT". */
export function buildTransmissionFromVin(decoded: NhtsaDecodedVin): string | null {
  const style = decoded.transmissionStyle?.trim();
  if (!style) return null;
  if (/continuously variable/i.test(style)) return 'CVT (Continuously Variable)';
  const speeds = decoded.transmissionSpeeds ? parseInt(decoded.transmissionSpeeds, 10) : NaN;
  if (!Number.isNaN(speeds) && speeds > 0) return `${speeds}-Speed ${style}`;
  return style;
}
