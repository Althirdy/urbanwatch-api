import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { toast } from '@/components/use-toast';

function MapResizer() {
    const map = useMap();
    useEffect(() => {
        setTimeout(() => {
            map.invalidateSize();
        }, 200);
    }, [map]);
    return null;
}

function FitBounds({ puroks }: { puroks: PurokData[] }) {
    const map = useMap();

    useEffect(() => {
        if (!puroks || puroks.length === 0) return;

        const validGeometries = puroks
            .filter(p => p.geometry)
            .map(p => p.geometry);

        if (validGeometries.length > 0) {
            try {
                // Create a temporary GeoJSON layer to calculate bounds
                const tempLayer = L.geoJSON(validGeometries);
                const bounds = tempLayer.getBounds();

                if (bounds.isValid()) {
                    map.fitBounds(bounds, { padding: [50, 50] });
                }
            } catch (e) {
                console.error("Error fitting bounds:", e);
            }
        }
    }, [puroks, map]);

    return null;
}

interface PurokData {
    id: number;
    name: string;
    geometry: any; // GeoJSON geometry object
    status: 'occupied' | 'available';
    active_leader_name?: string | null;
}

interface PurokSelectorMapProps {
    puroks: PurokData[];
    selectedPurokId?: number | null;
    onSelectPurok: (purokId: number, purokName: string, latitude: number, longitude: number) => void;
}

export default function PurokSelectorMap({
    puroks,
    selectedPurokId,
    onSelectPurok,
}: PurokSelectorMapProps) {
    const [isClient, setIsClient] = useState(false);

    // Default center coordinates (Barangay 176E)
    const defaultCenter: [number, number] = [14.78043, 121.0415];

    useEffect(() => {
        setIsClient(true);
        console.log('PurokSelectorMap mounted. Puroks:', puroks);
    }, [puroks]);

    const onEachFeature = (purok: PurokData) => (feature: any, layer: L.Layer) => {
        // Add tooltip with name and optional assigned leader
        const tooltipText = purok.active_leader_name
            ? `${purok.name}<br/>Purok Leader: ${purok.active_leader_name}`
            : purok.name;

        layer.bindTooltip(tooltipText, {
            permanent: false,
            direction: 'center',
            className: 'text-xs font-bold whitespace-pre-line'
        });

        layer.on({
            click: () => {
                if (purok.status === 'occupied') {
                    const occupiedByText = purok.active_leader_name
                        ? `Assigned to ${purok.active_leader_name}.`
                        : 'Assigned to another active leader.';

                    toast({
                        title: "Area Unavailable",
                        description: `The territory "${purok.name}" is unavailable. ${occupiedByText}`,
                        variant: "destructive",
                    });
                } else {
                    // Calculate centroid of the polygon
                    const bounds = (layer as any).getBounds();
                    const center = bounds.getCenter();
                    const latitude = center.lat;
                    const longitude = center.lng;

                    onSelectPurok(purok.id, purok.name, latitude, longitude);
                    toast({
                        title: "Territory Selected",
                        description: `You have selected "${purok.name}".`,
                        variant: "default", // or success if available
                        className: "bg-green-600 text-white"
                    });
                }
            },
            mouseover: (e) => {
                const target = e.target;
                target.setStyle({
                    weight: 5,
                    fillOpacity: 0.7
                });
            },
            mouseout: (e) => {
                const target = e.target;
                // Reset style is handled by React-Leaflet re-render or we can manually reset
                // But for simplicity, we rely on the style function below which uses state/props
                // Actually, manual reset is safer for hover effects
                target.setStyle(getStyle(purok));
            }
        });
    };

    const getStyle = (purok: PurokData) => {
        const isSelected = selectedPurokId === purok.id;
        const isOccupied = purok.status === 'occupied';

        let color = '#3b82f6'; // Default Blue
        let fillColor = '#3b82f6';
        let fillOpacity = 0.4;

        if (isOccupied) {
            color = '#6b7280'; // Gray
            fillColor = '#6b7280';
            fillOpacity = 0.6;
        } else if (isSelected) {
            color = '#22c55e'; // Green (Selected)
            fillColor = '#22c55e';
            fillOpacity = 0.8;
        } else {
            color = '#10b981'; // Green (Available)
            fillColor = '#10b981';
            fillOpacity = 0.3;
        }

        return {
            color: color,
            weight: isSelected ? 3 : 2,
            opacity: 1,
            fillColor: fillColor,
            fillOpacity: fillOpacity,
        };
    };

    if (!isClient) {
        return (
            <div className="h-64 w-full rounded-md border flex items-center justify-center bg-gray-100">
                <span className="text-gray-500">Loading map...</span>
            </div>
        );
    }

    return (
        <div className="h-96 w-full rounded-md overflow-hidden border">
            <MapContainer
                center={defaultCenter}
                zoom={15}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
            >
                <MapResizer />
                <FitBounds puroks={puroks} />
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {puroks.map((purok) => (
                    purok.geometry && (
                        <GeoJSON
                            key={purok.id}
                            data={purok.geometry}
                            style={() => getStyle(purok)}
                            onEachFeature={onEachFeature(purok)}
                        />
                    )
                ))}
            </MapContainer>
            <div className="bg-white p-2 text-xs flex gap-4 border-t">
                <div className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 opacity-30 border border-green-500"></span> Available</div>
                <div className="flex items-center gap-1"><span className="w-3 h-3 bg-gray-500 opacity-60 border border-gray-500"></span> Occupied</div>
                <div className="flex items-center gap-1"><span className="w-3 h-3 bg-green-600 opacity-80 border border-green-600"></span> Selected</div>
            </div>
        </div>
    );
}
