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
import { ChevronDownIcon, SquarePen, Camera } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from "@/components/use-toast"
import { location_T, uwDevice_T, cctv_T } from '../type'
import { MapModal } from "@/components/map-modal"
import { router } from '@inertiajs/react'

interface EditUWDeviceProps {
    location: location_T[]
    device: uwDevice_T
    cctvDevices?: cctv_T[] // Add cctvDevices prop
}

function EditUWDevice({ location, device, cctvDevices }: EditUWDeviceProps): React.JSX.Element {
    // Sheet control state
    const [sheetOpen, setSheetOpen] = useState(false)
    const [deviceName, setDeviceName] = useState(device?.device_name || '')
    const [selectedLocation, setSelectedLocation] = useState(device?.location?.id?.toString() || '')
    const [selectedLocationDetails, setSelectedLocationDetails] = useState<location_T | null>(device?.location || null)
    const [selectedCamera, setSelectedCamera] = useState<string>(device?.cctv_id?.toString() || '')
    const [status, setStatus] = useState<string>(device?.status || 'active')
    const [isSubmitting, setIsSubmitting] = useState(false)
    // Custom location state
    const [useCustomLocation, setUseCustomLocation] = useState(!!device?.custom_address)
    const [customAddress, setCustomAddress] = useState(device?.custom_address || '')
    const [coordinates, setCoordinates] = useState({
        latitude: device?.custom_latitude?.toString() || '',
        longitude: device?.custom_longitude?.toString() || ''
    })

    // Get status badge variant - matching CCTV pattern
    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'active': return 'default'
            case 'inactive': return 'secondary'
            case 'maintenance': return 'destructive'
            default: return 'outline'
        }
    }

    // Mock CCTV cameras data - you can replace this with actual data
    const mockCCTVCameras = [
        { id: 'CAM-CAL-001', name: 'Monumento Circle Junction', status: 'active' },
        { id: 'CAM-CAL-002', name: 'Central Plaza Camera', status: 'active' },
        { id: 'CAM-CAL-003', name: 'Park Entrance', status: 'inactive' },
    ]

    const handleLocationChange = (value: string) => {
        setSelectedLocation(value)
        const locationDetails = location.find(loc => loc.id.toString() === value)
        setSelectedLocationDetails(locationDetails || null)
        // Clear selected camera when location changes
        setSelectedCamera('');
    }

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
        // Filter cameras by location_id - use real CCTV data
        return (cctvDevices || []).filter(camera => 
            camera.location?.id === selectedLocationDetails.id
        );
    };

    const handleLocationSelect = (location: { lat: number; lng: number }) => {
        const coords = {
            latitude: location.lat.toString(),
            longitude: location.lng.toString()
        };
        setCoordinates(coords);
    };


    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        
        setIsSubmitting(true)

        // Prepare form data
        const formData = {
            device_name: deviceName,
            location_id: useCustomLocation ? null : parseInt(selectedLocation),
            cctv_id: selectedCamera ? parseInt(selectedCamera) : null,
            status: status,
            // Custom location fields
            custom_address: useCustomLocation ? customAddress : null,
            custom_latitude: useCustomLocation ? parseFloat(coordinates.latitude) : null,
            custom_longitude: useCustomLocation ? parseFloat(coordinates.longitude) : null
        };

        console.log('Submitting edit form data:', formData);

        // Submit to backend using Inertia
        router.put(`/devices/uwdevice/${device.id}`, formData, {
            onSuccess: () => {
                toast({
                    title: "Success!",
                    description: "UW Device updated successfully.",
                    variant: "default",
                });
                setSheetOpen(false);
            },
            onError: (errors) => {
                console.error('Update errors:', errors);
                
                // Show more specific error message
                const errorMessage = errors.message || 
                    (typeof errors === 'object' ? JSON.stringify(errors) : 'Failed to update UW Device. Please try again.');
                
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
    }

    return (
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
                <div className='p-2 rounded-full hover:bg-primary/20 cursor-pointer' >
                    <SquarePen size={20} />
                </div>
            </SheetTrigger>
            <SheetContent className="flex flex-col h-full">
                <form onSubmit={onSubmit} className="flex flex-col h-full">
                    {/* Fixed Header */}
                    <SheetHeader className="flex-shrink-0 px-6 py-6 border-b">
                        <SheetTitle>Edit IoT Sensor</SheetTitle>
                        <SheetDescription>
                            Update the IoT sensor configuration and linked cameras
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
                                    onChange={(e) => setDeviceName(e.target.value)}
                                    placeholder="Enter device name"
                                />
                            </div>

                            {/* Device Status - removed since we have Active toggle */}

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
                                                                    Monumento Circle • {camera.id}
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
                                {isSubmitting ? 'Updating...' : 'Update Device'}
                            </Button>
                        </div>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    )
}

export default EditUWDevice