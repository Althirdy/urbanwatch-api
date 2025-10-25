import React, { useState } from 'react'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { ExternalLink, MapPin, Cpu, Camera, Activity, Zap } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { uwDevice_T } from '../type'

interface ViewUWDeviceProps {
    device: uwDevice_T
}

function ViewUWDevice({ device }: ViewUWDeviceProps): React.JSX.Element {
    const [sheetOpen, setSheetOpen] = useState(false)

    // Get status badge variant - matching CCTV pattern
    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'active': return 'default'
            case 'inactive': return 'secondary'
            case 'maintenance': return 'destructive'
            default: return 'outline'
        }
    }

    // Get status icon - matching CCTV pattern
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'active': return <Activity className="h-3 w-3" />
            case 'inactive': return <Activity className="h-3 w-3 opacity-50" />
            case 'maintenance': return <Zap className="h-3 w-3" />
            default: return <Activity className="h-3 w-3 opacity-50" />
        }
    }

    return (
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
                <div className='p-2 rounded-full hover:bg-secondary/20 cursor-pointer'>
                    <ExternalLink size={20} />
                </div>
            </SheetTrigger>
            <SheetContent className="flex flex-col h-full">
                {/* Fixed Header */}
                <SheetHeader className="flex-shrink-0 px-6 py-6 border-b">
                    <SheetTitle className="flex items-center gap-2">
                        <Cpu className="h-5 w-5 text-green-600" />
                        Device Details
                    </SheetTitle>
                    <SheetDescription>
                        View details and configuration of {device.device_name}
                    </SheetDescription>
                </SheetHeader>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    <div className="space-y-6">
                        {/* Device Name Section */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-muted-foreground">Device Name</Label>
                            <div className="p-3 bg-muted/50 rounded-lg">
                                <p className="font-medium">{device.device_name}</p>
                            </div>
                        </div>

                        {/* Status Section */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                            <div className="flex items-center gap-2">
                                <Badge
                                    variant={getStatusVariant(device.status)}
                                    className="gap-1 capitalize"
                                >
                                    {getStatusIcon(device.status)}
                                    {device.status}
                                </Badge>
                            </div>
                        </div>

                        {/* Location Assignment Section */}
                        <div className="space-y-3">
                            <Label className="text-sm font-medium text-muted-foreground">Location Assignment</Label>
                            
                            {/* Predefined Location */}
                            {device.location && !device.custom_address && (
                                <div className="p-4 bg-muted/50 rounded-lg">
                                    <div className="flex items-start gap-3">
                                        <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium">{device.location.location_name}</p>
                                                <Badge variant="outline" className="text-xs">Predefined</Badge>
                                            </div>
                                            {device.location?.category_name && (
                                                <Badge variant="outline" className="text-xs">
                                                    {device.location.category_name}
                                                </Badge>
                                            )}
                                            <p className="text-sm text-muted-foreground">
                                                {device.location?.landmark}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {device.location?.barangay}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Custom Location */}
                            {device.custom_address && (
                                <div className="p-4 bg-muted/50 rounded-lg">
                                    <div className="flex items-start gap-3">
                                        <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium">Custom Location</p>
                                                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">Custom</Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {device.custom_address}
                                            </p>
                                            <div className="grid grid-cols-2 gap-4 mt-2">
                                                <div>
                                                    <p className="text-xs font-medium text-muted-foreground">Latitude</p>
                                                    <p className="text-xs">{device.custom_latitude}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-medium text-muted-foreground">Longitude</p>
                                                    <p className="text-xs">{device.custom_longitude}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* No Location */}
                            {!device.location && !device.custom_address && (
                                <div className="p-4 border-2 border-dashed border-muted rounded-lg text-center">
                                    <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                    <p className="text-sm text-muted-foreground">No location assigned</p>
                                </div>
                            )}
                        </div>

                        {/* Linked CCTV Cameras Section */}
                        <div className="space-y-3">
                            <Label className="text-sm font-medium text-muted-foreground">Linked CCTV Cameras</Label>
                            {device.cctv_cameras && device.cctv_cameras.length > 0 ? (
                                <div className="space-y-3">
                                    {device.cctv_cameras.map((camera, index) => (
                                        <div key={index} className="p-3 border rounded-lg bg-muted/20">
                                            <div className="flex items-center gap-3">
                                                <Camera className="h-4 w-4 text-blue-500" />
                                                <div className="flex-1">
                                                    <div className="font-medium text-sm">
                                                        {camera.device_name || `Camera ${index + 1}`}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {camera.location?.location_name || device.location?.location_name}
                                                    </div>
                                                </div>
                                                <Badge 
                                                    variant={getStatusVariant(camera.status)}
                                                    className="capitalize"
                                                >
                                                    {camera.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-4 border-2 border-dashed border-muted rounded-lg text-center">
                                    <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                    <p className="text-sm text-muted-foreground">No cameras linked</p>
                                    <p className="text-xs text-muted-foreground">This device operates independently</p>
                                </div>
                            )}
                        </div>

                        {/* Device Information Summary */}
                        <div className="space-y-3">
                            <Label className="text-sm font-medium text-muted-foreground">Device Summary</Label>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-muted/50 rounded-lg">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Zap className="h-3 w-3 text-green-500" />
                                        <span className="text-xs font-medium">Status</span>
                                    </div>
                                    <p className="text-sm font-medium capitalize">
                                        {device.status}
                                    </p>
                                </div>
                                <div className="p-3 bg-muted/50 rounded-lg">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Camera className="h-3 w-3 text-blue-500" />
                                        <span className="text-xs font-medium">Cameras</span>
                                    </div>
                                    <p className="text-sm font-medium">
                                        {device.cctv_cameras?.length || 0} linked
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}

export default ViewUWDevice