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
import { getStatusColorClass } from '@/lib/badgeStyles';
import { getPackageDropdownOptions } from '@/lib/geojson-packages';
import {
    Activity,
    Archive,
    Cpu,
    ExternalLink,
    Filter,
    MapPin,
    Search,
    SquarePen,
    Locate,
    X,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import {
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
}

function UWDeviceDisplay({
    onEdit,
    onDelete,
    onViewReports,
    devices,
}: UWDeviceDisplayProps): React.JSX.Element {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [locationFilter, setLocationFilter] = useState<string>('all');

    // Filter devices based on search and filters
    const filteredDevices = useMemo(() => {
        if (!devices?.data) return [];

        return devices.data.filter((device) => {
            // Search filter
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch =
                searchQuery === '' ||
                device.device_name.toLowerCase().includes(searchLower) ||
                device.custom_address?.toLowerCase().includes(searchLower);

            // Status filter
            const matchesStatus =
                statusFilter === 'all' ||
                device.status.toLowerCase() === statusFilter.toLowerCase();

            // Location filter - match against custom_address or find location name
            const deviceLocationName = device.custom_address || '';
            const matchesLocation =
                locationFilter === 'all' ||
                deviceLocationName.toLowerCase().includes(locationFilter.toLowerCase());

            return matchesSearch && matchesStatus && matchesLocation;
        });
    }, [devices?.data, searchQuery, statusFilter, locationFilter]);

    // Clear all filters
    const clearFilters = () => {
        setSearchQuery('');
        setStatusFilter('all');
        setLocationFilter('all');
    };

    const hasActiveFilters =
        searchQuery !== '' ||
        statusFilter !== 'all' ||
        locationFilter !== 'all';

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
                                {getPackageDropdownOptions().map((pkg) => (
                                    <SelectItem key={pkg.id} value={pkg.name}>
                                        {pkg.name}
                                    </SelectItem>
                                ))}
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
                        className="group relative py-4 overflow-hidden border bg-card transition-all duration-200 hover:shadow-md hover:border-primary/20 dark:border-zinc-800 dark:hover:border-zinc-700 h-full"
                    >
                        <CardContent className="p-4 flex flex-col h-full">
                            {/* Header Row */}
                            <div className="flex items-center justify-between gap-4 mb-3">
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <div className="min-w-0 flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="truncate text-sm font-semibold">
                                                {device.device_name}
                                            </h3>

                                        </div>

                                        <div className="flex items-center gap-1 text-xs text-muted-foreground ">
                                            <span className="truncate">
                                                Device ID: {device.device_id}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <Badge
                                    variant="outline"
                                    className={`shrink-0 gap-1 text-xs font-medium px-1.5 py-0.5 capitalize ${getStatusColorClass(device.status)}`}
                                >
                                    {device.status}
                                </Badge>
                            </div>

                            {/* Location Details - Compact */}
                            <div className="mb-4 text-xs ">
                                {device.custom_address ? (
                                    <div className="space-y-2">
                                        <div className="text-xs flex gap-1 text-muted-foreground ">
                                            <MapPin className="inline h-4 w-auto " />
                                            <p>{device.custom_address}</p>
                                        </div>
                                        <div className="text-xs flex gap-1 text-muted-foreground ">
                                            <Locate className="inline h-4 w-auto " />
                                            {device.custom_latitude && device.custom_longitude && (
                                                <p className="text-muted-foreground text-xs">
                                                    {Number(device.custom_latitude).toFixed(4)},{' '}
                                                    {Number(device.custom_longitude).toFixed(4)}
                                                </p>
                                            )}
                                        </div>

                                    </div>
                                ) : (
                                    <p className="text-muted-foreground italic">
                                        No location assigned
                                    </p>
                                )}
                            </div>

                            {/* Anomaly Count Metric */}

                            <div className="flex items-center justify-between rounded-[var(--radius)] bg-zinc-50 px-4 py-2 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-muted-foreground capitalize">Anomalies Detected</span>
                                </div>
                                <span className="text-sm font-bold text-foreground">
                                    {device.anomaly_count || 0}
                                </span>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-end gap-1.5 pt-1.5 mt-auto dark:border-zinc-800">

                                <Tooltip>
                                    <EditUWDevice device={device}>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="cursor-pointer h-8 w-8 p-0 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                            >
                                                <SquarePen className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                                            </Button>
                                        </TooltipTrigger>
                                    </EditUWDevice>
                                    <TooltipContent side="bottom" className="text-[10px] py-1 px-2">
                                        <p>Edit Device</p>
                                    </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <ArchiveUWDevice device={device}>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="cursor-pointer h-8 w-8 p-0 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 group"
                                            >
                                                <Archive className="h-4 w-4 text-zinc-400 group-hover:text-red-500 transition-colors" />
                                            </Button>
                                        </TooltipTrigger>
                                    </ArchiveUWDevice>
                                    <TooltipContent side="bottom" className="text-[10px] py-1 px-2">
                                        <p>Archive Device</p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        </CardContent>
                    </Card>
                ))
                }
            </div >

            {/* Empty State */}
            {
                filteredDevices.length === 0 && (
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
                )
            }
        </div >
    );
}

export default UWDeviceDisplay;
