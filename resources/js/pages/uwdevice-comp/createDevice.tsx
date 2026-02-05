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
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from '@/components/use-toast';
import { router } from '@inertiajs/react';
import { Select } from '@radix-ui/react-select';
import { Camera, Check, CircuitBoard, Copy, HelpCircle, MoveLeft, Plus, RefreshCcw } from 'lucide-react';
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
    const [status, setStatus] = useState('active');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({
        deviceName: false,
        location: false,
    });
    const [generatedToken, setGeneratedToken] = useState<string | null>(null);
    const [generatedDeviceId, setGeneratedDeviceId] = useState<string | null>(null);
    const [isCopied, setIsCopied] = useState(false);
    // Custom location state
    const [useCustomLocation, setUseCustomLocation] = useState(false);
    const [customAddress, setCustomAddress] = useState('');
    const [coordinates, setCoordinates] = useState({
        latitude: '',
        longitude: '',
    });
    const [serverErrors, setServerErrors] = useState<{ [key: string]: string }>({});

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

    const handleLocationChange = (value: string) => {
        setSelectedLocation(value);
        const locationDetails = location.find(
            (loc) => loc.id.toString() === value,
        );
        setSelectedLocationDetails(locationDetails || null);

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
            return []; // No implicit linking for custom locations
        }
        if (!selectedLocationDetails) {
            return [];
        }
        return (cctvDevices || []).filter(
            (camera) => camera.location?.id === selectedLocationDetails.id,
        );
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
        toast({
            title: 'Copied!',
            description: 'API Token copied to clipboard.',
        });
    };

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Reset previous errors
        setErrors({ deviceName: false, location: false });
        setServerErrors({});

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
            status: status,
            custom_address: useCustomLocation ? customAddress : null,
            custom_latitude: useCustomLocation
                ? parseFloat(coordinates.latitude)
                : null,
            custom_longitude: useCustomLocation
                ? parseFloat(coordinates.longitude)
                : null,
        };

        // Submit to backend using Inertia
        router.post('/devices/uwdevice', formData, {
            onSuccess: (page) => {
                router.flushAll(); // Clear prefetch cache to prevent stale data
                const flash = page.props.flash as any;
                if (flash?.api_token) {
                    setGeneratedToken(flash.api_token);
                }
                if (flash?.device_id) {
                    setGeneratedDeviceId(flash.device_id.toString());
                }

                toast({
                    title: 'Success!',
                    description: 'UW Device created successfully.',
                    variant: 'default',
                });

                // Reset form fields
                setDeviceName('');
                setSelectedLocation('');
                setSelectedLocationDetails(null);
                setStatus('active');
                setErrors({ deviceName: false, location: false });
                setUseCustomLocation(false);
                setCustomAddress('');
                setCoordinates({ latitude: '', longitude: '' });

                if (!flash?.api_token) {
                    setDialogOpen(false);
                }
            },
            onError: (errors) => {
                setServerErrors(errors);
                toast({
                    title: 'Error',
                    description: errors.device_name || 'Failed to create UW Device. Please try again.',
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
                    <Plus className="h-4 w-4" /> Add IoT Box
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
                    <TooltipProvider>
                        <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4">
                            <DialogTitle>
                                {generatedToken ? 'Device Registered!' : 'Add New IoT Sensor'}
                            </DialogTitle>
                            <DialogDescription>
                                {generatedToken
                                    ? 'Copy this token to your device configuration. You won\'t be able to see it again!'
                                    : 'Configure a new IoT sensor and link it to CCTV cameras'}
                            </DialogDescription>
                        </DialogHeader>

                        {generatedToken ? (
                            <div className="flex-1 flex flex-col items-center justify-center px-8 py-12 space-y-6">
                                <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                    <Check className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                                </div>

                                <div className="flex flex-col gap-5 w-full max-w-md mx-auto">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                                            Device ID
                                        </Label>
                                        <div className="relative group overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-950 shadow-inner">
                                            <div className="w-full text-zinc-100 font-mono text-sm px-4 py-3.5 break-all pr-12">
                                                {generatedDeviceId || 'Generating...'}
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
                                                onClick={() => copyToClipboard(generatedDeviceId || '')}
                                            >
                                                {isCopied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                                            API Token
                                        </Label>
                                        <div className="relative group overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-950 shadow-inner">
                                            <div className="w-full text-zinc-100 font-mono text-sm px-4 py-3.5 break-all pr-12">
                                                {generatedToken || 'Generating...'}
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
                                                onClick={() => copyToClipboard(generatedToken || '')}
                                            >
                                                {isCopied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    type="button"
                                    className="w-full"
                                    onClick={() => {
                                        setGeneratedToken(null);
                                        setGeneratedDeviceId(null);
                                        setDialogOpen(false);
                                    }}
                                >
                                    I have saved the credentials
                                </Button>
                            </div>
                        ) : (
                            <>
                                <div className="flex-1 space-y-6 overflow-y-auto px-6 py-4">
                                    <div className="space-y-6">
                                        {/* Device Name */}
                                        <div className="flex flex-col gap-2">
                                            <Label htmlFor="device-name">IoT Device Name</Label>
                                            <Input
                                                id="device-name"
                                                value={deviceName}
                                                onChange={(e) => {
                                                    setDeviceName(e.target.value);
                                                    if (errors.deviceName) {
                                                        setErrors((prev) => ({ ...prev, deviceName: false }));
                                                    }
                                                }}
                                                placeholder="Enter device name (e.g. South Entrance Sensor)"
                                                className={errors.deviceName || serverErrors.device_name ? 'border-red-500' : ''}
                                            />
                                            {errors.deviceName && (
                                                <span className="text-sm text-red-500">Device name is required</span>
                                            )}
                                            {serverErrors.device_name && (
                                                <span className="text-sm text-red-500">{serverErrors.device_name}</span>
                                            )}
                                        </div>

                                        {/* Location Assignment */}
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
                                                <div className="space-y-2">
                                                    <Select onValueChange={handleLocationChange}>
                                                        <SelectTrigger className={`w-full ${errors.location ? 'border-red-500' : ''}`}>
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
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="custom-address">Address</Label>
                                                        <Input
                                                            id="custom-address"
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

                                        {/* Status */}
                                        <div className="flex flex-col gap-2">
                                            <Label htmlFor="status">Status</Label>
                                            <Select value={status} onValueChange={setStatus}>
                                                <SelectTrigger className="w-full">
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

                                        {/* Linked CCTV - Help icon and hiding for custom */}
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
                                            {isSubmitting ? <Spinner className="mr-2 h-4 w-4" /> : <CircuitBoard className="mr-2 h-4 w-4" />}
                                            {isSubmitting ? 'Creating...' : 'Add Device'}
                                        </Button>
                                    </div>
                                </DialogFooter>
                            </>
                        )}
                    </TooltipProvider>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default AddUWDevice;
