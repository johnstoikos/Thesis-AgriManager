import * as turf from "@turf/turf";

export function toNumber(value) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value.replace(",", "."));
  return Number(value);
}

export function formatSquareMeters(value, locale = "en-US") {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCurrency(value, locale = "el-GR") {
  const amount = toNumber(value);
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function formatNumber(value, digits = 2, locale = "el-GR") {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  }).format(Number(value || 0));
}

export function formatMonth(month, locale = "el-GR") {
  const date = new Date(`${month}-01T00:00:00`);
  if (Number.isNaN(date.getTime())) return month;
  return date.toLocaleDateString(locale, { month: "short", year: "2-digit" });
}

export function getPolygonSquareMeters(geoJsonPolygon) {
  const coordinates = geoJsonPolygon?.coordinates;
  if (!Array.isArray(coordinates) || !Array.isArray(coordinates[0]) || coordinates[0].length < 4) {
    return 0;
  }

  try {
    return turf.area(turf.polygon(coordinates));
  } catch (err) {
    console.warn("Αδυναμία υπολογισμού έκτασης πολυγώνου:", err);
    return 0;
  }
}

export function getFieldSquareMeters(field) {
  const storedStremmata = toNumber(field.area);
  if (Number.isFinite(storedStremmata) && storedStremmata > 0) {
    return storedStremmata * 1000;
  }

  return getPolygonSquareMeters(field.boundary);
}

export function getCropStremmata(crop) {
  const storedZoneArea = toNumber(crop.zoneArea);
  if (Number.isFinite(storedZoneArea) && storedZoneArea > 0) {
    return storedZoneArea;
  }

  return getPolygonSquareMeters(crop.zoneBoundary) / 1000;
}
