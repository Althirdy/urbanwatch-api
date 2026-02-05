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
import { getStatusColorClass } from '@/lib/badgeStyles';
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
}

function CCTVDisplay({
    onEdit,
    onDelete,
    onViewReports,
    onViewStream,
    devices,
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
                                        {device.location_name}
                                    </h3>
                                    {device.package && (
                                        <p className="text-xs text-muted-foreground truncate">
                                            {device.package}
                                        </p>
                                    )}
                                    {/* Status Badge */}
                                    <div className="absolute top-4 right-4 z-10">
                                        <Badge
                                            variant="outline"
                                            className={`gap-1 capitalize font-medium ${getStatusColorClass(device.status)}`}
                                        >
                                            {device.status}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            {/* Action Buttons - Premium Footer */}
                            <div className="flex items-center justify-end gap-1.5 p-3 mt-auto border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/20">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="cursor-pointer h-8 w-8 p-0 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                            onClick={() => onViewReports?.(device)}
                                        >
                                            <BarChart3 className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom" className="text-[10px] py-1 px-2">
                                        <p>View Reports</p>
                                    </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <EditCCTVDevice cctv={device}>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="cursor-pointer h-8 w-8 p-0 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                            >
                                                <SquarePen className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                                            </Button>
                                        </TooltipTrigger>
                                    </EditCCTVDevice>
                                    <TooltipContent side="bottom" className="text-[10px] py-1 px-2">
                                        <p>Edit CCTV</p>
                                    </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <ArchiveCCTV cctv={device}>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="cursor-pointer h-8 w-8 p-0 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 group"
                                            >
                                                <Archive className="h-4 w-4 text-zinc-400 group-hover:text-red-500 transition-colors" />
                                            </Button>
                                        </TooltipTrigger>
                                    </ArchiveCCTV>
                                    <TooltipContent side="bottom" className="text-[10px] py-1 px-2 ">
                                        <p>Archive CCTV</p>
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
