// GeoJSON type definitions
interface GeoJsonFeature {
    type: string;
    properties: {
        name: string;
        [key: string]: any;
    };
    geometry: {
        type: string;
        coordinates: number[][] | number[][][];
    };
}

interface GeoJsonData {
    type: string;
    features: GeoJsonFeature[];
}

interface PackageLocation {
    name: string;
    centroid: {
        latitude: number;
        longitude: number;
    };
}

// Import GeoJSON data - Vite handles JSON imports
import geoJsonDataRaw from '../../../map.geojson?raw';

// Parse the raw JSON string
const geoJsonData: GeoJsonData = JSON.parse(geoJsonDataRaw);

/**
 * Calculate the centroid (center point) of a LineString or Polygon coordinates
 */
function calculateCentroid(coordinates: number[][] | number[][][]): { latitude: number; longitude: number } {
    let lats: number[] = [];
    let lngs: number[] = [];

    if (coordinates.length === 0) {
        return { latitude: 0, longitude: 0 };
    }

    // Handle different coordinate types
    if (typeof coordinates[0][0] === 'number') {
        // LineString or Polygon: coordinates[i] = [lng, lat]
        (coordinates as number[][]).forEach(([lng, lat]) => {
            lngs.push(lng);
            lats.push(lat);
        });
    } else {
        // MultiPolygon: coordinates[i][j] = [lng, lat]
        (coordinates as number[][][]).forEach((ring) => {
            ring.forEach(([lng, lat]) => {
                lngs.push(lng);
                lats.push(lat);
            });
        });
    }

    const avgLat = lats.reduce((a, b) => a + b, 0) / lats.length;
    const avgLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;

    return {
        latitude: parseFloat(avgLat.toFixed(7)),
        longitude: parseFloat(avgLng.toFixed(7)),
    };
}

/**
 * Parse GeoJSON and extract package locations with centroids
 */
function parseGeoJsonPackages(): Map<string, PackageLocation> {
    const packages = new Map<string, PackageLocation>();

    const features = geoJsonData.features;

    features.forEach((feature) => {
        const name = feature.properties.name;
        if (name && feature.geometry && feature.geometry.coordinates) {
            const centroid = calculateCentroid(feature.geometry.coordinates);
            packages.set(name, {
                name,
                centroid,
            });
        }
    });

    return packages;
}

/**
 * Get all available packages
 */
export function getAllPackages(): PackageLocation[] {
    const packages = parseGeoJsonPackages();
    return Array.from(packages.values());
}

/**
 * Get package location data by name
 */
export function getPackageLocation(packageName: string): PackageLocation | null {
    const packages = parseGeoJsonPackages();
    return packages.get(packageName) || null;
}

/**
 * Get all package names suitable for dropdown display
 * Returns an array of objects with id and display name
 */
export function getPackageDropdownOptions(): Array<{ id: string; name: string }> {
    const packages = parseGeoJsonPackages();
    const options: Array<{ id: string; name: string }> = [];

    // Build options array using native GeoJSON names
    packages.forEach((pkg, geoJsonName) => {
        options.push({
            id: geoJsonName,
            name: geoJsonName,
        });
    });

    // Sort alphabetically
    return options.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get centroid coordinates for a package
 */
export function getPackageCentroid(packageName: string): { latitude: number; longitude: number } | null {
    const location = getPackageLocation(packageName);
    return location ? location.centroid : null;
}

/**
 * Get bounding box for a package (for map zoom)
 */
export function getPackageBounds(packageName: string): {
    north: number;
    south: number;
    east: number;
    west: number;
} | null {
    const packages = parseGeoJsonPackages();
    const pkg = packages.get(packageName);
    if (!pkg) return null;

    // Get the feature from GeoJSON
    const feature = geoJsonData.features.find(f => f.properties.name === packageName);
    if (!feature) return null;

    // Calculate bounds from coordinates
    const coords = feature.geometry.coordinates;
    let lats: number[] = [];
    let lngs: number[] = [];

    // Flatten coordinates to get all lat/lng pairs
    const flattenCoords = (c: any) => {
        if (typeof c[0] === 'number' && typeof c[1] === 'number') {
            lngs.push(c[0]);
            lats.push(c[1]);
        } else if (Array.isArray(c)) {
            c.forEach(flattenCoords);
        }
    };

    flattenCoords(coords);

    if (lats.length === 0 || lngs.length === 0) return null;

    return {
        north: Math.max(...lats),
        south: Math.min(...lats),
        east: Math.max(...lngs),
        west: Math.min(...lngs),
    };
}

/**
 * Get GeoJSON feature for a package (for map rendering)
 */
export function getPackageFeature(packageName: string): GeoJsonFeature | null {
    return geoJsonData.features.find(f => f.properties.name === packageName) || null;
}

/**
 * Get the full GeoJSON data
 */
export function getRawGeoJsonData(): GeoJsonData {
    return geoJsonData;
}

/**
 * Check if a point is inside a polygon using ray-casting algorithm
 * Note: GeoJSON coordinates are [lng, lat] format
 */
function isPointInPolygon(lat: number, lng: number, polygon: number[][]): boolean {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        // GeoJSON format: [lng, lat]
        const lngi = polygon[i][0], lati = polygon[i][1];
        const lngj = polygon[j][0], latj = polygon[j][1];

        const intersect = ((lati > lat) !== (latj > lat))
            && (lng < (lngj - lngi) * (lat - lati) / (latj - lati) + lngi);
        if (intersect) inside = !inside;
    }
    return inside;
}

/**
 * Find the package/area that contains the given coordinates
 * Returns the package name if found, null otherwise
 */
export function findPackageByCoordinates(lat: number, lng: number): string | null {
    for (const feature of geoJsonData.features) {
        const name = feature.properties.name;
        const geometry = feature.geometry;

        if (!name || !geometry || !geometry.coordinates) continue;

        let polygons: number[][][] = [];

        // Handle different geometry types
        if (geometry.type === 'Polygon') {
            polygons = geometry.coordinates as number[][][];
        } else if (geometry.type === 'MultiPolygon') {
            // Flatten multi-polygon into array of polygons
            for (const poly of geometry.coordinates as number[][][][]) {
                polygons.push(...poly);
            }
        } else if (geometry.type === 'LineString') {
            // Treat LineString as a simple polygon (outer ring)
            polygons = [geometry.coordinates as number[][]];
        }

        // Check if point is inside any of the polygons
        for (const ring of polygons) {
            if (isPointInPolygon(lat, lng, ring)) {
                return name;
            }
        }
    }

    return null;
}

/**
 * Get the Brgy 176-E Boundary feature from GeoJSON
 */
export function getBrgyBoundaryFeature(): GeoJsonFeature | null {
    return geoJsonData.features.find(f => f.properties.name === 'Brgy 176-E Boundary') || null;
}

/**
 * Check if coordinates are within the Brgy 176-E Boundary
 * Returns true if the point is inside the boundary, false otherwise
 */
export function isWithinBrgyBoundary(lat: number, lng: number): boolean {
    const boundaryFeature = getBrgyBoundaryFeature();
    if (!boundaryFeature || !boundaryFeature.geometry || !boundaryFeature.geometry.coordinates) {
        // If boundary not found, allow all points (fallback)
        return true;
    }

    const geometry = boundaryFeature.geometry;
    let coordinates: number[][] = [];

    // Handle different geometry types
    if (geometry.type === 'LineString') {
        coordinates = geometry.coordinates as number[][];
    } else if (geometry.type === 'Polygon') {
        // Use the outer ring
        coordinates = (geometry.coordinates as number[][][])[0];
    }

    if (coordinates.length === 0) {
        return true; // Fallback: allow if no coordinates
    }

    // Use ray-casting algorithm to check if point is inside boundary
    return isPointInPolygon(lat, lng, coordinates);
}
