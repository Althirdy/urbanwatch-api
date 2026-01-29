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
        // Removed setOpen(false) to allow user to refine selection
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                    <MapPin className="h-4 w-4" />
                    {coordinates.latitude && coordinates.longitude
                        ? `${Number(coordinates.latitude).toFixed(4)}, ${Number(coordinates.longitude).toFixed(4)}`
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
    );
}
