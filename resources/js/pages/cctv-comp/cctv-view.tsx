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
import { getStatusCardColorClass } from '@/lib/badgeStyles';
import { getPackageDropdownOptions } from '@/lib/geojson-packages';
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
    Locate,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
    cctv_T,
    paginated_T,
} from '../../types/cctv-location-types';
import ArchiveCCTV from './cctv-archive';
import EditCCTVDevice from './cctv-edit';

interface CCTVDisplayProps {
    onEdit?: (device: cctv_T) => void;
    onDelete?: (device: cctv_T) => void;
    onViewStream?: (device: cctv_T) => void;
    devices: paginated_T<cctv_T>;
    filters?: {
        search: string;
        status: string;
        package: string;
        yolo: string;
    };
}

function CCTVDisplay({
    onEdit,
    onDelete,
    onViewStream,
    devices,
    filters,
}: CCTVDisplayProps) {
    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    const [statusFilter, setStatusFilter] = useState<string>(filters?.status || 'all');
    const [packageFilter, setPackageFilter] = useState<string>(filters?.package || 'all');
    const [yoloFilter, setYoloFilter] = useState<string>(filters?.yolo || 'all');
    const [togglingYolo, setTogglingYolo] = useState<number | null>(null);

    // Debounced search handler
    useEffect(() => {
        const timer = setTimeout(() => {
            updateFilters();
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Update filters via URL navigation
    const updateFilters = () => {
        router.get('/devices', {
            search: searchQuery,
            status: statusFilter,
            package: packageFilter,
            yolo: yoloFilter,
            page: 1, // Reset to page 1 when filters change
        }, {
            preserveState: true,
            preserveScroll: true,
            only: ['devices', 'filters'],
        });
    };

    // Handle filter changes (non-search)
    const handleFilterChange = (filterType: string, value: string) => {
        const newFilters = {
            search: searchQuery,
            status: statusFilter,
            package: packageFilter,
            yolo: yoloFilter,
            page: 1,
        };

        if (filterType === 'status') {
            setStatusFilter(value);
            newFilters.status = value;
        } else if (filterType === 'package') {
            setPackageFilter(value);
            newFilters.package = value;
        } else if (filterType === 'yolo') {
            setYoloFilter(value);
            newFilters.yolo = value;
        }

        router.get('/devices', newFilters, {
            preserveState: true,
            preserveScroll: true,
            only: ['devices', 'filters'],
        });
    };

    // Handle YOLO toggle
    const handleYoloToggle = (device: cctv_T) => {
        setTogglingYolo(device.id);
        router.patch(
            `/devices/cctv/${device.id}/toggle-yolo`,
            {},
            {
                preserveScroll: true,
                preserveState: false,
                onSuccess: () => {
                    router.flushAll();
                    toast({
                        title: 'Success!',
                        description: `YOLO detection ${device.yolo_enabled ? 'disabled' : 'enabled'} for ${device.location_name}.`,
                        variant: 'default',
                    });
                },
                onFinish: () => {
                    setTogglingYolo(null);
                },
            }
        );
    };

    // Clear all filters
    const clearFilters = () => {
        setSearchQuery('');
        setStatusFilter('all');
        setPackageFilter('all');
        setYoloFilter('all');

        router.get('/devices', {
            search: '',
            status: 'all',
            package: 'all',
            yolo: 'all',
            page: 1,
        }, {
            preserveState: true,
            preserveScroll: true,
            only: ['devices', 'filters'],
        });
    };

    const hasActiveFilters =
        searchQuery !== '' ||
        statusFilter !== 'all' ||
        packageFilter !== 'all' ||
        yoloFilter !== 'all';


    return (
        <div className="space-y-4">
            {/* Search and Filter Bar */}
            <div className="flex flex-col gap-3 rounded-lg border bg-card p-3 dark:border-zinc-800">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    {/* Search Input */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search devices, locations..."
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
                        <Select value={statusFilter} onValueChange={(value) => handleFilterChange('status', value)}>
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

                        {/* Package Filter */}
                        <Select value={packageFilter} onValueChange={(value) => handleFilterChange('package', value)}>
                            <SelectTrigger className="h-8 w-[130px] text-xs">
                                <SelectValue placeholder="Package" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Packages</SelectItem>
                                {getPackageDropdownOptions().map((pkg) => (
                                    <SelectItem key={pkg.id} value={pkg.name}>
                                        {pkg.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* YOLO Filter */}
                        <Select value={yoloFilter} onValueChange={(value) => handleFilterChange('yolo', value)}>
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
                        Showing {devices?.data?.length || 0} of {devices?.total || 0} devices
                        {devices?.last_page > 1 && ` (Page ${devices?.current_page} of ${devices?.last_page})`}
                    </span>
                    {hasActiveFilters && (
                        <span className="text-primary">Filters applied</span>
                    )}
                </div>
            </div>

            {/* CCTV Cards Grid - Compact Design */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {devices?.data?.map((device) => (
                    <Card
                        key={device.id}
                        className="group py-4 relative overflow-hidden border bg-card transition-all duration-200 hover:shadow-md hover:border-primary/20 dark:border-zinc-800 dark:hover:border-zinc-700"
                    >
                        <CardContent className="p-6">
                            {/* Header Row */}
                            <div className="flex items-start justify-between gap-2 mb-3">
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <div className="min-w-0 flex flex-col gap-2">
                                        <h3 className="truncate text-sm font-semibold leading-tight">
                                            {device.location_name}
                                        </h3>
                                        {device.package && (
                                            <div className="text-xs flex gap-1 text-muted-foreground ">
                                                <MapPin className="inline h-4 w-auto " />
                                                <p>  {device.package}</p>
                                            </div>
                                        )}
                                        {device.latitude && device.longitude && (
                                            <div className="text-xs flex gap-1 text-muted-foreground ">
                                                <Locate className="inline h-4 w-auto " />
                                                <p className="font-mono">
                                                    {Number(device.latitude).toFixed(4)},{' '}
                                                    {Number(device.longitude).toFixed(4)}
                                                </p>
                                            </div>
                                        )}


                                    </div>
                                </div>
                                <Badge
                                    variant="outline"
                                    className={`shrink-0 gap-1 text-xs font-medium px-1.5 py-0.5 capitalize ${getStatusCardColorClass(device.status?.toLowerCase() === 'active')}`}
                                >
                                    {device.status}
                                </Badge>
                            </div>


                            {/* YOLO Detection Toggle */}
                            <div className="flex items-center justify-between mb-3  bg-zinc-50 dark:bg-zinc-800/50 ">
                                <div className="flex items-center gap-2">
                                    <Eye className={`h-auto w-5 ${device.yolo_enabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`} />
                                    <div>
                                        <p className="text-xs font-medium">YOLO Detection</p>
                                        <p className="text-xs text-muted-foreground">
                                            {device.yolo_enabled ? '' : ''}
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
                                                    ? 'YOLO detection'
                                                    : 'YOLO detection'}
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>

                            {/* Action Buttons - Compact */}
                            <div className="flex items-center justify-end gap-1.5 pt-2 dark:border-zinc-800">
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
                                    <TooltipContent side="bottom" className="text-[10px] py-1 px-2">
                                        <p>Archive CCTV</p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Empty State */}
            {
                devices?.data?.length === 0 && (
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
                )
            }

            {/* Pagination Controls */}
            {
                devices && devices.links && devices.data && devices.data.length > 0 && (
                    <Pagination className="flex justify-end">
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (devices.prev_page_url) {
                                            const url = new URL(devices.prev_page_url);
                                            const page = url.searchParams.get('page') || '1';
                                            router.get('/devices', {
                                                search: searchQuery,
                                                status: statusFilter,
                                                package: packageFilter,
                                                yolo: yoloFilter,
                                                page: page,
                                            }, {
                                                preserveState: true,
                                                preserveScroll: true,
                                                only: ['devices', 'filters'],
                                            });
                                        }
                                    }}
                                    className={`h-8 text-xs ${!devices.prev_page_url ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}
                                />
                            </PaginationItem>
                            {devices.links
                                .filter((link) => {
                                    // Skip Previous and Next labels (handled separately)
                                    return !link.label.includes('Previous') && !link.label.includes('Next');
                                })
                                .map((link, index) => {
                                    if (link.url !== null) {
                                        return (
                                            <PaginationItem key={index}>
                                                <PaginationLink
                                                    isActive={link.active}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        if (link.url) {
                                                            const url = new URL(link.url);
                                                            const page = url.searchParams.get('page') || '1';
                                                            router.get('/devices', {
                                                                search: searchQuery,
                                                                status: statusFilter,
                                                                package: packageFilter,
                                                                yolo: yoloFilter,
                                                                page: page,
                                                            }, {
                                                                preserveState: true,
                                                                preserveScroll: true,
                                                                only: ['devices', 'filters'],
                                                            });
                                                        }
                                                    }}
                                                    className="h-8 w-8 text-xs cursor-pointer"
                                                >
                                                    {link.label}
                                                </PaginationLink>
                                            </PaginationItem>
                                        );
                                    }
                                    // Show ellipsis for null url (...)
                                    if (link.label === '...') {
                                        return (
                                            <PaginationItem key={index}>
                                                <PaginationEllipsis className="h-8" />
                                            </PaginationItem>
                                        );
                                    }
                                    return null;
                                })}
                            <PaginationItem>
                                <PaginationNext
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (devices.next_page_url) {
                                            const url = new URL(devices.next_page_url);
                                            const page = url.searchParams.get('page') || '1';
                                            router.get('/devices', {
                                                search: searchQuery,
                                                status: statusFilter,
                                                package: packageFilter,
                                                yolo: yoloFilter,
                                                page: page,
                                            }, {
                                                preserveState: true,
                                                preserveScroll: true,
                                                only: ['devices', 'filters'],
                                            });
                                        }
                                    }}
                                    className={`h-8 text-xs ${!devices.next_page_url ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                )
            }
        </div >
    );
}

export default CCTVDisplay;
