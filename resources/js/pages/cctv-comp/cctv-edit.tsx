import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { toast } from '@/components/use-toast';
import { MapModal } from '@/components/map-modal';
import { getPackageDropdownOptions, getPackageLocation } from '@/lib/geojson-packages';
import { router, useForm } from '@inertiajs/react';
import { format } from 'date-fns';
import { ChevronDownIcon, MoveLeft, Save, SquarePen } from 'lucide-react';
import React, { useState } from 'react';
import { cctv_T } from '../../types/cctv-location-types';

interface EditCCTVDevice {
    cctv: cctv_T;
    children?: React.ReactNode;
}

function EditCCTVDevice({ cctv, children }: EditCCTVDevice) {
    // Dialog control state
    const [dialogOpen, setDialogOpen] = useState(false);
    const { data, setData, put, processing, errors } = useForm({
        location_name: cctv?.location_name || '',
        package: cctv?.package || '',
        latitude: cctv?.latitude || '',
        longitude: cctv?.longitude || '',
        primary_rtsp_url: cctv?.primary_rtsp_url || '',
        backup_rtsp_url: cctv?.backup_rtsp_url || '',
        rtsp_username: cctv?.rtsp_username || '',
        rtsp_password: '',
        status: cctv?.status || '',
        installation_date: cctv?.installation_date || '',
    });

    const [open, setOpen] = React.useState(false);
    const [date, setDate] = React.useState<Date | undefined>(() => {
        if (cctv.installation_date) {
            const originalDate = new Date(cctv.installation_date);
            return originalDate;
        }
        return undefined;
    });
    const packageOptions = getPackageDropdownOptions();

    // Called when auto-detected from map click - only updates package, keeps clicked coordinates
    const handlePackageSelectFromMap = (packageName: string) => {
        setData('package', packageName);
    };

    const handlePackageChange = (packageName: string) => {
        // Get the GeoJSON centroid for the selected package
        const packageLocation = getPackageLocation(packageName);
        if (packageLocation) {
            // Update all fields at once to avoid state batching issues
            setData({
                ...data,
                package: packageName,
                latitude: packageLocation.centroid.latitude.toString(),
                longitude: packageLocation.centroid.longitude.toString(),
            });
        } else {
            setData('package', packageName);
        }
    };

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        console.log('Form data being sent:', data);

        put(`/devices/cctv/${cctv.id}`, {
            onSuccess: () => {
                router.flushAll();
                console.log('CCTV device updated successfully');
                toast({
                    title: 'Success!',
                    description: 'CCTV device updated successfully.',
                    variant: 'default',
                });
                setDialogOpen(false);
            },
            onError: (errors) => {
                console.log('Validation errors:', errors);
                toast({
                    title: 'Error',
                    description:
                        'Failed to update CCTV device. Please check your inputs.',
                    variant: 'destructive',
                });
            },
        });
    };

    return (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
                {children || (
                    <div className="cursor-pointer rounded-full p-2 hover:bg-primary/20">
                        <SquarePen size={20} />
                    </div>
                )}
            </DialogTrigger>
            <DialogContent
                className="flex max-h-[90vh] max-w-none flex-col overflow-hidden p-0 sm:max-w-2xl"
                showCloseButton={false}
            >
                <form
                    onSubmit={onSubmit}
                    className="flex h-full flex-col overflow-hidden"
                >
                    {/* Fixed Header */}
                    <DialogHeader className="flex-shrink-0 px-6 pt-6">
                        <DialogTitle>Edit CCTV Device</DialogTitle>
                        <DialogDescription>
                            Update the CCTV camera device configuration details.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto px-6 py-4">
                        <div className="space-y-4">
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="location-name">Location Name</Label>
                                <Input
                                    id="location-name"
                                    placeholder="Enter location name (e.g., Main Entrance)"
                                    value={data.location_name}
                                    onChange={(e) =>
                                        setData('location_name', e.target.value)
                                    }
                                />
                                {errors.location_name && (
                                    <p className="mt-1 text-sm text-red-500">
                                        {errors.location_name}
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-col gap-2">
                                <Label htmlFor="package">Package/Area</Label>
                                <Select
                                    value={data.package || ''}
                                    onValueChange={handlePackageChange}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select package/area" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            {packageOptions.map((pkg) => (
                                                <SelectItem
                                                    key={pkg.id}
                                                    value={pkg.id}
                                                >
                                                    {pkg.name}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                                {errors.package && (
                                    <p className="mt-1 text-sm text-red-500">
                                        {errors.package}
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-col gap-2">
                                <Label>Location Coordinates (Auto-filled by Package)</Label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="latitude" className="text-xs">Latitude</Label>
                                        <Input
                                            id="latitude"
                                            placeholder="Latitude"
                                            value={data.latitude || ''}
                                            readOnly
                                            className="bg-gray-100"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="longitude" className="text-xs">Longitude</Label>
                                        <Input
                                            id="longitude"
                                            placeholder="Longitude"
                                            value={data.longitude || ''}
                                            readOnly
                                            className="bg-gray-100"
                                        />
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Select a package to auto-fill coordinates. You can also manually adjust them below.</p>
                                <MapModal
                                    coordinates={{
                                        latitude: data.latitude || '',
                                        longitude: data.longitude || '',
                                    }}
                                    selectedPackage={data.package}
                                    onPackageSelect={handlePackageSelectFromMap}
                                    onLocationSelect={(location) => {
                                        setData('latitude', location.lat.toString());
                                        setData('longitude', location.lng.toString());
                                    }}
                                />
                                {(errors.latitude || errors.longitude) && (
                                    <p className="mt-1 text-sm text-red-500">
                                        {errors.latitude || errors.longitude}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="rtsp-username">RTSP Username</Label>
                                    <Input
                                        id="rtsp-username"
                                        placeholder="admin"
                                        value={data.rtsp_username}
                                        onChange={(e) =>
                                            setData('rtsp_username', e.target.value)
                                        }
                                    />
                                    {errors.rtsp_username && (
                                        <p className="mt-1 text-sm text-red-500">
                                            {errors.rtsp_username}
                                        </p>
                                    )}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="rtsp-password">RTSP Password</Label>
                                    <Input
                                        id="rtsp-password"
                                        type="password"
                                        placeholder="Leave blank to keep current"
                                        value={data.rtsp_password}
                                        onChange={(e) =>
                                            setData('rtsp_password', e.target.value)
                                        }
                                    />
                                    {errors.rtsp_password && (
                                        <p className="mt-1 text-sm text-red-500">
                                            {errors.rtsp_password}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <Label htmlFor="primary-rtsp-url">
                                    Primary Base RTSP URL
                                </Label>
                                <Input
                                    id="primary-rtsp-url"
                                    placeholder="192.168.1.100:554/stream1"
                                    value={data.primary_rtsp_url}
                                    onChange={(e) =>
                                        setData(
                                            'primary_rtsp_url',
                                            e.target.value,
                                        )
                                    }
                                />
                                {errors.primary_rtsp_url && (
                                    <p className="mt-1 text-sm text-red-500">
                                        {errors.primary_rtsp_url}
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-col gap-2">
                                <Label htmlFor="backup-rtsp-url">
                                    Backup Base RTSP URL (Optional)
                                </Label>
                                <Input
                                    id="backup-rtsp-url"
                                    value={data.backup_rtsp_url}
                                    onChange={(e) =>
                                        setData(
                                            'backup_rtsp_url',
                                            e.target.value,
                                        )
                                    }
                                />
                                {errors.backup_rtsp_url && (
                                    <p className="mt-1 text-sm text-red-500">
                                        {errors.backup_rtsp_url}
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-col gap-2">
                                <Label htmlFor="cctv-status">
                                    CCTV Status
                                </Label>
                                <Select
                                    value={data.status}
                                    onValueChange={(value) =>
                                        setData('status', value)
                                    }
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectItem value="active">
                                                Active
                                            </SelectItem>
                                            <SelectItem value="inactive">
                                                Inactive
                                            </SelectItem>
                                            <SelectItem value="maintenance">
                                                Maintenance
                                            </SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                                {errors.status && (
                                    <p className="mt-1 text-sm text-red-500">
                                        {errors.status}
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-col gap-2">
                                <Label htmlFor="date-installed">
                                    Date Installed
                                </Label>
                                <Popover open={open} onOpenChange={setOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            id="date"
                                            className="w-full justify-between font-normal"
                                        >
                                            {date
                                                ? format(date, 'PPP')
                                                : 'Select date'}
                                            <ChevronDownIcon />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        className="w-auto overflow-hidden p-0"
                                        align="start"
                                    >
                                        <Calendar
                                            mode="single"
                                            selected={date}
                                            captionLayout="dropdown"
                                            onSelect={(selectedDate) => {
                                                setData(
                                                    'installation_date',
                                                    selectedDate
                                                        ? format(
                                                            selectedDate,
                                                            'yyyy-MM-dd',
                                                        )
                                                        : '',
                                                );
                                                setDate(selectedDate);
                                                setOpen(false);
                                            }}
                                        />
                                    </PopoverContent>
                                </Popover>
                                {errors.installation_date && (
                                    <p className="mt-1 text-sm text-red-500">
                                        {errors.installation_date}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Fixed Footer */}
                    <DialogFooter className="flex-shrink-0 px-6 py-4">
                        <div className="flex w-full gap-2">
                            <DialogClose asChild>
                                <Button
                                    variant="outline"
                                    type="button"
                                    className="flex-1"
                                >
                                    <MoveLeft className="inline h-4 w-4" />
                                    Close
                                </Button>
                            </DialogClose>
                            <Button
                                type="submit"
                                disabled={processing}
                                className="flex-2"
                            >
                                {processing ? (
                                    <Spinner className="inline h-4 w-4" />
                                ) : (
                                    <Save className="inline h-4 w-4" />
                                )}
                                {processing ? 'Updating...' : 'Update CCTV'}
                            </Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default EditCCTVDevice;
