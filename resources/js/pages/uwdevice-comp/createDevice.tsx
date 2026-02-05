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
import { getPackageDropdownOptions, getPackageLocation } from '@/lib/geojson-packages';
import { router } from '@inertiajs/react';
import { Select } from '@radix-ui/react-select';
import { Check, CircuitBoard, Copy, MoveLeft, Plus } from 'lucide-react';
import React, { useState } from 'react';

function AddUWDevice(): React.JSX.Element {
    // Dialog control state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deviceName, setDeviceName] = useState('');
    const [selectedLocation, setSelectedLocation] = useState('');
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
    const [customAddress, setCustomAddress] = useState('');
    const [coordinates, setCoordinates] = useState({
        latitude: '',
        longitude: '',
    });
    const [serverErrors, setServerErrors] = useState<{ [key: string]: string }>({});

    const packageOptions = getPackageDropdownOptions();

    const handleLocationChange = (packageName: string) => {
        setSelectedLocation(packageName);
        setCustomAddress(packageName);

        // Get the GeoJSON centroid for the selected package
        const packageLocation = getPackageLocation(packageName);
        if (packageLocation) {
            setCoordinates({
                latitude: packageLocation.centroid.latitude.toString(),
                longitude: packageLocation.centroid.longitude.toString(),
            });
        }

        // Clear location error when user selects a location
        if (errors.location) {
            setErrors((prev) => ({ ...prev, location: false }));
        }
    };

    // Called when auto-detected from map click - only updates package/address, keeps clicked coordinates
    const handlePackageSelectFromMap = (packageName: string) => {
        setSelectedLocation(packageName);
        setCustomAddress(packageName);

        // Clear location error when a package is auto-detected
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

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
        toast({
            title: 'Copied!',
            description: 'Copied to clipboard.',
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

        if (!customAddress.trim() || !coordinates.latitude || !coordinates.longitude) {
            newErrors.location = true;
            toast({
                title: 'Validation Error',
                description: 'Please select a location and coordinates on the map.',
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
            status: status,
            custom_address: customAddress,
            custom_latitude: parseFloat(coordinates.latitude),
            custom_longitude: parseFloat(coordinates.longitude),
        };

        // Submit to backend using Inertia
        router.post('/devices/uwdevice', formData, {
            onSuccess: (page) => {
                router.flushAll();
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
                setStatus('active');
                setErrors({ deviceName: false, location: false });
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
                                {generatedToken ? 'Device Registered!' : 'Add New IoT Box'}
                            </DialogTitle>
                            <DialogDescription>
                                {generatedToken
                                    ? 'Copy this token to your device configuration. You won\'t be able to see it again!'
                                    : 'Configure a new IoT sensor with location details'}
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
                                            <Label>Location Assignment</Label>

                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="location-select">Package/Area</Label>
                                                    <Select value={selectedLocation} onValueChange={handleLocationChange}>
                                                        <SelectTrigger className={`w-full ${errors.location ? 'border-red-500' : ''}`}>
                                                            <SelectValue placeholder="Select Package/Area" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectGroup>
                                                                {packageOptions.map((pkg) => (
                                                                    <SelectItem key={pkg.id} value={pkg.id}>
                                                                        {pkg.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectGroup>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="custom-address">Full Address</Label>
                                                    <Input
                                                        id="custom-address"
                                                        value={customAddress}
                                                        onChange={(e) => setCustomAddress(e.target.value)}
                                                        placeholder=""
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
                                                <MapModal
                                                    onLocationSelect={handleLocationSelect}
                                                    onPackageSelect={handlePackageSelectFromMap}
                                                    selectedPackage={selectedLocation}
                                                    coordinates={coordinates}
                                                />
                                                {errors.location && (
                                                    <span className="text-sm text-red-500">Please fill in address and select location on map</span>
                                                )}
                                            </div>
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
                                    </div>
                                </div>

                                <DialogFooter className="flex-shrink-0 bg-background px-6 py-4">
                                    <div className="flex w-full gap-2">
                                        <DialogClose asChild>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                data-dialog-close
                                                className="flex-1"
                                            >
                                                <MoveLeft className="inline h-4 w-4" />
                                                Close
                                            </Button>
                                        </DialogClose>
                                        <Button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="flex-2"
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
                            </>
                        )}
                    </TooltipProvider>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default AddUWDevice;
