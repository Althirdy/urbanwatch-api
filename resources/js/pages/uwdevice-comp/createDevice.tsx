import React, { useState } from 'react'
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { Plus, Camera } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select } from '@radix-ui/react-select'
import { SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { location_T, cctv_T } from '../type'
import { toast } from "@/components/use-toast"
import { router } from '@inertiajs/react'
import { MapModal } from "@/components/map-modal"

function AddUWDevice({ location, cctvDevices }: { location: location_T[], cctvDevices?: cctv_T[] }): React.JSX.Element {
    // Sheet control state
    const [sheetOpen, setSheetOpen] = useState(false);
    const [deviceName, setDeviceName] = useState('');
    const [selectedLocation, setSelectedLocation] = useState('');
    const [selectedLocationDetails, setSelectedLocationDetails] = useState<location_T | null>(null);
    const [selectedCamera, setSelectedCamera] = useState<string>('');
    const [status, setStatus] = useState('active');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({ deviceName: false, location: false });
    // Custom location state
    const [useCustomLocation, setUseCustomLocation] = useState(false);

    // Get status badge variant - matching CCTV pattern
    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'active': return 'default'
            case 'inactive': return 'secondary'
            case 'maintenance': return 'destructive'
            default: return 'outline'
        }
    }
    const [customAddress, setCustomAddress] = useState('');
    const [coordinates, setCoordinates] = useState({
        latitude: '',
        longitude: ''
    });

    const handleLocationChange = (value: string) => {
        setSelectedLocation(value);
        const locationDetails = location.find(loc => loc.id.toString() === value);
        setSelectedLocationDetails(locationDetails || null);
        
        // Clear selected camera when location changes
        setSelectedCamera('');
        
        // Clear location error when user selects a location
        if (errors.location) {
            setErrors(prev => ({ ...prev, location: false }));
        }
    };

    const handleLocationSelect = (location: { lat: number; lng: number }) => {
        const coords = {
            latitude: location.lat.toString(),
            longitude: location.lng.toString()
        };
        setCoordinates(coords);
        if (errors.location) {
            setErrors(prev => ({ ...prev, location: false }));
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
        return (cctvDevices || []).filter(camera => 
            camera.location?.id === selectedLocationDetails.id
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
                title: "Validation Error",
                description: "Device name is required.",
                variant: "destructive",
            });
        }

        if (!useCustomLocation && !selectedLocation) {
            newErrors.location = true;
            toast({
                title: "Validation Error", 
                description: "Please select a location or use custom location.",
                variant: "destructive",
            });
        }

        if (useCustomLocation && (!customAddress.trim() || !coordinates.latitude || !coordinates.longitude)) {
            newErrors.location = true;
            toast({
                title: "Validation Error", 
                description: "Please fill in address and select location on map.",
                variant: "destructive",
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
            latitude: useCustomLocation ? parseFloat(coordinates.latitude) : null,
            longitude: useCustomLocation ? parseFloat(coordinates.longitude) : null
        };

        console.log('Submitting form data:', formData);

        // Submit to backend using Inertia
        router.post('/devices/uw', formData, {
            onSuccess: () => {
                toast({
                    title: "Success!",
                    description: "UW Device created successfully.",
                    variant: "default",
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
                setSheetOpen(false);
            },
            onError: (errors) => {
                console.error('Submission errors:', errors);
                console.log('Form data sent:', formData);
                
                // Show more specific error message
                const errorMessage = errors.message || 
                    (typeof errors === 'object' ? JSON.stringify(errors) : 'Failed to create UW Device. Please try again.');
                
                toast({
                    title: "Error",
                    description: errorMessage,
                    variant: "destructive",
                });
            },
            onFinish: () => {
                setIsSubmitting(false);
            }
        });
    };

    return (
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add Device
                </Button>
            </SheetTrigger>
            <SheetContent className="flex flex-col h-full">
                <form onSubmit={onSubmit} className="flex flex-col h-full">
                    {/* Fixed Header */}
                    <SheetHeader className="flex-shrink-0 px-6 py-6 border-b">
                        <SheetTitle>Add New IoT Sensor</SheetTitle>
                        <SheetDescription>
                            Configure a new IoT sensor and link it to CCTV cameras
                        </SheetDescription>
                    </SheetHeader>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto px-6 py-4">
                        <div className="space-y-6">
                            {/* IoT Device Name */}
                            <div className='flex flex-col gap-2'>
                                <Label htmlFor="device-name">IoT Device Name</Label>
                                <Input
                                    id="device-name"
                                    value={deviceName}
                                    onChange={(e) => {
                                        setDeviceName(e.target.value);
                                        // Clear error when user starts typing
                                        if (errors.deviceName) {
                                            setErrors(prev => ({ ...prev, deviceName: false }));
                                        }
                                    }}
                                    placeholder="Enter device name"
                                    className={errors.deviceName ? 'border-red-500 focus-visible:ring-red-500' : ''}
                                />
                                {errors.deviceName && (
                                    <span className="text-red-500 text-sm">Device name is required</span>
                                )}
                            </div>

                            {/* Location Assignment */}
                            <div className='flex flex-col gap-4'>
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
                                                setCoordinates({ latitude: '', longitude: '' });
                                                if (errors.location) {
                                                    setErrors(prev => ({ ...prev, location: false }));
                                                }
                                            }}
                                            className="w-4 h-4"
                                        />
                                        <Label htmlFor="predefined-location" className="text-sm">Select from locations</Label>
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
                                                setSelectedLocationDetails(null);
                                                if (errors.location) {
                                                    setErrors(prev => ({ ...prev, location: false }));
                                                }
                                            }}
                                            className="w-4 h-4"
                                        />
                                        <Label htmlFor="custom-location" className="text-sm">Custom location</Label>
                                    </div>
                                </div>

                                {/* Predefined Location Selection */}
                                {!useCustomLocation && (
                                    <div className="space-y-2">
                                        <Select onValueChange={handleLocationChange} disabled={useCustomLocation}>
                                            <SelectTrigger className={`w-full ${errors.location ? 'border-red-500 focus:ring-red-500' : ''}`}>
                                                <SelectValue placeholder="Select Location" />
                                            </SelectTrigger>
                                            <SelectContent id='location-assignment'>
                                                <SelectGroup>
                                                    {location.map((loc) => (
                                                        <SelectItem key={loc.id} value={loc.id.toString()}>
                                                            <div>
                                                                {loc.location_name} - {loc.category_name}
                                                                <div className='text-xs text-muted-foreground'>{loc.landmark}, {loc.barangay}</div>
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
                                            <Label htmlFor="custom-address">Address</Label>
                                            <Input
                                                id="custom-address"
                                                value={customAddress}
                                                onChange={(e) => {
                                                    setCustomAddress(e.target.value);
                                                    if (errors.location) {
                                                        setErrors(prev => ({ ...prev, location: false }));
                                                    }
                                                }}
                                                placeholder="Enter full address"
                                                className={errors.location ? 'border-red-500 focus-visible:ring-red-500' : ''}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="custom-latitude">Latitude</Label>
                                                <Input
                                                    id="custom-latitude"
                                                    value={coordinates.latitude ? coordinates.latitude.slice(0, 8) + '...' : ''}
                                                    disabled
                                                    placeholder="Select on map"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="custom-longitude">Longitude</Label>
                                                <Input
                                                    id="custom-longitude"
                                                    value={coordinates.longitude ? coordinates.longitude.slice(0, 8) + '...' : ''}
                                                    disabled
                                                    placeholder="Select on map"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Select Location on Map</Label>
                                            <MapModal
                                                onLocationSelect={handleLocationSelect}
                                                coordinates={coordinates}
                                            />
                                        </div>
                                    </div>
                                )}

                                {errors.location && (
                                    <span className="text-red-500 text-sm">
                                        {useCustomLocation 
                                            ? "Please fill in address and select location on map" 
                                            : "Please select a location or use custom location"
                                        }
                                    </span>
                                )}
                            </div>

                            {/* Selected Location Details */}
                            {!useCustomLocation && selectedLocationDetails && (
                                <div className="p-3 bg-muted rounded-lg">
                                    <div className="flex items-center gap-2 text-sm">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <span className="font-medium">Selected Location</span>
                                    </div>
                                    <div className="mt-1 text-sm text-muted-foreground">
                                        {selectedLocationDetails.location_name}, {selectedLocationDetails.landmark}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {selectedLocationDetails.barangay}
                                    </div>
                                </div>
                            )}

                            {/* Custom Location Preview */}
                            {useCustomLocation && customAddress && coordinates.latitude && coordinates.longitude && (
                                <div className="p-3 bg-muted rounded-lg">
                                    <div className="flex items-center gap-2 text-sm">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                        <span className="font-medium">Custom Location</span>
                                    </div>
                                    <div className="mt-1 text-sm text-muted-foreground">
                                        {customAddress}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        Coordinates: {coordinates.latitude.slice(0, 8)}..., {coordinates.longitude.slice(0, 8)}...
                                    </div>
                                </div>
                            )}

                            {/* Status Selection */}
                            <div className='flex flex-col gap-2'>
                                <Label htmlFor="status">Status</Label>
                                <Select value={status} onValueChange={setStatus}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select Status" />
                                    </SelectTrigger>
                                    <SelectContent id='status'>
                                        <SelectGroup>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="inactive">Inactive</SelectItem>
                                            <SelectItem value="maintenance">Maintenance</SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Link to CCTV Camera */}
                            <div className="space-y-3">
                                <Label>Link to CCTV Camera</Label>
                                <p className="text-xs text-muted-foreground">
                                    {useCustomLocation 
                                        ? "Custom locations can link to any available camera"
                                        : selectedLocationDetails 
                                            ? `Only cameras at ${selectedLocationDetails.location_name} are available`
                                            : "Select a location first to see available cameras"
                                    }
                                </p>
                                
                                <div className="space-y-3">
                                    {getFilteredCameras().length > 0 ? (
                                        <>
                                            {/* Option for no camera */}
                                            <div className="flex items-center justify-between p-3 border rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="radio"
                                                        id="no-camera"
                                                        name="camera-selection"
                                                        checked={selectedCamera === ''}
                                                        onChange={() => setSelectedCamera('')}
                                                        className="w-4 h-4"
                                                    />
                                                    <div className="flex items-center gap-2">
                                                        <Camera className="h-4 w-4 text-muted-foreground" />
                                                        <div>
                                                            <div className="font-medium text-sm">No Camera</div>
                                                            <div className="text-xs text-muted-foreground">
                                                                Device will operate independently
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Available cameras */}
                                            {getFilteredCameras().map((camera) => (
                                                <div key={camera.id} className="flex items-center justify-between p-3 border rounded-lg">
                                                    <div className="flex items-center gap-3">
                                                        <input
                                                            type="radio"
                                                            id={camera.id.toString()}
                                                            name="camera-selection"
                                                            checked={selectedCamera === camera.id.toString()}
                                                            onChange={() => setSelectedCamera(camera.id.toString())}
                                                            className="w-4 h-4"
                                                        />
                                                        <div className="flex items-center gap-2">
                                                            <Camera className="h-4 w-4" />
                                                            <div>
                                                                <div className="font-medium text-sm">{camera.device_name}</div>
                                                                <div className="text-xs text-muted-foreground">
                                                                    {camera.location?.location_name} • {camera.device_name}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Badge 
                                                        variant={getStatusVariant(camera.status)}
                                                        className="capitalize"
                                                    >
                                                        {camera.status}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </>
                                    ) : (
                                        <div className="text-center text-muted-foreground py-4">
                                            {useCustomLocation 
                                                ? "No CCTV cameras available"
                                                : selectedLocationDetails 
                                                    ? `No cameras found at ${selectedLocationDetails.location_name}`
                                                    : "Select a location to see available cameras"
                                            }
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Fixed Footer */}
                    <SheetFooter className="flex-shrink-0 px-6 py-4 border-t bg-background">
                        <div className="flex gap-2 w-full">
                            <SheetClose asChild>
                                <Button variant='outline' type="button" className="flex-1">
                                    Cancel
                                </Button>
                            </SheetClose>
                            <Button
                                type="submit"
                                className="flex-1"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Creating...' : 'Add Device'}
                            </Button>
                        </div>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    )
}

export default AddUWDevice;
