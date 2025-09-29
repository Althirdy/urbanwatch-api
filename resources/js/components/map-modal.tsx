import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import MapSelector from "./map-selector"

interface MapModalProps {
    onLocationSelect: (location: { lat: number; lng: number }) => void;
    coordinates: {
        latitude: string;
        longitude: string;
    };
}

export function MapModal({ onLocationSelect, coordinates }: MapModalProps) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                    <MapPin className="mr-2 h-4 w-4" />
                    {coordinates.latitude && coordinates.longitude
                        ? `${coordinates.latitude.slice(0, 8) + '...'}, ${coordinates.longitude.slice(0, 8) + '...'}`
                        : "Select Location"}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Select Location</DialogTitle>
                    <DialogDescription>
                        Click on the map to select a location
                    </DialogDescription>
                </DialogHeader>
                <div className="h-[500px]">
                    <MapSelector onLocationSelect={onLocationSelect} />
                </div>
            </DialogContent>
        </Dialog>
    )
}