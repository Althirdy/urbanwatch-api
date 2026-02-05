import { MapModal } from '@/components/map-modal';
import { Button } from '@/components/ui/button';
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
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import {
    TooltipProvider,
} from '@/components/ui/tooltip';
import { toast } from '@/components/use-toast';
import { locations } from '@/lib/packages';
import { getPackageLocation } from '@/lib/geojson-packages';
import { router } from '@inertiajs/react';
import { MoveLeft, Save, SquarePen } from 'lucide-react';
import React, { useState } from 'react';
import { uwDevice_T } from '../../types/cctv-location-types';

interface EditUWDeviceProps {
    device: uwDevice_T;
    children?: React.ReactNode;
}

function EditUWDevice({
    device,
    children,
}: EditUWDeviceProps): React.JSX.Element {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deviceName, setDeviceName] = useState(device?.device_name || '');
    const [selectedLocation, setSelectedLocation] = useState('');
    const [status, setStatus] = useState<string>(device?.status || 'active');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [customAddress, setCustomAddress] = useState(
        device?.custom_address || '',
    );
    const [coordinates, setCoordinates] = useState({
        latitude: device?.custom_latitude?.toString() || '',
        longitude: device?.custom_longitude?.toString() || '',
    });

    const [errors, setErrors] = useState({
        deviceName: false,
        location: false,
    });
    const [serverErrors, setServerErrors] = useState<{ [key: string]: string }>({});

    const handleLocationChange = (value: string) => {
        setSelectedLocation(value);
        // Find the location and set the custom address to location name
        const loc = locations.find((l) => l.id.toString() === value);
        if (loc) {
            setCustomAddress(loc.name);

            // Get the GeoJSON centroid for the selected package
            const packageLocation = getPackageLocation(loc.name);
            if (packageLocation) {
                setCoordinates({
                    latitude: packageLocation.centroid.latitude.toString(),
                    longitude: packageLocation.centroid.longitude.toString(),
                });
            }
        }
    };

    const handleLocationSelect = (location: { lat: number; lng: number }) => {
        setCoordinates({
            latitude: location.lat.toString(),
            longitude: location.lng.toString(),
        });
    };

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setServerErrors({});

        const newErrors = {
            deviceName: !deviceName.trim(),
            location: !customAddress.trim() || !coordinates.latitude || !coordinates.longitude
        };

        setErrors(newErrors);

        if (newErrors.deviceName || newErrors.location) {
            toast({ title: 'Validation Error', description: 'Please fix the errors in the form.', variant: 'destructive' });
            return;
        }

        setIsSubmitting(true);
        const formData = {
            device_name: deviceName,
            status: status,
            custom_address: customAddress,
            custom_latitude: parseFloat(coordinates.latitude),
            custom_longitude: parseFloat(coordinates.longitude),
        };

        router.put(`/devices/uwdevice/${device.id}`, formData, {
            onSuccess: () => {
                router.flushAll();
                toast({ title: 'Success!', description: 'UW Device updated successfully.' });
                setDialogOpen(false);
            },
            onError: (errors) => {
                setServerErrors(errors);
                toast({ title: 'Error', description: errors.device_name || 'Failed to update UW Device.', variant: 'destructive' });
            },
            onFinish: () => setIsSubmitting(false),
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
            <DialogContent className="flex max-h-[90vh] max-w-none flex-col overflow-hidden p-0 sm:max-w-2xl" showCloseButton={false}>
                <form onSubmit={onSubmit} className="flex h-full flex-col overflow-hidden">
                    <TooltipProvider>
                        <DialogHeader className="flex-shrink-0 px-6 pt-6">
                            <DialogTitle>Edit IoT Sensor</DialogTitle>
                            <DialogDescription>Update the IoT sensor configuration</DialogDescription>
                        </DialogHeader>

                        <div className="flex-1 overflow-y-auto px-6 py-4">
                            <div className="space-y-6">
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="edit-device-name">IoT Device Name</Label>
                                    <Input
                                        id="edit-device-name"
                                        value={deviceName}
                                        onChange={(e) => {
                                            setDeviceName(e.target.value);
                                            if (errors.deviceName) setErrors(prev => ({ ...prev, deviceName: false }));
                                            if (serverErrors.device_name) setServerErrors(prev => ({ ...prev, device_name: '' }));
                                        }}
                                        className={errors.deviceName || serverErrors.device_name ? 'border-red-500' : ''}
                                    />
                                    {serverErrors.device_name && (
                                        <span className="text-sm text-red-500">{serverErrors.device_name}</span>
                                    )}
                                </div>

                                <div className="flex flex-col gap-4">
                                    <Label>Location Assignment</Label>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="location-select">Package/Area</Label>
                                            <Select onValueChange={handleLocationChange} value={selectedLocation}>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Select to update location" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectGroup>
                                                        {locations.map((loc) => (
                                                            <SelectItem key={loc.id} value={loc.id.toString()}>
                                                                {loc.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectGroup>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="edit-custom-address">Full Address</Label>
                                            <Input
                                                id="edit-custom-address"
                                                value={customAddress}
                                                onChange={(e) => setCustomAddress(e.target.value)}
                                                placeholder="Enter full address"
                                                className={errors.location && !customAddress ? 'border-red-500' : ''}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Latitude (Auto-filled)</Label>
                                                <Input
                                                    value={coordinates.latitude}
                                                    disabled
                                                    placeholder="Select on map"
                                                    className={`bg-gray-100 ${errors.location && !coordinates.latitude ? 'border-red-500' : ''}`}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Longitude (Auto-filled)</Label>
                                                <Input
                                                    value={coordinates.longitude}
                                                    disabled
                                                    placeholder="Select on map"
                                                    className={`bg-gray-100 ${errors.location && !coordinates.longitude ? 'border-red-500' : ''}`}
                                                />
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-500">Coordinates are auto-filled when you select a package. Use the map below to adjust if needed.</p>
                                        <MapModal onLocationSelect={handleLocationSelect} coordinates={coordinates} />
                                        {errors.location && (
                                            <span className="text-sm text-red-500">Please fill in address and select location on map</span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="edit-status">Status</Label>
                                    <Select value={status} onValueChange={setStatus}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectItem value="active">Active</SelectItem>
                                                <SelectItem value="inactive">Inactive</SelectItem>
                                                <SelectItem value="maintenance">Maintenance</SelectItem>
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="flex-shrink-0 px-6 py-4">
                            <div className="flex w-full gap-2">
                                <DialogClose asChild>
                                    <Button variant="outline" type="button" className="flex-1">
                                        <MoveLeft className="mr-2 h-4 w-4" /> Cancel
                                    </Button>
                                </DialogClose>
                                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                                    {isSubmitting ? <Spinner className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                                    {isSubmitting ? 'Updating...' : 'Update Device'}
                                </Button>
                            </div>
                        </DialogFooter>
                    </TooltipProvider>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default EditUWDevice;
