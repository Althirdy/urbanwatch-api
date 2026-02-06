import { useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from '@inertiajs/react';
import { toast } from '@/components/use-toast';
import { Spinner } from '@/components/ui/spinner';
import { assign } from '@/routes/dashboard';

// Severity-based marker colors
const SEVERITY_COLORS: Record<string, string> = {
    high: 'red',
    medium: 'orange',
    low: 'blue',
};

const SEVERITY_LABELS: Record<string, string> = {
    high: 'High',
    medium: 'Medium',
    low: 'Low',
};

// Create colored marker icons using leaflet-color-markers
const createMarkerIcon = (severity: string | undefined | null) => {
    // Normalize severity: handle null, undefined, whitespace, and ensure lowercase
    const normalizedSeverity = (severity || 'high').toString().trim().toLowerCase();
    const color = SEVERITY_COLORS[normalizedSeverity] || 'red';
    
    return L.icon({
        iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
    });
};

// Category display labels
const CATEGORY_LABELS: Record<string, string> = {
    safety: 'Safety',
    security: 'Security',
    infrastructure: 'Infrastructure',
    environment: 'Environment',
    noise: 'Noise',
    other: 'Other',
};

interface Concern {
    id: number;
    tracking_code: string;
    title: string;
    category: string;
    severity: string;
    latitude: string;
    longitude: string;
    address: string | null;
    custom_location: string | null;
    description: string;
    type: string;
    created_at: string;
    duplicates_count: number;
}

interface PurokLeader {
    id: number;
    name: string;
    purok_name: string;
}

interface DashboardMapProps {
    puroks: any[];
    concerns: Concern[];
    purokLeaders: PurokLeader[];
}

function formatTimeAgo(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
}

export default function DashboardMap({ puroks, concerns, purokLeaders }: DashboardMapProps) {
    const [selectedConcern, setSelectedConcern] = useState<Concern | null>(null);
    const { data, setData, post, processing, reset } = useForm({
        leader_id: '',
    });

    const handleAssign = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedConcern || !data.leader_id) return;

        post(assign(selectedConcern.id).url, {
            onSuccess: () => {
                toast({
                    title: 'Assigned Successfully',
                    description: `Concern ${selectedConcern.tracking_code} has been routed.`,
                });
                setSelectedConcern(null);
                reset();
            },
            onError: () => {
                toast({
                    title: 'Assignment Failed',
                    description: 'Please try again.',
                    variant: 'destructive',
                });
            },
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
        <div className="h-full w-full relative">
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
                {puroks.map(
                    (purok) =>
                        purok.geometry && (
                            <GeoJSON
                                key={purok.id}
                                data={purok.geometry}
                                style={getPurokStyle(purok)}
                                onEachFeature={(feature, layer) => {
                                    layer.bindTooltip(purok.name, {
                                        permanent: true,
                                        direction: 'center',
                                        className: 'text-xs font-bold bg-transparent border-0 shadow-none',
                                    });
                                }}
                            />
                        ),
                )}

                {/* Render Concern Markers with severity-based colors */}
                {concerns.map((concern) => (
                    <Marker
                        key={concern.id}
                        position={[parseFloat(concern.latitude), parseFloat(concern.longitude)]}
                        icon={createMarkerIcon(concern.severity)}
                        eventHandlers={{
                            click: () => {
                                setSelectedConcern(concern);
                                setData('leader_id', '');
                            },
                        }}
                    >
                        <Popup maxWidth={300} minWidth={260} className="concern-popup">
                            <div className="space-y-2.5 p-1">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-[10px] font-mono text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded border border-gray-200 dark:border-gray-700">
                                        {concern.tracking_code}
                                    </span>
                                    <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                                        {formatTimeAgo(concern.created_at)}
                                    </span>
                                </div>
                                <h4 className="font-semibold text-sm leading-tight text-gray-900 dark:text-gray-100">{concern.title}</h4>
                                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">{concern.description}</p>
                                <div className="flex flex-wrap gap-1.5">
                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                                        concern.severity === 'high' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800' :
                                        concern.severity === 'medium' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800' :
                                        'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800'
                                    }`}>
                                        {SEVERITY_LABELS[concern.severity] || concern.severity}
                                    </span>
                                    <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-0.5 text-[10px] font-medium border border-gray-200 dark:border-gray-700">
                                        {CATEGORY_LABELS[concern.category] || concern.category}
                                    </span>
                                    {concern.duplicates_count > 0 && (
                                        <span className="inline-flex items-center rounded-full bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400 border border-violet-200 dark:border-violet-800 px-2 py-0.5 text-[10px] font-semibold">
                                            +{concern.duplicates_count} related
                                        </span>
                                    )}
                                </div>
                                {(concern.address || concern.custom_location) && (
                                    <p className="text-[11px] text-gray-600 dark:text-gray-400 flex items-start gap-1.5 pt-1">
                                        <span className="shrink-0">📍</span>
                                        <span className="leading-relaxed">{concern.custom_location || concern.address}</span>
                                    </p>
                                )}
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>

            {/* Map Legend */}
            <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 z-[9998]">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-2.5">Severity</p>
                <div className="space-y-2">
                    <div className="flex items-center gap-2.5">
                        <span className="w-3.5 h-3.5 rounded-full bg-red-500 ring-2 ring-red-200 dark:ring-red-900" />
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">High</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <span className="w-3.5 h-3.5 rounded-full bg-amber-500 ring-2 ring-amber-200 dark:ring-amber-900" />
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Medium</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <span className="w-3.5 h-3.5 rounded-full bg-blue-500 ring-2 ring-blue-200 dark:ring-blue-900" />
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Low</span>
                    </div>
                </div>
            </div>

            {/* Assignment Panel Overlay */}
            {selectedConcern && (
                <div className="absolute top-4 right-4 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl z-[9999] overflow-hidden">
                    {/* Header */}
                    <div className="flex justify-between items-start p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded border border-gray-200 dark:border-gray-700">
                                    {selectedConcern.tracking_code}
                                </span>
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                                    selectedConcern.severity === 'high' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800' :
                                    selectedConcern.severity === 'medium' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800' :
                                    'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800'
                                }`}>
                                    {SEVERITY_LABELS[selectedConcern.severity] || selectedConcern.severity}
                                </span>
                            </div>
                            <h3 className="font-semibold text-sm leading-tight text-gray-900 dark:text-gray-100">{selectedConcern.title}</h3>
                        </div>
                        <button
                            onClick={() => setSelectedConcern(null)}
                            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 text-xl leading-none p-1 transition-colors"
                        >
                            &times;
                        </button>
                    </div>

                    {/* Details */}
                    <div className="p-4 space-y-3 text-xs">
                        <div className="space-y-2 text-gray-600 dark:text-gray-400">
                            <div className="flex items-start gap-2">
                                <span className="font-semibold text-gray-700 dark:text-gray-300 shrink-0 w-20">Category</span>
                                <span>{CATEGORY_LABELS[selectedConcern.category] || selectedConcern.category}</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="font-semibold text-gray-700 dark:text-gray-300 shrink-0 w-20">Type</span>
                                <span className="capitalize">{selectedConcern.type}</span>
                            </div>
                            {(selectedConcern.address || selectedConcern.custom_location) && (
                                <div className="flex items-start gap-2">
                                    <span className="font-semibold text-gray-700 dark:text-gray-300 shrink-0 w-20">Location</span>
                                    <span className="leading-relaxed">{selectedConcern.custom_location || selectedConcern.address}</span>
                                </div>
                            )}
                            <div className="flex items-start gap-2">
                                <span className="font-semibold text-gray-700 dark:text-gray-300 shrink-0 w-20">Reported</span>
                                <span>{formatTimeAgo(selectedConcern.created_at)}</span>
                            </div>
                            {selectedConcern.duplicates_count > 0 && (
                                <div className="flex items-start gap-2">
                                    <span className="font-semibold text-gray-700 dark:text-gray-300 shrink-0 w-20">Related</span>
                                    <span className="text-violet-600 dark:text-violet-400 font-semibold">
                                        {selectedConcern.duplicates_count} duplicate report{selectedConcern.duplicates_count > 1 ? 's' : ''}
                                    </span>
                                </div>
                            )}
                        </div>

                        <p className="text-gray-600 dark:text-gray-400 line-clamp-3 italic border-l-3 border-gray-300 dark:border-gray-600 pl-3 py-1 bg-gray-50 dark:bg-gray-800/30 rounded">
                            &ldquo;{selectedConcern.description}&rdquo;
                        </p>

                        {/* Assignment Form */}
                        <form onSubmit={handleAssign} className="space-y-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                    Assign to Official
                                </label>
                                <Select value={data.leader_id} onValueChange={(val) => setData('leader_id', val)}>
                                    <SelectTrigger className="h-9 text-xs bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-2 focus:ring-primary/20">
                                        <SelectValue placeholder="Select Purok Leader" className="text-gray-900 dark:text-gray-100" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 z-[10000]">
                                        {purokLeaders.map((leader) => (
                                            <SelectItem 
                                                key={leader.id} 
                                                value={leader.id.toString()}
                                                className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 cursor-pointer"
                                            >
                                                <div className="flex items-center gap-1">
                                                    <span className="font-medium text-gray-900 dark:text-gray-100">{leader.name}</span>
                                                    <span className="text-gray-500 dark:text-gray-400">— {leader.purok_name}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button type="submit" size="sm" className="w-full text-xs font-bold shadow-sm hover:shadow-md transition-shadow" disabled={processing || !data.leader_id}>
                                {processing ? <Spinner className="w-3 h-3 mr-2" /> : null}
                                Route Concern
                            </Button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
