import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from '@inertiajs/react';
import { toast } from '@/components/use-toast';
import { Spinner } from '@/components/ui/spinner';

// Fix marker icon issue
const createMarkerIcon = (color: string) => {
    // We can use custom SVG icons or standard leaflet ones.
    // For simplicity, using standard blue for now, or red for concerns.
    return L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/markers/marker-icon-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });
};

interface DashboardMapProps {
    puroks: any[];
    concerns: any[];
    purokLeaders: any[];
}

export default function DashboardMap({ puroks, concerns, purokLeaders }: DashboardMapProps) {
    const [selectedConcern, setSelectedConcern] = useState<any>(null);
    const { data, setData, post, processing, reset } = useForm({
        leader_id: '',
    });

    const handleAssign = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedConcern || !data.leader_id) return;

        post(route('dashboard.assign', selectedConcern.id), {
            onSuccess: () => {
                toast({
                    title: "Assigned Successfully",
                    description: "The concern has been routed to the selected leader.",
                });
                setSelectedConcern(null);
                reset();
            },
            onError: () => {
                toast({
                    title: "Assignment Failed",
                    description: "Please try again.",
                    variant: "destructive"
                });
            }
        });
    };

    const getPurokStyle = (purok: any) => ({
        color: purok.color || '#3b82f6',
        weight: 2,
        opacity: 0.7,
        fillColor: purok.color || '#3b82f6',
        fillOpacity: 0.1,
    });

    return (
        <div className="h-[600px] w-full rounded-xl overflow-hidden border relative">
            <MapContainer
                center={[14.78043, 121.0415]}
                zoom={15}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Render Purok Boundaries */}
                {puroks.map((purok) => (
                    purok.geometry && (
                        <GeoJSON
                            key={purok.id}
                            data={purok.geometry}
                            style={getPurokStyle(purok)}
                            onEachFeature={(feature, layer) => {
                                layer.bindTooltip(purok.name, { permanent: true, direction: "center", className: "text-xs font-bold bg-transparent border-0 shadow-none" });
                            }}
                        />
                    )
                ))}

                {/* Render Unmapped Concerns */}
                {concerns.map((concern) => (
                    <Marker
                        key={concern.id}
                        position={[parseFloat(concern.latitude), parseFloat(concern.longitude)]}
                        icon={createMarkerIcon('red')}
                        eventHandlers={{
                            click: () => {
                                setSelectedConcern(concern);
                                setData('leader_id', ''); // Reset assignment selection
                            },
                        }}
                    >
                        {/* We use a custom overlay instead of standard Popup for better UI control */}
                    </Marker>
                ))}
            </MapContainer>

            {/* Assignment Panel Overlay */}
            {selectedConcern && (
                <div className="absolute top-4 right-4 w-80 bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg p-4 z-[1000]">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-sm">Unmapped Concern #{selectedConcern.id}</h3>
                        <button onClick={() => setSelectedConcern(null)} className="text-muted-foreground hover:text-foreground">
                            &times;
                        </button>
                    </div>
                    <div className="text-xs text-muted-foreground mb-4 space-y-1">
                        <p><span className="font-medium">Type:</span> {selectedConcern.category}</p>
                        <p><span className="font-medium">Desc:</span> {selectedConcern.description}</p>
                    </div>

                    <form onSubmit={handleAssign} className="space-y-3">
                        <div className="space-y-1">
                            <label className="text-xs font-medium">Assign to Leader</label>
                            <Select
                                value={data.leader_id}
                                onValueChange={(val) => setData('leader_id', val)}
                            >
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="Select Official" />
                                </SelectTrigger>
                                <SelectContent>
                                    {purokLeaders.map((leader) => (
                                        <SelectItem key={leader.id} value={leader.id.toString()}>
                                            {leader.name} ({leader.purok_name})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button type="submit" size="sm" className="w-full" disabled={processing}>
                            {processing ? <Spinner className="w-3 h-3 mr-2" /> : null}
                            Assign Concern
                        </Button>
                    </form>
                </div>
            )}
        </div>
    );
}
