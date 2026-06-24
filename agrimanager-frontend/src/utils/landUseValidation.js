import axios from "axios";

const OVERPASS_API_URL = "https://overpass-api.de/api/interpreter";
const INVALID_LAND_USE_MESSAGE =
  "⚠️ Σφάλμα: Η περιοχή που επιλέξατε αναγνωρίζεται ως οικιστική/κατοικημένη ζώνη. Παρακαλώ επιλέξτε μια αγροτική έκταση.";
const RESIDENTIAL_BUILDINGS =
  "^(yes|house|residential|apartments|detached|semidetached_house|terrace|bungalow|dormitory|static_caravan)$";
const POPULATED_PLACES =
  "^(city|town|village|hamlet|suburb|neighbourhood)$";

// Δημιουργεί βοηθητικό φίλτρο.
function createPolygonFilter(boundary) {
  if (!Array.isArray(boundary)) return null;

  const validCoordinates = boundary.filter(
    (coordinate) =>
      Array.isArray(coordinate) &&
      coordinate.length >= 2 &&
      Number.isFinite(coordinate[0]) &&
      Number.isFinite(coordinate[1])
  );

  if (validCoordinates.length < 3) return null;

  // Περιορίζει μεγάλα Overpass queries.
  const step = Math.max(1, Math.ceil(validCoordinates.length / 80));
  const simplifiedCoordinates = validCoordinates.filter(
    (_, index) => index % step === 0
  );
  const firstCoordinate = simplifiedCoordinates[0];
  const lastCoordinate = simplifiedCoordinates[simplifiedCoordinates.length - 1];

  if (
    firstCoordinate[0] !== lastCoordinate[0] ||
    firstCoordinate[1] !== lastCoordinate[1]
  ) {
    simplifiedCoordinates.push(firstCoordinate);
  }

  return simplifiedCoordinates
    .map(([longitude, latitude]) => `${latitude} ${longitude}`)
    .join(" ");
}

// Ελέγχει εγκυρότητα.
export async function validateLandUse(lat, lng, boundary = []) {
  const polygonFilter = createPolygonFilter(boundary);
  const polygonQueries = polygonFilter
    ? `
      nwr(poly:"${polygonFilter}")["landuse"="residential"];
      nwr(poly:"${polygonFilter}")["building"~"${RESIDENTIAL_BUILDINGS}"];
      nwr(poly:"${polygonFilter}")["amenity"];
      nwr(poly:"${polygonFilter}")["place"~"${POPULATED_PLACES}"];
      nwr(around:25,${polygonFilter.replaceAll(" ", ",")})["landuse"="residential"];
      nwr(around:25,${polygonFilter.replaceAll(" ", ",")})["building"~"${RESIDENTIAL_BUILDINGS}"];
      nwr(around:25,${polygonFilter.replaceAll(" ", ",")})["amenity"];
    `
    : `
      nwr(around:25,${lat},${lng})["landuse"="residential"];
      nwr(around:25,${lat},${lng})["building"~"${RESIDENTIAL_BUILDINGS}"];
      nwr(around:25,${lat},${lng})["amenity"];
      nwr(around:25,${lat},${lng})["place"~"${POPULATED_PLACES}"];
    `;

  const query = `
    [out:json][timeout:10];
    is_in(${lat},${lng})->.containingAreas;
    (
      area.containingAreas["landuse"="residential"];
      ${polygonQueries}
    );
    out ids;
  `;

  try {
    const response = await axios.get(OVERPASS_API_URL, {
      params: { data: query },
      timeout: 15000,
    });

    if (response.data?.elements?.length > 0) {
      window.alert(INVALID_LAND_USE_MESSAGE);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Σφάλμα ελέγχου χρήσης γης μέσω Overpass:", error);
    window.alert(
      "⚠️ Σφάλμα: Δεν ήταν δυνατός ο γεωγραφικός έλεγχος της περιοχής. Παρακαλώ δοκιμάστε ξανά."
    );
    return false;
  }
}
