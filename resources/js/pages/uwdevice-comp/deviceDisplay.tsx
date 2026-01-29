import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    Activity,
    Archive,
    Cpu,
    ExternalLink,
    Filter,
    MapPin,
    Search,
    SquarePen,
    Wifi,
    X,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import {
    cctv_T,
    location_T,
    paginated_T,
    uwDevice_T,
} from '../../types/cctv-location-types';
import ArchiveUWDevice from './archiveDevice';
import EditUWDevice from './editDevice';
import ViewUWDevice from './viewDevice';

interface UWDeviceDisplayProps {
    onEdit?: (device: uwDevice_T) => void;
    onDelete?: (device: uwDevice_T) => void;
    onViewReports?: (device: uwDevice_T) => void;
    devices: paginated_T<uwDevice_T>;
    locations?: location_T[];
    cctvDevices?: cctv_T[];
}

function UWDeviceDisplay({
    onEdit,
    onDelete,
    onViewReports,
    devices,
    locations = [],
    cctvDevices = [],
}: UWDeviceDisplayProps): React.JSX.Element {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [locationFilter, setLocationFilter] = useState<string>('all');
    const [locationTypeFilter, setLocationTypeFilter] = useState<string>('all');

    // Filter devices based on search and filters
    const filteredDevices = useMemo(() => {
        if (!devices?.data) return [];

        return devices.data.filter((device) => {
            // Search filter
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch =
                searchQuery === '' ||
                device.device_name.toLowerCase().includes(searchLower) ||
                device.location?.location_name?.toLowerCase().includes(searchLower) ||
                device.location?.barangay?.toLowerCase().includes(searchLower) ||
                device.custom_address?.toLowerCase().includes(searchLower);

            // Status filter
            const matchesStatus =
                statusFilter === 'all' ||
                device.status.toLowerCase() === statusFilter.toLowerCase();

            // Location filter
            const matchesLocation =
                locationFilter === 'all' ||
                device.location?.id?.toString() === locationFilter;

            // Location type filter (registered vs custom)
            const isCustomLocation = !device.location && device.custom_address;
            const matchesLocationType =
                locationTypeFilter === 'all' ||
                (locationTypeFilter === 'registered' && device.location) ||
                (locationTypeFilter === 'custom' && isCustomLocation);

            return matchesSearch && matchesStatus && matchesLocation && matchesLocationType;
        });
    }, [devices?.data, searchQuery, statusFilter, locationFilter, locationTypeFilter]);

    // Clear all filters
    const clearFilters = () => {
        setSearchQuery('');
        setStatusFilter('all');
        setLocationFilter('all');
        setLocationTypeFilter('all');
    };

    const hasActiveFilters =
        searchQuery !== '' ||
        statusFilter !== 'all' ||
        locationFilter !== 'all' ||
        locationTypeFilter !== 'all';

    if (!devices || !devices.data) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <Cpu className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <h3 className="text-sm font-medium text-foreground">No devices found</h3>
                <p className="text-xs text-muted-foreground mt-1">
                    No UW devices have been added yet
                </p>
            </div>
        );
    }

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

                        {/* Location Type Filter */}
                        <Select value={locationTypeFilter} onValueChange={setLocationTypeFilter}>
                            <SelectTrigger className="h-8 w-[120px] text-xs">
                                <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="registered">Registered</SelectItem>
                                <SelectItem value="custom">Custom</SelectItem>
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

            {/* UW Device Cards Grid - Compact Design */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredDevices.map((device) => (
                    <Card
                        key={device.id}
                        className="group relative py-0 overflow-hidden border bg-card transition-all duration-200 hover:shadow-md hover:border-primary/20 dark:border-zinc-800 dark:hover:border-zinc-700"
                    >
                        <CardContent className="p-6">
                            {/* Header Row */}
                            <div className="flex items-start justify-between gap-2 mb-3">
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                   
                                    <div className="min-w-0 flex flex-col gap-1">
                                        <h3 className="truncate font-semibold leading-tight">
                                            {device.device_name}
                                        </h3>
                                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                            <MapPin className="h-4 w-4 shrink-0" />
                                            <span className="truncate">
                                                {device.location?.barangay ||
                                                    (device.custom_address
                                                        ? 'Custom Location'
                                                        : 'No location')}
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

                            {/* Location Details - Compact */}
                            <div className="mb-3 text-xs p-1.5  ">
                                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Location</p>
                                {device.location ? (
                                    <p className="font-medium truncate">
                                        {device.location.location_name}
                                    </p>
                                ) : device.custom_address ? (
                                    <div className="space-y-0.5">
                                        <div className="flex items-center gap-1.5">
                                            <p className="font-medium truncate flex-1">
                                                {device.custom_address}
                                            </p>
                                            <Badge
                                                variant="outline"
                                                className="shrink-0 border-blue-200 bg-blue-50 text-xs text-blue-700 px-1 py-0 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300"
                                            >
                                                Custom
                                            </Badge>
                                        </div>
                                        {device.custom_latitude &&
                                            device.custom_longitude && (
                                                <p className="text-muted-foreground text-xs">
                                                    {Number(device.custom_latitude).toFixed(4)},{' '}
                                                    {Number(device.custom_longitude).toFixed(4)}
                                                </p>
                                            )}
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground italic">
                                        No location assigned
                                    </p>
                                )}
                            </div>

                            {/* Action Buttons - Compact */}
                            <div className="flex items-center justify-end gap-1.5 pt-2 border-t dark:border-zinc-800">
                                <Tooltip>
                                    <ViewUWDevice device={device}>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="cursor-pointer"
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                    </ViewUWDevice>
                                    <TooltipContent side="bottom">
                                        <p className="text-xs">View Device</p>
                                    </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <EditUWDevice
                                        location={locations}
                                        device={device}
                                        cctvDevices={cctvDevices}
                                    >
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="cursor-pointer"
                                            >
                                                <SquarePen className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                    </EditUWDevice>
                                    <TooltipContent side="bottom">
                                        <p className="text-xs">Edit Device</p>
                                    </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <ArchiveUWDevice device={device}>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="cursor-pointer"
                                            >
                                                <Archive className="h-4 w-4 text-red-500 dark:text-red-400" />
                                            </Button>
                                        </TooltipTrigger>
                                    </ArchiveUWDevice>
                                    <TooltipContent side="bottom">
                                        <p className="text-xs">Archive Device</p>
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
                    <Cpu className="h-12 w-12 text-muted-foreground/50 mb-3" />
                    <h3 className="text-sm font-medium text-foreground">No devices found</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                        {hasActiveFilters
                            ? 'Try adjusting your search or filters'
                            : 'No UW devices have been added yet'}
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
        </div>
    );
}

export default UWDeviceDisplay;
