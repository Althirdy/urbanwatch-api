import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import {
    Activity,
    BarChart3,
    Camera,
    MapPin,
    Settings,
    Wifi,
} from 'lucide-react';
import { useState } from 'react';
import {
    cctv_T,
    location_T,
    paginated_T,
} from '../../types/cctv-location-types';
import EditCCTVDevice from './EditCCTV';
import ArchiveCCTV from './archiveCCTV';

interface CCTVDisplayProps {
    onEdit?: (device: any) => void;
    onDelete?: (device: any) => void;
    onViewReports?: (device: any) => void;
    onViewStream?: (device: any) => void;
    devices: paginated_T<cctv_T>;
    locations: location_T[];
}

function CCTVDisplay({
    onEdit,
    onDelete,
    onViewReports,
    onViewStream,
    devices,
    locations = [],
}: CCTVDisplayProps) {
    const [selectedDevices, setSelectedDevices] = useState<number[]>([]);

    // Handle individual device selection
    const handleDeviceSelect = (deviceId: number, checked: boolean) => {
        if (checked) {
            setSelectedDevices((prev) => [...prev, deviceId]);
        } else {
            setSelectedDevices((prev) => prev.filter((id) => id !== deviceId));
        }
    };

    // Get status badge variant
    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'active':
                return 'default';
            case 'inactive':
                return 'secondary';
            case 'maintenance':
                return 'destructive';
            default:
                return 'outline';
        }
    };

    // Get status icon
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'active':
                return <Activity className="h-3 w-3" />;
            case 'inactive':
                return <Wifi className="h-3 w-3" />;
            case 'maintenance':
                return <Settings className="h-3 w-3" />;
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6">
            {/* CCTV Cards Grid */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {devices?.data.map((device) => (
                    <Card
                        key={device.id}
                        className="group relative overflow-hidden transition-all duration-200 hover:shadow-md"
                    >
                        <CardHeader className="pb-3">
                            <div className="flex items-start gap-3">
                                <div className="rounded-lg bg-blue-100 p-2">
                                    <Camera className="h-5 w-5 text-blue-600" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="truncate text-base font-semibold">
                                        {device.device_name}
                                    </h3>
                                    <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                                        <MapPin className="h-3 w-3" />
                                        <span className="truncate">
                                            {device.location.barangay}
                                        </span>
                                    </div>
                                    {/* Status Badge */}
                                    <div className="absolute top-4 right-4 z-10">
                                        <Badge
                                            variant={getStatusVariant(
                                                device.status,
                                            )}
                                            className="gap-1 capitalize"
                                        >
                                            {getStatusIcon(device.status)}
                                            {device.status}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            {/* Technical Details */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-muted-foreground">
                                        Resolution
                                    </p>
                                    <p className="font-medium">
                                        {device.resolution}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">FPS</p>
                                    <p className="font-medium">{device.fps}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">
                                        Brand
                                    </p>
                                    <p className="font-medium">
                                        {device.brand}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">
                                        Category
                                    </p>
                                    <p className="font-medium">
                                        {device.location.category_name}
                                    </p>
                                </div>
                            </div>

                            {/* Location Details */}
                            <div className="border-t pt-2">
                                <p className="mb-1 text-xs text-muted-foreground">
                                    Location
                                </p>
                                <p className="text-sm font-medium">
                                    {device.location.location_name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {device.location.landmark}
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-between pt-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onViewReports?.(device)}
                                    className="gap-2 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                                >
                                    <BarChart3 className="h-4 w-4" />
                                    Reports
                                </Button>
                                <div className="flex items-center gap-1">
                                    <EditCCTVDevice
                                        location={locations}
                                        cctv={device}
                                    />
                                    <ArchiveCCTV cctv={device} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Pagination Controls */}
            {devices && devices.links && (
                <Pagination className="flex justify-end">
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious
                                href={devices.prev_page_url || '#'}
                            />
                        </PaginationItem>
                        {devices.links.map((link, index) => {
                            if (link.url !== null) {
                                return (
                                    <PaginationItem key={index}>
                                        <PaginationLink
                                            isActive={link.active}
                                            href={link.url || '#'}
                                        >
                                            {link.label}
                                        </PaginationLink>
                                    </PaginationItem>
                                );
                            }
                        })}
                        <PaginationItem>
                            <PaginationEllipsis />
                        </PaginationItem>
                        <PaginationItem>
                            <PaginationNext
                                href={devices.next_page_url || '#'}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            )}
        </div>
    );
}

export default CCTVDisplay;
