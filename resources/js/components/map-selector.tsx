import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import type { LeafletMouseEvent } from 'leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

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

interface MapSelectorProps {
    onLocationSelect: (location: { lat: number; lng: number }) => void;
}

function MapEvents({ onLocationSelect, setPosition }: {
    onLocationSelect: (location: { lat: number; lng: number }) => void;
    setPosition: (position: [number, number]) => void;
}) {
    useMapEvents({
        click(e: LeafletMouseEvent) {
            const { lat, lng } = e.latlng;
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

export default function MapSelector({ onLocationSelect }: MapSelectorProps) {
    const [position, setPosition] = useState<[number, number] | null>(null);
    const [isClient, setIsClient] = useState(false);

    // Default center coordinates (Barangay 176E, Bagong Silang, Caloocan City)
    const defaultCenter: [number, number] = [14.78043, 121.0375];

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