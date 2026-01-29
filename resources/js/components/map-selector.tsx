import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, GeoJSON } from 'react-leaflet'
import type { LeafletMouseEvent } from 'leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { toast } from "@/components/use-toast"

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

// Barangay 176E GeoJSON boundary
const barangay176EBoundary: GeoJSON.FeatureCollection = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    [
                        [121.0341794182691, 14.784497400912883],
                        [121.03393458566063, 14.783595582640359],
                        [121.03388795087824, 14.782862852535175],
                        [121.03438927479095, 14.781341020570238],
                        [121.03436595739976, 14.780822467982475],
                        [121.03448254435557, 14.779920634446412],
                        [121.0345965517069, 14.777179790286354],
                        [121.03861427279833, 14.776329421475538],
                        [121.03994734154685, 14.778799957440398],
                        [121.04099643493117, 14.778251613221727],
                        [121.0421721275074, 14.777383346157407],
                        [121.04302381031835, 14.777096906776862],
                        [121.04502341344107, 14.776846272008825],
                        [121.04528262125461, 14.778708123378124],
                        [121.04811881571356, 14.782236814924687],
                        [121.0478160216627, 14.783494424959827],
                        [121.04797987677722, 14.784128180304322],
                        [121.04827687853867, 14.784722322777512],
                        [121.0481847055774, 14.784910467554297],
                        [121.04771359933568, 14.785296658954849],
                        [121.04737563181413, 14.78613835578166],
                        [121.04735514893412, 14.786663176855939],
                        [121.04721176877399, 14.78686122221535],
                        [121.04661776525097, 14.786455229035411],
                        [121.04531710236472, 14.785544217184011],
                        [121.04448754572144, 14.785039198098275],
                        [121.0439959565997, 14.785108514512771],
                        [121.0436579890781, 14.78566304503434],
                        [121.04394474939966, 14.786455229035411],
                        [121.04326881435657, 14.787168192164657],
                        [121.04266456939342, 14.786465131317044],
                        [121.04224466934596, 14.785908319169778],
                        [121.04156873430412, 14.78579939376695],
                        [121.04112835238118, 14.78428433476492],
                        [121.04063676325944, 14.783888239164753],
                        [121.03968431129067, 14.784413064873846],
                        [121.03816857816298, 14.785264667463053],
                        [121.03758481608122, 14.785116132367705],
                        [121.0365606720764, 14.785126034710487],
                        [121.03631487756013, 14.78483886936094],
                        [121.03627391180004, 14.783858533934804],
                        [121.0359973929186, 14.783640681017502],
                        [121.03522928491537, 14.783650583427587],
                        [121.03476842011366, 14.783967460312653],
                        [121.03461479851228, 14.784442774772458],
                        [121.0341794182691, 14.784497400912883]
                    ]
                ],
                "type": "Polygon"
            }
        }
    ]
};

// Function to check if a point is inside the Barangay 176E boundary
const isPointInBoundary = (lat: number, lng: number): boolean => {
    const geometry = barangay176EBoundary.features[0].geometry as GeoJSON.Polygon;
    const coords = geometry.coordinates[0];
    let inside = false;

    for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
        const xi = coords[i][0], yi = coords[i][1];
        const xj = coords[j][0], yj = coords[j][1];

        const intersect = ((yi > lat) !== (yj > lat))
            && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }

    return inside;
};

interface MapSelectorProps {
    onLocationSelect: (location: { lat: number; lng: number }) => void;
    initialCoordinates?: {
        latitude: string;
        longitude: string;
    };
}

function MapEvents({ onLocationSelect, setPosition }: {
    onLocationSelect: (location: { lat: number; lng: number }) => void;
    setPosition: (position: [number, number]) => void;
}) {
    useMapEvents({
        click(e: LeafletMouseEvent) {
            const { lat, lng } = e.latlng;

            // Check if the clicked location is within Barangay 176E boundary
            if (!isPointInBoundary(lat, lng)) {
                toast({
                    title: "Location Outside Boundary",
                    description: "Please select a location within Barangay 176E.",
                    variant: "destructive",
                });
                return;
            }

            setPosition([lat, lng]);
            onLocationSelect({ lat, lng });
        }
    });
    return null;
}

function DraggableMarker({ position, onLocationSelect }: {
    position: [number, number];
    onLocationSelect: (location: { lat: number; lng: number }) => void;
}) {
    const [markerPosition, setMarkerPosition] = useState(position);
    const markerRef = useRef<L.Marker>(null);

    const eventHandlers = {
        dragend: (e: L.DragEndEvent) => {
            const marker = e.target;
            const newPosition = marker.getLatLng();

            // Check if the dragged position is within Barangay 176E boundary
            if (!isPointInBoundary(newPosition.lat, newPosition.lng)) {
                toast({
                    title: "Location Outside Boundary",
                    description: "Marker must stay within Barangay 176E. Reverting to previous position.",
                    variant: "destructive",
                });
                // Revert to previous position
                marker.setLatLng(markerPosition);
                return;
            }

            setMarkerPosition([newPosition.lat, newPosition.lng]);
            onLocationSelect({ lat: newPosition.lat, lng: newPosition.lng });
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

export default function MapSelector({ onLocationSelect, initialCoordinates }: MapSelectorProps) {
    const [position, setPosition] = useState<[number, number] | null>(
        initialCoordinates?.latitude && initialCoordinates?.longitude
            ? [parseFloat(initialCoordinates.latitude), parseFloat(initialCoordinates.longitude)]
            : null
    );
    const [isClient, setIsClient] = useState(false);

    // Default center coordinates (Barangay 176E, Bagong Silang, Caloocan City)
    const defaultCenter: [number, number] = [14.78043, 121.0415];

    // Style for the boundary polygon
    const boundaryStyle = {
        color: '#3b82f6',
        weight: 3,
        opacity: 0.8,
        fillColor: '#3b82f6',
        fillOpacity: 0.1
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

    // Only render on client side to prevent SSR issues
    if (!isClient) {
        return (
            <div className="h-full w-full rounded-md border flex items-center justify-center bg-gray-100">
                <span className="text-gray-500">Loading map...</span>
            </div>
        );
    }

    return (
        <div className="h-full w-full rounded-md overflow-hidden border">
            <MapContainer
                center={defaultCenter}
                zoom={15}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Display Barangay 176E Boundary */}
                <GeoJSON
                    data={barangay176EBoundary}
                    style={boundaryStyle}
                />

                <MapEvents
                    onLocationSelect={onLocationSelect}
                    setPosition={setPosition}
                />
                {position && (
                    <DraggableMarker
                        position={position}
                        onLocationSelect={onLocationSelect}
                    />
                )}
            </MapContainer>
        </div>
    );
}