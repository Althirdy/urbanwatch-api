import { MapModal } from '@/components/map-modal';
import { Badge } from '@/components/ui/badge';
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
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from '@/components/use-toast';
import { router } from '@inertiajs/react';
import { Camera, Check, HelpCircle, MoveLeft, Save, SquarePen } from 'lucide-react';
import React, { useState } from 'react';
import {
    cctv_T,
    location_T,
    uwDevice_T,
} from '../../types/cctv-location-types';

interface EditUWDeviceProps {
    location: location_T[];
    device: uwDevice_T;
    cctvDevices?: cctv_T[];
    children?: React.ReactNode;
}

function EditUWDevice({
    location,
    device,
    cctvDevices,
    children,
}: EditUWDeviceProps): React.JSX.Element {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deviceName, setDeviceName] = useState(device?.device_name || '');
    const [selectedLocation, setSelectedLocation] = useState(
        device?.location?.id?.toString() || '',
    );
    const [selectedLocationDetails, setSelectedLocationDetails] =
        useState<location_T | null>(device?.location || null);
    const [status, setStatus] = useState<string>(device?.status || 'active');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [useCustomLocation, setUseCustomLocation] = useState(
        !!device?.custom_address,
    );
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

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'active': return 'default';
            case 'inactive': return 'secondary';
            case 'maintenance': return 'destructive';
            default: return 'outline';
        }
    };

    const handleLocationChange = (value: string) => {
        setSelectedLocation(value);
        const locationDetails = location.find(
            (loc) => loc.id.toString() === value,
        );
        setSelectedLocationDetails(locationDetails || null);
    };

    const handleLocationSelect = (location: { lat: number; lng: number }) => {
        setCoordinates({
            latitude: location.lat.toString(),
            longitude: location.lng.toString(),
        });
    };

    const getFilteredCameras = () => {
        if (useCustomLocation) return [];
        if (!selectedLocationDetails) return [];
        return (cctvDevices || []).filter(
            (camera) => camera.location?.id === selectedLocationDetails.id,
        );
    };

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setServerErrors({});
        const newErrors = { deviceName: !deviceName.trim(), location: !useCustomLocation && !selectedLocation };
        if (useCustomLocation && (!customAddress.trim() || !coordinates.latitude || !coordinates.longitude)) {
            newErrors.location = true;
        }
        setErrors(newErrors);

        if (newErrors.deviceName || newErrors.location) {
            toast({ title: 'Validation Error', description: 'Please fix the errors in the form.', variant: 'destructive' });
            return;
        }

        setIsSubmitting(true);
        const formData = {
            device_name: deviceName,
            location_id: useCustomLocation ? null : parseInt(selectedLocation),
            status: status,
            custom_address: useCustomLocation ? customAddress : null,
            custom_latitude: useCustomLocation ? parseFloat(coordinates.latitude) : null,
            custom_longitude: useCustomLocation ? parseFloat(coordinates.longitude) : null,
        };

        router.put(`/devices/uwdevice/${device.id}`, formData, {
            onSuccess: () => {
                router.flushAll(); // Clear prefetch cache to prevent stale data
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
                            <DialogDescription>Update the IoT sensor configuration and linked cameras</DialogDescription>
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
                                    <div className="flex items-center justify-between">
                                        <Label>Location Assignment</Label>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            type="button"
                                            className="h-7 text-xs"
                                            onClick={() => {
                                                setUseCustomLocation(!useCustomLocation);
                                                setSelectedLocation('');
                                                setSelectedLocationDetails(null);
                                            }}
                                        >
                                            {useCustomLocation ? 'Use Predefined Location' : 'Use Custom Location'}
                                        </Button>
                                    </div>

                                    {!useCustomLocation ? (
                                        <Select value={selectedLocation} onValueChange={handleLocationChange}>
                                            <SelectTrigger className={errors.location ? 'border-red-500' : ''}>
                                                <SelectValue placeholder="Select Location" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup>
                                                    {location.map((loc) => (
                                                        <SelectItem key={loc.id} value={loc.id.toString()}>
                                                            {loc.location_name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="edit-custom-address">Address</Label>
                                                <Input
                                                    id="edit-custom-address"
                                                    value={customAddress}
                                                    onChange={(e) => setCustomAddress(e.target.value)}
                                                    placeholder="Enter full address"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Latitude</Label>
                                                    <Input value={coordinates.latitude} disabled placeholder="Select on map" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Longitude</Label>
                                                    <Input value={coordinates.longitude} disabled placeholder="Select on map" />
                                                </div>
                                            </div>
                                            <MapModal onLocationSelect={handleLocationSelect} coordinates={coordinates} />
                                        </div>
                                    )}
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

                                {!useCustomLocation && (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Label>Linked CCTV Cameras</Label>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                                                </TooltipTrigger>
                                                <TooltipContent side="right" className="max-w-[300px]">
                                                    <p className="text-xs">
                                                        These cameras are situated at the same location as the IoT sensor.
                                                        Linking them allows for cross-referencing anomaly data with visual confirmation.
                                                    </p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </div>
                                        <div className="space-y-3">
                                            {getFilteredCameras().length > 0 ? (
                                                getFilteredCameras().map((camera) => (
                                                    <div key={camera.id} className="flex items-center justify-between rounded-lg border bg-muted/20 p-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-5 w-5 items-center justify-center rounded bg-primary/10">
                                                                <Check className="h-3 w-3 text-primary" />
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-medium">{camera.device_name}</div>
                                                                <div className="text-xs text-muted-foreground">{camera.location?.location_name || 'No location'} • {camera.id}</div>
                                                            </div>
                                                        </div>
                                                        <Badge variant={getStatusVariant(camera.status)} className="capitalize">{camera.status}</Badge>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="rounded-lg border-2 border-dashed p-6 text-center text-muted-foreground">
                                                    <Camera className="mx-auto h-8 w-8 mb-2 opacity-50" />
                                                    <p className="text-sm">
                                                        {selectedLocationDetails
                                                            ? `No cameras found at ${selectedLocationDetails.location_name}`
                                                            : 'Select a location to see linked cameras'}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
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
