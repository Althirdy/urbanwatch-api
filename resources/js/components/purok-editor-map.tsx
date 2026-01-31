import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Trash2, RotateCcw, Save } from 'lucide-react';

// Fix marker icon issue
const createMarkerIcon = (color: string) => {
    return L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6]
    });
};

interface PurokEditorMapProps {
    initialCoordinates?: [number, number][]; // [lng, lat]
    color?: string;
    onSave: (coordinates: [number, number][]) => void;
}

function MapEvents({ onMapClick }: { onMapClick: (latlng: L.LatLng) => void }) {
    useMapEvents({
        click(e) {
            onMapClick(e.latlng);
        },
    });
    return null;
}

function MapResizer() {
    const map = useMap();
    useEffect(() => {
        setTimeout(() => {
            map.invalidateSize();
        }, 200);
    }, [map]);
    return null;
}

function FitBounds({ coordinates }: { coordinates: [number, number][] }) {
    const map = useMap();
    useEffect(() => {
        if (coordinates.length > 0) {
            const bounds = L.latLngBounds(coordinates.map(c => [c[1], c[0]]));
            if (bounds.isValid()) {
                map.fitBounds(bounds, { padding: [50, 50] });
            }
        }
    }, [map]); // Only fit bounds once on mount or when map changes
    return null;
}

export default function PurokEditorMap({
    initialCoordinates = [],
    color = '#3b82f6',
    onSave,
}: PurokEditorMapProps) {
    // Leaflet uses [lat, lng], but we store [lng, lat] for GeoJSON/DB consistency
    const [points, setPoints] = useState<[number, number][]>(initialCoordinates);

    const handleMapClick = useCallback((latlng: L.LatLng) => {
        setPoints((prev) => [...prev, [latlng.lng, latlng.lat]]);
    }, []);

    const removePoint = (index: number) => {
        setPoints((prev) => prev.filter((_, i) => i !== index));
    };

    const clearPoints = () => {
        setPoints([]);
    };

    const undoLastPoint = () => {
        setPoints((prev) => prev.slice(0, -1));
    };

    // Convert [lng, lat] to [lat, lng] for Leaflet components
    const leafletPoints: [number, number][] = points.map((p) => [p[1], p[0]]);

    return (
        <div className="flex flex-col gap-4 h-full">
            <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                    Click on the map to add boundary points. Order matters!
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={undoLastPoint} disabled={points.length === 0}>
                        <RotateCcw className="w-3 h-3 mr-1" /> Undo
                    </Button>
                    <Button variant="outline" size="sm" onClick={clearPoints} disabled={points.length === 0} className="text-destructive hover:bg-destructive/10">
                        <Trash2 className="w-3 h-3 mr-1" /> Clear
                    </Button>
                    <Button size="sm" onClick={() => onSave(points)} disabled={points.length < 3}>
                        <Save className="w-3 h-3 mr-1" /> Update Boundary
                    </Button>
                </div>
            </div>

            <div className="flex-1 min-h-[400px] rounded-md overflow-hidden border">
                <MapContainer
                    center={[14.78043, 121.0415]}
                    zoom={15}
                    style={{ height: '100%', width: '100%' }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapResizer />
                    {initialCoordinates.length > 0 && <FitBounds coordinates={initialCoordinates} />}
                    <MapEvents onMapClick={handleMapClick} />

                    {leafletPoints.length >= 3 && (
                        <Polygon 
                            positions={leafletPoints} 
                            pathOptions={{ fillColor: color, color: color, fillOpacity: 0.3 }} 
                        />
                    )}

                    {leafletPoints.map((pos, idx) => (
                        <Marker 
                            key={`${idx}-${pos[0]}-${pos[1]}`}
                            position={pos} 
                            icon={createMarkerIcon(color)}
                            eventHandlers={{
                                click: (e) => {
                                    L.DomEvent.stopPropagation(e);
                                    removePoint(idx);
                                }
                            }}
                        >
                        </Marker>
                    ))}
                </MapContainer>
            </div>
            
            <div className="text-[10px] text-muted-foreground italic">
                * Note: The boundary will be automatically closed (last point connects to first).
            </div>
        </div>
    );
}
