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
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { toast } from '@/components/use-toast';
import { router } from '@inertiajs/react';
import { Select } from '@radix-ui/react-select';
import { Camera, CircuitBoard, MoveLeft, Plus } from 'lucide-react';
import React, { useState } from 'react';
import { cctv_T, location_T } from '../../types/cctv-location-types';

function AddUWDevice({
    location,
    cctvDevices,
}: {
    location: location_T[];
    cctvDevices?: cctv_T[];
}): React.JSX.Element {
    // Dialog control state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deviceName, setDeviceName] = useState('');
    const [selectedLocation, setSelectedLocation] = useState('');
    const [selectedLocationDetails, setSelectedLocationDetails] =
        useState<location_T | null>(null);
    const [selectedCamera, setSelectedCamera] = useState<string>('');
    const [status, setStatus] = useState('active');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({
        deviceName: false,
        location: false,
    });
    // Custom location state
    const [useCustomLocation, setUseCustomLocation] = useState(false);

    // Get status badge variant - matching CCTV pattern
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
    const [customAddress, setCustomAddress] = useState('');
    const [coordinates, setCoordinates] = useState({
        latitude: '',
        longitude: '',
    });

    const handleLocationChange = (value: string) => {
        setSelectedLocation(value);
        const locationDetails = location.find(
            (loc) => loc.id.toString() === value,
        );
        setSelectedLocationDetails(locationDetails || null);

        // Clear selected camera when location changes
        setSelectedCamera('');

        // Clear location error when user selects a location
        if (errors.location) {
            setErrors((prev) => ({ ...prev, location: false }));
        }
    };

    const handleLocationSelect = (location: { lat: number; lng: number }) => {
        const coords = {
            latitude: location.lat.toString(),
            longitude: location.lng.toString(),
        };
        setCoordinates(coords);
        if (errors.location) {
            setErrors((prev) => ({ ...prev, location: false }));
        }
    };

    // Filter CCTV cameras based on selected location
    const getFilteredCameras = () => {
        if (useCustomLocation) {
            // For custom locations, show all cameras
            return cctvDevices || [];
        }
        if (!selectedLocationDetails) {
            // No location selected, show no cameras
            return [];
        }
        // Filter cameras by location_id
        return (cctvDevices || []).filter(
            (camera) => camera.location?.id === selectedLocationDetails.id,
        );
    };

    const handleCameraSelect = (cameraId: string) => {
        setSelectedCamera(selectedCamera === cameraId ? '' : cameraId);
    };

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Reset previous errors
        setErrors({ deviceName: false, location: false });

        // Validation
        const newErrors = { deviceName: false, location: false };

        if (!deviceName.trim()) {
            newErrors.deviceName = true;
            toast({
                title: 'Validation Error',
                description: 'Device name is required.',
                variant: 'destructive',
            });
        }

        if (!useCustomLocation && !selectedLocation) {
            newErrors.location = true;
            toast({
                title: 'Validation Error',
                description: 'Please select a location or use custom location.',
                variant: 'destructive',
            });
        }

        if (
            useCustomLocation &&
            (!customAddress.trim() ||
                !coordinates.latitude ||
                !coordinates.longitude)
        ) {
            newErrors.location = true;
            toast({
                title: 'Validation Error',
                description:
                    'Please fill in address and select location on map.',
                variant: 'destructive',
            });
        }

        // Set errors to show red borders
        setErrors(newErrors);

        // Stop if there are validation errors
        if (newErrors.deviceName || newErrors.location) {
            return;
        }

        setIsSubmitting(true);

        // Prepare form data
        const formData = {
            device_name: deviceName,
            location_id: useCustomLocation ? null : parseInt(selectedLocation),
            cctv_id: selectedCamera ? parseInt(selectedCamera) : null,
            status: status,
            // Custom location fields
            custom_address: useCustomLocation ? customAddress : null,
            custom_latitude: useCustomLocation
                ? parseFloat(coordinates.latitude)
                : null,
            custom_longitude: useCustomLocation
                ? parseFloat(coordinates.longitude)
                : null,
        };

        console.log('Submitting form data:', formData);

        // Submit to backend using Inertia
        router.post('/devices/uwdevice', formData, {
            onSuccess: () => {
                toast({
                    title: 'Success!',
                    description: 'UW Device created successfully.',
                    variant: 'default',
                });

                // Reset form
                setDeviceName('');
                setSelectedLocation('');
                setSelectedLocationDetails(null);
                setSelectedCamera('');
                setStatus('active');
                setErrors({ deviceName: false, location: false });
                setUseCustomLocation(false);
                setCustomAddress('');
                setCoordinates({ latitude: '', longitude: '' });
                setDialogOpen(false);
            },
            onError: (errors) => {
                console.error('Submission errors:', errors);
                console.log('Form data sent:', formData);

                // Show more specific error message
                const errorMessage =
                    errors.message ||
                    (typeof errors === 'object'
                        ? JSON.stringify(errors)
                        : 'Failed to create UW Device. Please try again.');

                toast({
                    title: 'Error',
                    description: errorMessage,
                    variant: 'destructive',
                });
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    return (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
                <Button className="cursor-pointer px-4 py-2">
                    <Plus /> Add Device
                </Button>
            </DialogTrigger>
            <DialogContent
                className="flex max-h-[90vh] max-w-none flex-col overflow-hidden p-0 sm:max-w-2xl"
                showCloseButton={false}
            >
                <form
                    onSubmit={onSubmit}
                    className="flex h-full flex-col overflow-hidden"
                >
                    <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4">
                        <DialogTitle>Add New IoT Sensor</DialogTitle>
                        <DialogDescription>
                            Configure a new IoT sensor and link it to CCTV
                            cameras
                        </DialogDescription>
                    </DialogHeader>

                    {/* Scrollable Content */}
                    <div className="flex-1 space-y-6 overflow-y-auto px-6 py-4">
                        <div className="space-y-6">
                            {/* IoT Device Name */}
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="device-name">
                                    IoT Device Name
                                </Label>
                                <Input
                                    id="device-name"
                                    value={deviceName}
                                    onChange={(e) => {
                                        setDeviceName(e.target.value);
                                        // Clear error when user starts typing
                                        if (errors.deviceName) {
                                            setErrors((prev) => ({
                                                ...prev,
                                                deviceName: false,
                                            }));
                                        }
                                    }}
                                    placeholder="Enter device name"
                                    className={
                                        errors.deviceName
                                            ? 'border-red-500 focus-visible:ring-red-500'
                                            : ''
                                    }
                                />
                                {errors.deviceName && (
                                    <span className="text-sm text-red-500">
                                        Device name is required
                                    </span>
                                )}
                            </div>

                            {/* Location Assignment */}
                            <div className="flex flex-col gap-4">
                                <Label>Location Assignment</Label>

                                {/* Location Type Toggle */}
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            id="predefined-location"
                                            name="location-type"
                                            checked={!useCustomLocation}
                                            onChange={() => {
                                                setUseCustomLocation(false);
                                                setCustomAddress('');
                                                setCoordinates({
                                                    latitude: '',
                                                    longitude: '',
                                                });
                                                if (errors.location) {
                                                    setErrors((prev) => ({
                                                        ...prev,
                                                        location: false,
                                                    }));
                                                }
                                            }}
                                            className="h-4 w-4"
                                        />
                                        <Label
                                            htmlFor="predefined-location"
                                            className="text-sm"
                                        >
                                            Select from locations
                                        </Label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            id="custom-location"
                                            name="location-type"
                                            checked={useCustomLocation}
                                            onChange={() => {
                                                setUseCustomLocation(true);
                                                setSelectedLocation('');
                                                setSelectedLocationDetails(
                                                    null,
                                                );
                                                if (errors.location) {
                                                    setErrors((prev) => ({
                                                        ...prev,
                                                        location: false,
                                                    }));
                                                }
                                            }}
                                            className="h-4 w-4"
                                        />
                                        <Label
                                            htmlFor="custom-location"
                                            className="text-sm"
                                        >
                                            Custom location
                                        </Label>
                                    </div>
                                </div>

                                {/* Predefined Location Selection */}
                                {!useCustomLocation && (
                                    <div className="space-y-2">
                                        <Select
                                            onValueChange={handleLocationChange}
                                            disabled={useCustomLocation}
                                        >
                                            <SelectTrigger
                                                className={`w-full ${errors.location ? 'border-red-500 focus:ring-red-500' : ''}`}
                                            >
                                                <SelectValue placeholder="Select Location" />
                                            </SelectTrigger>
                                            <SelectContent id="location-assignment">
                                                <SelectGroup>
                                                    {location.map((loc) => (
                                                        <SelectItem
                                                            key={loc.id}
                                                            value={loc.id.toString()}
                                                        >
                                                            <div>
                                                                <div className="font-medium">
                                                                    {
                                                                        loc.location_name
                                                                    }
                                                                </div>
                                                                <div className="text-xs text-muted-foreground">
                                                                    {
                                                                        loc.landmark
                                                                    }
                                                                    ,{' '}
                                                                    {
                                                                        loc.barangay
                                                                    }
                                                                </div>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                {/* Custom Location Fields */}
                                {useCustomLocation && (
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="custom-address">
                                                Address
                                            </Label>
                                            <Input
                                                id="custom-address"
                                                value={customAddress}
                                                onChange={(e) => {
                                                    setCustomAddress(
                                                        e.target.value,
                                                    );
                                                    if (errors.location) {
                                                        setErrors((prev) => ({
                                                            ...prev,
                                                            location: false,
                                                        }));
                                                    }
                                                }}
                                                placeholder="Enter full address"
                                                className={
                                                    errors.location
                                                        ? 'border-red-500 focus-visible:ring-red-500'
                                                        : ''
                                                }
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="custom-latitude">
                                                    Latitude
                                                </Label>
                                                <Input
                                                    id="custom-latitude"
                                                    value={
                                                        coordinates.latitude
                                                            ? coordinates.latitude.slice(
                                                                  0,
                                                                  8,
                                                              ) + '...'
                                                            : ''
                                                    }
                                                    disabled
                                                    placeholder="Select on map"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="custom-longitude">
                                                    Longitude
                                                </Label>
                                                <Input
                                                    id="custom-longitude"
                                                    value={
                                                        coordinates.longitude
                                                            ? coordinates.longitude.slice(
                                                                  0,
                                                                  8,
                                                              ) + '...'
                                                            : ''
                                                    }
                                                    disabled
                                                    placeholder="Select on map"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>
                                                Select Location on Map
                                            </Label>
                                            <MapModal
                                                onLocationSelect={
                                                    handleLocationSelect
                                                }
                                                coordinates={coordinates}
                                            />
                                        </div>
                                    </div>
                                )}

                                {errors.location && (
                                    <span className="text-sm text-red-500">
                                        {useCustomLocation
                                            ? 'Please fill in address and select location on map'
                                            : 'Please select a location or use custom location'}
                                    </span>
                                )}
                            </div>

                            {/* Selected Location Details */}
                            {!useCustomLocation && selectedLocationDetails && (
                                <div className="rounded-lg bg-muted p-3">
                                    <div className="flex items-center gap-2 text-sm">
                                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                        <span className="font-medium">
                                            Selected Location
                                        </span>
                                    </div>
                                    <div className="mt-1 text-sm text-muted-foreground">
                                        {selectedLocationDetails.location_name},{' '}
                                        {selectedLocationDetails.landmark}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {selectedLocationDetails.barangay}
                                    </div>
                                </div>
                            )}

                            {/* Custom Location Preview */}
                            {useCustomLocation &&
                                customAddress &&
                                coordinates.latitude &&
                                coordinates.longitude && (
                                    <div className="rounded-lg bg-muted p-3">
                                        <div className="flex items-center gap-2 text-sm">
                                            <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                                            <span className="font-medium">
                                                Custom Location
                                            </span>
                                        </div>
                                        <div className="mt-1 text-sm text-muted-foreground">
                                            {customAddress}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            Coordinates:{' '}
                                            {coordinates.latitude.slice(0, 8)}
                                            ...,{' '}
                                            {coordinates.longitude.slice(0, 8)}
                                            ...
                                        </div>
                                    </div>
                                )}

                            {/* Status Selection */}
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    value={status}
                                    onValueChange={setStatus}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select Status" />
                                    </SelectTrigger>
                                    <SelectContent id="status">
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
                            </div>

                            {/* Link to CCTV Camera */}
                            <div className="space-y-3">
                                <Label>Link to CCTV Camera</Label>
                                <p className="text-xs text-muted-foreground">
                                    {useCustomLocation
                                        ? 'Custom locations can link to any available camera'
                                        : selectedLocationDetails
                                          ? `Only cameras at ${selectedLocationDetails.location_name} are available`
                                          : 'Select a location first to see available cameras'}
                                </p>

                                <div className="space-y-3">
                                    {getFilteredCameras().length > 0 ? (
                                        <>
                                            {/* Option for no camera */}
                                            <div className="flex items-center justify-between rounded-lg border p-3">
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="radio"
                                                        id="no-camera"
                                                        name="camera-selection"
                                                        checked={
                                                            selectedCamera ===
                                                            ''
                                                        }
                                                        onChange={() =>
                                                            setSelectedCamera(
                                                                '',
                                                            )
                                                        }
                                                        className="h-4 w-4"
                                                    />
                                                    <div className="flex items-center gap-2">
                                                        <Camera className="h-4 w-4 text-muted-foreground" />
                                                        <div>
                                                            <div className="text-sm font-medium">
                                                                No Camera
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                Device will
                                                                operate
                                                                independently
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Available cameras */}
                                            {getFilteredCameras().map(
                                                (camera) => (
                                                    <div
                                                        key={camera.id}
                                                        className="flex items-center justify-between rounded-lg border p-3"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <input
                                                                type="radio"
                                                                id={camera.id.toString()}
                                                                name="camera-selection"
                                                                checked={
                                                                    selectedCamera ===
                                                                    camera.id.toString()
                                                                }
                                                                onChange={() =>
                                                                    setSelectedCamera(
                                                                        camera.id.toString(),
                                                                    )
                                                                }
                                                                className="h-4 w-4"
                                                            />
                                                            <div className="flex items-center gap-2">
                                                                <Camera className="h-4 w-4" />
                                                                <div>
                                                                    <div className="text-sm font-medium">
                                                                        {
                                                                            camera.device_name
                                                                        }
                                                                    </div>
                                                                    <div className="text-xs text-muted-foreground">
                                                                        {
                                                                            camera
                                                                                .location
                                                                                ?.location_name
                                                                        }{' '}
                                                                        •{' '}
                                                                        {
                                                                            camera.device_name
                                                                        }
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <Badge
                                                            variant={getStatusVariant(
                                                                camera.status,
                                                            )}
                                                            className="capitalize"
                                                        >
                                                            {camera.status}
                                                        </Badge>
                                                    </div>
                                                ),
                                            )}
                                        </>
                                    ) : (
                                        <div className="py-4 text-center text-muted-foreground">
                                            {useCustomLocation
                                                ? 'No CCTV cameras available'
                                                : selectedLocationDetails
                                                  ? `No cameras found at ${selectedLocationDetails.location_name}`
                                                  : 'Select a location to see available cameras'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

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
                                className="flex-2"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <Spinner className="inline h-4 w-4" />
                                ) : (
                                    <CircuitBoard className="inline h-4 w-4" />
                                )}
                                {isSubmitting ? 'Creating...' : 'Add Device'}
                            </Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default AddUWDevice;
