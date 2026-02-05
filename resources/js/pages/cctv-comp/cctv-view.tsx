import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';

import { toast } from '@/components/use-toast';
import { router } from '@inertiajs/react';
import {
    Activity,
    Archive,
    Camera,
    Eye,
    Filter,
    MapPin,
    Search,
    SquarePen,
    Wifi,
    X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
    cctv_T,
    location_T,
    paginated_T,
} from '../../types/cctv-location-types';
import ArchiveCCTV from './cctv-archive';
import EditCCTVDevice from './cctv-edit';

interface CCTVDisplayProps {
    onEdit?: (device: cctv_T) => void;
    onDelete?: (device: cctv_T) => void;
    onViewStream?: (device: cctv_T) => void;
    devices: paginated_T<cctv_T>;
    locations: location_T[];
}

function CCTVDisplay({
    onEdit,
    onDelete,
    onViewStream,
    devices,
    locations = [],
}: CCTVDisplayProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [locationFilter, setLocationFilter] = useState<string>('all');
    const [brandFilter, setBrandFilter] = useState<string>('all');
    const [yoloFilter, setYoloFilter] = useState<string>('all');
    const [togglingYolo, setTogglingYolo] = useState<number | null>(null);

    // Get unique brands from devices
    const uniqueBrands = useMemo(() => {
        const brands = new Set(devices?.data.map((d) => d.brand).filter(Boolean));
        return Array.from(brands);
    }, [devices?.data]);

    // Handle YOLO toggle
    const handleYoloToggle = (device: cctv_T) => {
        setTogglingYolo(device.id);
        router.patch(
            `/devices/cctv/${device.id}/toggle-yolo`,
            {},
            {
                preserveScroll: true,
                preserveState: false, // Force refresh of page data
                onSuccess: () => {
                    router.flushAll(); // Clear prefetch cache to prevent stale data
                    toast({
                        title: 'Success!',
                        description: `YOLO detection ${device.yolo_enabled ? 'disabled' : 'enabled'} for ${device.device_name}.`,
                        variant: 'default',
                    });
                },
                onFinish: () => {
                    setTogglingYolo(null);
                },
            }
        );
    };

    // Filter devices based on search and filters
    const filteredDevices = useMemo(() => {
        if (!devices?.data) return [];

        return devices.data.filter((device) => {
            // Search filter
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch =
                searchQuery === '' ||
                device.device_name.toLowerCase().includes(searchLower) ||
                device.brand?.toLowerCase().includes(searchLower) ||
                device.location?.location_name?.toLowerCase().includes(searchLower) ||
                device.location?.barangay?.toLowerCase().includes(searchLower);

            // Status filter
            const matchesStatus =
                statusFilter === 'all' ||
                device.status.toLowerCase() === statusFilter.toLowerCase();

            // Location filter
            const matchesLocation =
                locationFilter === 'all' ||
                device.location?.id?.toString() === locationFilter;

            // Brand filter
            const matchesBrand =
                brandFilter === 'all' ||
                device.brand === brandFilter;

            // YOLO filter
            const matchesYolo =
                yoloFilter === 'all' ||
                (yoloFilter === 'enabled' && device.yolo_enabled) ||
                (yoloFilter === 'disabled' && !device.yolo_enabled);

            return matchesSearch && matchesStatus && matchesLocation && matchesBrand && matchesYolo;
        });
    }, [devices?.data, searchQuery, statusFilter, locationFilter, brandFilter, yoloFilter]);

    // Clear all filters
    const clearFilters = () => {
        setSearchQuery('');
        setStatusFilter('all');
        setLocationFilter('all');
        setBrandFilter('all');
        setYoloFilter('all');
    };

    const hasActiveFilters =
        searchQuery !== '' ||
        statusFilter !== 'all' ||
        locationFilter !== 'all' ||
        brandFilter !== 'all' ||
        yoloFilter !== 'all';

    // Get status badge styles
    const getStatusStyles = (status: string) => {
        switch (status.toUpperCase()) {
            case 'ACTIVE':
                return 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-500/30';
            case 'MAINTENANCE':
                return 'bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-amber-500/30';
            case 'INACTIVE':
                return 'bg-zinc-500/15 text-zinc-600 dark:bg-zinc-500/20 dark:text-zinc-400 border-zinc-500/30';
            default:
                return 'bg-zinc-500/15 text-zinc-600 dark:bg-zinc-500/20 dark:text-zinc-400 border-zinc-500/30';
        }
    };

    // Get status icon
    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
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
        <div className="space-y-4">
            {/* Search and Filter Bar */}
            <div className="flex flex-col gap-3 rounded-lg border bg-card p-3 dark:border-zinc-800">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    {/* Search Input */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search devices, brands, locations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-9"
                        />
                    </div>

                    {/* Filter Controls */}
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Filter className="h-4 w-4" />
                            <span className="text-xs font-medium hidden sm:inline">Filters:</span>
                        </div>

                        {/* Status Filter */}
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="h-8 w-[110px] text-xs">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                                <SelectItem value="maintenance">Maintenance</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Location Filter */}
                        <Select value={locationFilter} onValueChange={setLocationFilter}>
                            <SelectTrigger className="h-8 w-[130px] text-xs">
                                <SelectValue placeholder="Location" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Locations</SelectItem>
                                {locations.map((loc) => (
                                    <SelectItem key={loc.id} value={loc.id.toString()}>
                                        {loc.location_name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Brand Filter */}
                        <Select value={brandFilter} onValueChange={setBrandFilter}>
                            <SelectTrigger className="h-8 w-[110px] text-xs">
                                <SelectValue placeholder="Brand" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Brands</SelectItem>
                                {uniqueBrands.map((brand) => (
                                    <SelectItem key={brand} value={brand}>
                                        {brand}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* YOLO Filter */}
                        <Select value={yoloFilter} onValueChange={setYoloFilter}>
                            <SelectTrigger className="h-8 w-[110px] text-xs">
                                <SelectValue placeholder="YOLO" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All YOLO</SelectItem>
                                <SelectItem value="enabled">Enabled</SelectItem>
                                <SelectItem value="disabled">Disabled</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Clear Filters */}
                        {hasActiveFilters && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearFilters}
                                className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-3 w-3 mr-1" />
                                Clear
                            </Button>
                        )}
                    </div>
                </div>

                {/* Results count */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                        Showing {filteredDevices.length} of {devices?.data?.length || 0} devices
                    </span>
                    {hasActiveFilters && (
                        <span className="text-primary">Filters applied</span>
                    )}
                </div>
            </div>

            {/* CCTV Cards Grid - Compact Design */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredDevices.map((device) => (
                    <Card
                        key={device.id}
                        className="group py-0 relative overflow-hidden border bg-card transition-all duration-200 hover:shadow-md hover:border-primary/20 dark:border-zinc-800 dark:hover:border-zinc-700"
                    >
                        <CardContent className="p-6">
                            {/* Header Row */}
                            <div className="flex items-start justify-between gap-2 mb-3">
                                <div className="flex items-center gap-2 min-w-0 flex-1">

                                    <div className="min-w-0 flex flex-col gap-1">
                                        <h3 className="truncate  font-semibold leading-tight">
                                            {device.device_name}
                                        </h3>
                                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                            <MapPin className="h-auto w-4 shrink-0" />
                                            <span className="truncate">
                                                {device.location?.barangay}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <Badge
                                    variant="outline"
                                    className={`shrink-0 gap-1 text-xs font-medium px-1.5 py-0.5 capitalize ${getStatusStyles(device.status)}`}
                                >
                                    {getStatusIcon(device.status)}
                                    {device.status}
                                </Badge>
                            </div>

                            {/* Specs Grid - Compact */}
                            <div className="grid grid-cols-3 gap-2 mb-3 text-xs text-left">
                                <div className=" bg-zinc-50 dark:bg-zinc-800/50 p-1.5">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Res</p>
                                    <p className="font-medium truncate">{device.resolution}</p>
                                </div>
                                <div className=" bg-zinc-50 dark:bg-zinc-800/50 p-1.5">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wide">FPS</p>
                                    <p className="font-medium">{device.fps}</p>
                                </div>
                                <div className=" bg-zinc-50 dark:bg-zinc-800/50 p-1.5">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Brand</p>
                                    <p className="font-medium truncate">{device.brand}</p>
                                </div>
                            </div>

                            {/* Location - Compact */}
                            <div className="mb-3 text-xs p-1.5">
                                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Location</p>
                                <p className="font-medium truncate">{device.location?.location_name}</p>
                            </div>

                            {/* YOLO Detection Toggle */}
                            <div className="flex items-center justify-between mb-3 rounded-md bg-zinc-50 dark:bg-zinc-800/50 p-1.5">
                                <div className="flex items-center gap-2">
                                    <Eye className={`h-auto w-5 ${device.yolo_enabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`} />
                                    <div>
                                        <p className="text-xs font-medium">YOLO Detection</p>
                                        <p className="text-xs text-muted-foreground">
                                            {device.yolo_enabled ? 'Running' : 'Disabled'}
                                        </p>
                                    </div>
                                </div>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div>
                                            <Switch
                                                checked={device.yolo_enabled}
                                                onCheckedChange={() => handleYoloToggle(device)}
                                                disabled={togglingYolo === device.id || device.status.toLowerCase() !== 'active'}
                                                className={device.yolo_enabled ? 'data-[state=checked]:bg-emerald-600' : ''}
                                            />
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="left">
                                        <p className="text-xs">
                                            {device.status.toLowerCase() !== 'active'
                                                ? 'CCTV must be active to enable YOLO'
                                                : device.yolo_enabled
                                                    ? 'Disable YOLO detection'
                                                    : 'Enable YOLO detection'}
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>

                            {/* Action Buttons - Compact */}
                            <div className="flex items-center justify-end gap-1.5 pt-2 border-t dark:border-zinc-800">
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

            {/* Empty State */}
            {filteredDevices.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Camera className="h-12 w-12 text-muted-foreground/50 mb-3" />
                    <h3 className="text-sm font-medium text-foreground">No devices found</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                        {hasActiveFilters
                            ? 'Try adjusting your search or filters'
                            : 'No CCTV devices have been added yet'}
                    </p>
                    {hasActiveFilters && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={clearFilters}
                            className="mt-3 text-xs"
                        >
                            Clear all filters
                        </Button>
                    )}
                </div>
            )}

            {/* Pagination Controls */}
            {devices && devices.links && filteredDevices.length > 0 && (
                <Pagination className="flex justify-end">
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious
                                href={devices.prev_page_url || '#'}
                                className="h-8 text-xs"
                            />
                        </PaginationItem>
                        {devices.links.map((link, index) => {
                            if (link.url !== null) {
                                return (
                                    <PaginationItem key={index}>
                                        <PaginationLink
                                            isActive={link.active}
                                            href={link.url || '#'}
                                            className="h-8 w-8 text-xs"
                                        >
                                            {link.label}
                                        </PaginationLink>
                                    </PaginationItem>
                                );
                            }
                            return null;
                        })}
                        <PaginationItem>
                            <PaginationEllipsis className="h-8" />
                        </PaginationItem>
                        <PaginationItem>
                            <PaginationNext
                                href={devices.next_page_url || '#'}
                                className="h-8 text-xs"
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            )}
        </div>
    );
}

export default CCTVDisplay;
