import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, GeoJSON } from 'react-leaflet'
import type { LeafletMouseEvent } from 'leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { toast } from "@/components/use-toast"
import { getRawGeoJsonData, getPackageBounds, getPackageLocation, findPackageByCoordinates, isWithinBrgyBoundary, getBrgyBoundaryFeature } from '@/lib/geojson-packages'

// Fix marker icon issue by creating a custom icon
const createMarkerIcon = () => {
    return L.icon({
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });
};

// Get the Brgy 176-E Boundary from GeoJSON for rendering
const getBrgyBoundaryGeoJSON = (): GeoJSON.FeatureCollection | null => {
    const boundaryFeature = getBrgyBoundaryFeature();
    if (!boundaryFeature) return null;
    
    return {
        type: "FeatureCollection",
        features: [boundaryFeature as any]
    };
};

interface MapSelectorProps {
    onLocationSelect: (location: { lat: number; lng: number }) => void;
    onPackageSelect?: (packageName: string) => void;
    selectedPackage?: string;
    initialCoordinates?: {
        latitude: string;
        longitude: string;
    };
}

function MapEvents({ onLocationSelect, setPosition, onPackageSelect }: {
    onLocationSelect: (location: { lat: number; lng: number }) => void;
    setPosition: (position: [number, number]) => void;
    onPackageSelect?: (packageName: string) => void;
}) {
    useMapEvents({
        click(e: LeafletMouseEvent) {
            const { lat, lng } = e.latlng;

            // Check if the clicked location is within Brgy 176-E Boundary
            if (!isWithinBrgyBoundary(lat, lng)) {
                toast({
                    title: "Location Outside Boundary",
                    description: "Please select a location within Brgy 176-E Boundary.",
                    variant: "destructive",
                });
                return;
            }

            setPosition([lat, lng]);
            onLocationSelect({ lat, lng });

            // Auto-detect which package/area the clicked point falls into
            const detectedPackage = findPackageByCoordinates(lat, lng);
            if (detectedPackage && onPackageSelect) {
                onPackageSelect(detectedPackage);
                toast({
                    title: "Area Detected",
                    description: `📍 Location set to: ${detectedPackage}`,
                    variant: "default",
                });
            }
        }
    });
    return null;
}

function DraggableMarker({ position, onLocationSelect, onPackageSelect }: {
    position: [number, number];
    onLocationSelect: (location: { lat: number; lng: number }) => void;
    onPackageSelect?: (packageName: string) => void;
}) {
    const [markerPosition, setMarkerPosition] = useState(position);
    const markerRef = useRef<L.Marker>(null);

    const eventHandlers = {
        dragend: (e: L.DragEndEvent) => {
            const marker = e.target;
            const newPosition = marker.getLatLng();

            // Check if the dragged position is within Brgy 176-E Boundary
            if (!isWithinBrgyBoundary(newPosition.lat, newPosition.lng)) {
                toast({
                    title: "Location Outside Boundary",
                    description: "Marker must stay within Brgy 176-E Boundary. Reverting to previous position.",
                    variant: "destructive",
                });
                // Revert to previous position
                marker.setLatLng(markerPosition);
                return;
            }

            setMarkerPosition([newPosition.lat, newPosition.lng]);
            onLocationSelect({ lat: newPosition.lat, lng: newPosition.lng });

            // Auto-detect which package/area the dragged position falls into
            const detectedPackage = findPackageByCoordinates(newPosition.lat, newPosition.lng);
            if (detectedPackage && onPackageSelect) {
                onPackageSelect(detectedPackage);
                toast({
                    title: "Area Detected",
                    description: `📍 Location set to: ${detectedPackage}`,
                    variant: "default",
                });
            }
        }
    };

    useEffect(() => {
        setMarkerPosition(position);
    }, [position]);

    useEffect(() => {
        const marker = markerRef.current;
        if (marker) {
            marker.dragging?.enable();
        }
    }, []);

    return (
        <Marker
            ref={markerRef}
            position={markerPosition}
            eventHandlers={eventHandlers}
            icon={createMarkerIcon()}
        />
    );
}

// Controller component to handle map actions from outside
function MapController({ selectedPackage }: { selectedPackage?: string }) {
    const map = useMapEvents({});

    useEffect(() => {
        if (selectedPackage) {
            const bounds = getPackageBounds(selectedPackage);
            if (bounds) {
                map.fitBounds([
                    [bounds.south, bounds.west],
                    [bounds.north, bounds.east]
                ], { padding: [50, 50], animate: true });
            }
        }
    }, [selectedPackage, map]);

    return null;
}

export default function MapSelector({ onLocationSelect, onPackageSelect, selectedPackage, initialCoordinates }: MapSelectorProps) {
    const [position, setPosition] = useState<[number, number] | null>(
        initialCoordinates?.latitude && initialCoordinates?.longitude
            ? [parseFloat(initialCoordinates.latitude), parseFloat(initialCoordinates.longitude)]
            : null
    );
    const [isClient, setIsClient] = useState(false);
    const geoJsonRef = useRef<L.GeoJSON>(null);

    // Default center coordinates (Barangay 176E, Bagong Silang, Caloocan City)
    const defaultCenter: [number, number] = [14.78043, 121.0415];

    // Style for the boundary polygon
    const boundaryStyle = {
        color: '#64748b',
        weight: 1,
        opacity: 0.5,
        fillColor: '#64748b',
        fillOpacity: 0.05
    };

    // Style for the selected feature
    const selectedStyle = {
        color: '#3b82f6',
        weight: 3,
        opacity: 0.9,
        fillColor: '#3b82f6',
        fillOpacity: 0.2
    };

    useEffect(() => {
        setIsClient(true);

        // Set up default marker icons to prevent errors
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
        });
    }, []);

    const onEachFeature = (feature: any, layer: L.Layer) => {
        const name = feature.properties?.name;

        // Add click listener to each polygon
        layer.on('click', (e) => {
            if (onPackageSelect && name) {
                onPackageSelect(name);

                // Also update coordinates to centroid
                const centroid = getPackageLocation(name)?.centroid;
                if (centroid) {
                    setPosition([centroid.latitude, centroid.longitude]);
                    onLocationSelect({ lat: centroid.latitude, lng: centroid.longitude });
                }
            }
        });

        // Add tooltip with package name
        if (name) {
            layer.bindTooltip(name, { sticky: true });
        }
    };

    // Re-style features when selectedPackage changes
    useEffect(() => {
        if (geoJsonRef.current) {
            geoJsonRef.current.eachLayer((layer: any) => {
                const name = layer.feature?.properties?.name;
                if (name === selectedPackage) {
                    layer.setStyle(selectedStyle);
                    layer.bringToFront();
                } else {
                    layer.setStyle(boundaryStyle);
                }
            });
        }
    }, [selectedPackage]);

    // Only render on client side to prevent SSR issues
    if (!isClient) {
        return (
            <div className="h-full w-full rounded-md border flex items-center justify-center bg-gray-100">
                <span className="text-gray-500">Loading map...</span>
            </div>
        );
    }

    const geoJsonData = getRawGeoJsonData();
    const brgyBoundaryGeoJSON = getBrgyBoundaryGeoJSON();

    return (
        <div className="h-full w-full rounded-md overflow-hidden border">
            <MapContainer
                center={defaultCenter}
                zoom={16}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Display Brgy 176-E Boundary as a prominent border */}
                {brgyBoundaryGeoJSON && (
                    <GeoJSON
                        data={brgyBoundaryGeoJSON}
                        style={{
                            color: '#ef4444',
                            weight: 3,
                            opacity: 0.8,
                            fill: false,
                            dashArray: '5, 10'
                        }}
                    />
                )}

                {/* Display All Packages from map.geojson */}
                <GeoJSON
                    ref={geoJsonRef}
                    data={geoJsonData as any}
                    style={(feature) => feature?.properties?.name === selectedPackage ? selectedStyle : boundaryStyle}
                    onEachFeature={onEachFeature}
                />

                <MapController selectedPackage={selectedPackage} />

                <MapEvents
                    onLocationSelect={onLocationSelect}
                    setPosition={setPosition}
                    onPackageSelect={onPackageSelect}
                />
                {position && (
                    <DraggableMarker
                        position={position}
                        onLocationSelect={onLocationSelect}
                        onPackageSelect={onPackageSelect}
                    />
                )}
            </MapContainer>
        </div>
    );
}