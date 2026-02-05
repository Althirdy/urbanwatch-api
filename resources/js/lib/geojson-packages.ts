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

// Mapping from package names in locations array to GeoJSON feature names
const packageNameMapping: Record<string, string> = {
    'Pkg. 1A Bicolandia': 'Pkg 1',
    'Pkg. 1B Powerline': 'powerLineKangkungan',
    'Pkg. 1C Sampalukan': 'Sampalucan',
    'Pkg. 2 Botlog': 'Botlog Pkg 2',
    'Pkg. 2 GK Staging': 'Pkg2',
    'Pkg. 3 Kaunlaran': 'kaunlaran',
    'Pkg. 3 Maharlika': 'Maharlika 1',
    'Pkg. 3 Maharlika 2': 'Maharlika 2',
    'Pkg. 3 Damayan': 'Damayan',
    'Pkg. 4A Atlantika': 'Pkg 4',
    'Pkg. 4B Aklan Wire': 'pkg 4',
    'Pkg. 5 San Roque': 'San Roque',
    'Pkg. 5 Brgy. Annex (BFP)': 'Annex',
    'Pkg. 5 Crasher': 'REd Bofalo',
    'Pkg. 5 Gatnai': 'Gatnai',
    'Pkg. 6 Bayanihan': 'Bayanihan',
    'Pkg. 7A Lakan': 'Pkg 7A',
    'Pkg. 7B PhilRad': 'Friul',
    'Pkg. 7B  Khulits Court': 'Khulits',
    'Pkg. 7B Dating Daan': 'Dating Daan',
    'Pkg. 7C GS Senior High': 'Ultrapok pkg 7-c',
    'Pkg. 8A North Cal': 'Pkg 8A',
    'Pkg. 8B Makati': 'Pkg 8B',
    'Pkg. 9 Plaza Maria Upper': 'Upper',
    'Pkg. 9 Plaza Maria Lower': 'Plaza Mania',
};

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
 * Uses the mapping to translate from UI package names to GeoJSON feature names
 */
export function getPackageLocation(packageName: string): PackageLocation | null {
    const packages = parseGeoJsonPackages();
    
    // First try to get the mapped GeoJSON name
    const geoJsonName = packageNameMapping[packageName];
    if (geoJsonName) {
        const location = packages.get(geoJsonName);
        if (location) {
            return {
                name: packageName, // Return the original package name
                centroid: location.centroid,
            };
        }
    }
    
    // Fallback: try direct match
    return packages.get(packageName) || null;
}

/**
 * Get centroid coordinates for a package
 */
export function getPackageCentroid(packageName: string): { latitude: number; longitude: number } | null {
    const location = getPackageLocation(packageName);
    return location ? location.centroid : null;
}
