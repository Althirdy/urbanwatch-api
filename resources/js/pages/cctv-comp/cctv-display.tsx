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
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    Activity,
    Archive,
    BarChart3,
    Camera,
    MapPin,
    SquarePen,
    Wifi,
} from 'lucide-react';
import { useState } from 'react';
import {
    cctv_T,
    location_T,
    paginated_T,
} from '../../types/cctv-location-types';
import ArchiveCCTV from './cctv-archive';
import EditCCTVDevice from './cctv-edit';

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
                return <SquarePen className="h-3 w-3" />;
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

                            {/* Action Buttons - Compact */}
                            <div className="flex items-center justify-end gap-1.5 pt-2 border-t dark:border-zinc-800">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="cursor-pointer"
                                            onClick={() => onViewReports?.(device)}
                                        >
                                            <BarChart3 className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom">
                                        <p className="text-xs">View Reports</p>
                                    </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <EditCCTVDevice location={locations} cctv={device}>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="cursor-pointer"
                                            >
                                                <SquarePen className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                    </EditCCTVDevice>
                                    <TooltipContent side="bottom">
                                        <p className="text-xs">Edit CCTV</p>
                                    </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <ArchiveCCTV cctv={device}>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="cursor-pointer"
                                            >
                                                <Archive className="h-4 w-4 text-red-500 dark:text-red-400" />
                                            </Button>
                                        </TooltipTrigger>
                                    </ArchiveCCTV>
                                    <TooltipContent side="bottom">
                                        <p className="text-xs">Archive CCTV</p>
                                    </TooltipContent>
                                </Tooltip>
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
