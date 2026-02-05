import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { MapPin } from 'lucide-react';
import { useState } from 'react';
import MapSelector from './map-selector';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Create marker icon for preview
const markerIcon = L.icon({
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

interface MapModalProps {
    onLocationSelect: (location: { lat: number; lng: number }) => void;
    coordinates: {
        latitude: string;
        longitude: string;
    };
}

export function MapModal({ onLocationSelect, coordinates }: MapModalProps) {
    const [open, setOpen] = useState(false);

    const handleLocationSelect = (location: { lat: number; lng: number }) => {
        onLocationSelect(location);
        setOpen(false);
    };

    const hasCoordinates = coordinates.latitude && coordinates.longitude;
    const lat = hasCoordinates ? Number(coordinates.latitude) : 0;
    const lng = hasCoordinates ? Number(coordinates.longitude) : 0;

    return (
        <div className="space-y-2">
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                        <MapPin className="h-4 w-4" />
                        {hasCoordinates
                            ? `${lat.toFixed(4)}, ${lng.toFixed(4)}`
                            : 'Select Location'}
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Select Location</DialogTitle>
                        <DialogDescription>
                            Click on the map to select a location. Your selection will be saved automatically.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="h-[500px]">
                        <MapSelector
                            onLocationSelect={handleLocationSelect}
                            initialCoordinates={coordinates}
                        />
                    </div>
                </DialogContent>
            </Dialog>

            {/* Map Preview */}
            {hasCoordinates && (
                <div className="h-[150px] w-full rounded-md overflow-hidden border">
                    <MapContainer
                        center={[lat, lng]}
                        zoom={16}
                        style={{ height: '100%', width: '100%' }}
                        zoomControl={false}
                        dragging={false}
                        scrollWheelZoom={false}
                        doubleClickZoom={false}
                        attributionControl={false}
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker position={[lat, lng]} icon={markerIcon} />
                    </MapContainer>
                </div>
            )}
        </div>
    );
}
