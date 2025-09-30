import React, { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Camera,
    BarChart3,
    ExternalLink,
    Edit,
    Trash2,
    MapPin,
    Wifi,
    Activity,
    Monitor,
    Settings
} from 'lucide-react'

// Dummy data
const dummyCCTVDevices = [
    {
        id: 1,
        device_name: "Monumento Circle Junction",
        resolution: "2688x1520",
        fps: 25,
        status: "maintenance",
        location: {
            location_name: "Monumento Circle Junction",
            landmark: "Caloocan Avenue",
            barangay: "Main traffic circle, pedestrian areas",
            category_name: "Historic"
        },
        brand: "HIK VISION",
        model: "DS-2CD2T47G1-L",
        description: "Main traffic monitoring camera at historic monument area"
    },
    {
        id: 2,
        device_name: "Bagong Barrio Market",
        resolution: "1920x1080",
        fps: 30,
        status: "active",
        location: {
            location_name: "Bagong Barrio Public Market",
            landmark: "Market Entrance",
            barangay: "Bagong Barrio",
            category_name: "Commercial"
        },
        brand: "DAHUA",
        model: "IPC-HFW2431S-S-S2",
        description: "Security monitoring for public market entrance and vicinity"
    },
    {
        id: 3,
        device_name: "University of Caloocan Gate",
        resolution: "3840x2160",
        fps: 20,
        status: "active",
        location: {
            location_name: "University of Caloocan City",
            landmark: "Main Gate",
            barangay: "Biglang Awa",
            category_name: "Educational"
        },
        brand: "AXIS",
        model: "P3367-VE",
        description: "Educational institution main entrance security surveillance"
    },
    {
        id: 4,
        device_name: "Grace Park Elementary",
        resolution: "1920x1080",
        fps: 25,
        status: "inactive",
        location: {
            location_name: "Grace Park Elementary School",
            landmark: "School Playground",
            barangay: "Grace Park West",
            category_name: "Educational"
        },
        brand: "HIK VISION",
        model: "DS-2CD2143G0-I",
        description: "School playground and premises monitoring system"
    },
    {
        id: 5,
        device_name: "Caloocan City Hall",
        resolution: "2688x1520",
        fps: 30,
        status: "active",
        location: {
            location_name: "Caloocan City Hall",
            landmark: "Main Entrance",
            barangay: "Poblacion",
            category_name: "Government"
        },
        brand: "SAMSUNG",
        model: "SNO-6084R",
        description: "Government building main entrance and public area surveillance"
    },
    {
        id: 6,
        device_name: "Rizal Avenue Bridge",
        resolution: "1920x1080",
        fps: 25,
        status: "active",
        location: {
            location_name: "Rizal Avenue Bridge",
            landmark: "Bridge Overpass",
            barangay: "Maypajo",
            category_name: "Infrastructure"
        },
        brand: "HIK VISION",
        model: "DS-2CD2147G2-L",
        description: "Bridge traffic and pedestrian monitoring system"
    }
]

interface CCTVDisplayProps {
    onEdit?: (device: any) => void
    onDelete?: (device: any) => void
    onViewReports?: (device: any) => void
    onViewStream?: (device: any) => void
}

function CCTVDisplay({
    onEdit,
    onDelete,
    onViewReports,
    onViewStream
}: CCTVDisplayProps) {
    const [selectedDevices, setSelectedDevices] = useState<number[]>([])

    // Handle individual device selection
    const handleDeviceSelect = (deviceId: number, checked: boolean) => {
        if (checked) {
            setSelectedDevices(prev => [...prev, deviceId])
        } else {
            setSelectedDevices(prev => prev.filter(id => id !== deviceId))
        }
    }

    // Get status badge variant
    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'active': return 'default'
            case 'inactive': return 'secondary'
            case 'maintenance': return 'destructive'
            default: return 'outline'
        }
    }

    // Get status icon
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'active': return <Activity className="h-3 w-3" />
            case 'inactive': return <Wifi className="h-3 w-3" />
            case 'maintenance': return <Settings className="h-3 w-3" />
            default: return null
        }
    }

    return (
        <div className="space-y-6">
            {/* CCTV Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dummyCCTVDevices.map((device) => (
                    <Card
                        key={device.id}
                        className="group hover:shadow-md transition-all duration-200 relative overflow-hidden"
                    >

                        <CardHeader className="pb-3">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <Camera className="h-5 w-5 text-blue-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-base truncate">
                                        {device.device_name}
                                    </h3>
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                                        <MapPin className="h-3 w-3" />
                                        <span className="truncate">{device.location.barangay}</span>
                                    </div>
                                    {/* Status Badge */}
                                    <div className="absolute top-4 right-4 z-10">
                                        <Badge
                                            variant={getStatusVariant(device.status)}
                                            className="gap-1 capitalize"
                                        >
                                            {getStatusIcon(device.status)}
                                            {device.status}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            {/* Description */}
                            <div>
                                <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
                                <p className="text-sm text-foreground line-clamp-2">
                                    {device.description}
                                </p>
                            </div>

                            {/* Technical Details */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-muted-foreground">Resolution</p>
                                    <p className="font-medium">{device.resolution}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">FPS</p>
                                    <p className="font-medium">{device.fps}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Brand</p>
                                    <p className="font-medium">{device.brand}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Category</p>
                                    <p className="font-medium">{device.location.category_name}</p>
                                </div>
                            </div>

                            {/* Location Details */}
                            <div className="pt-2 border-t">
                                <p className="text-xs text-muted-foreground mb-1">Location</p>
                                <p className="text-sm font-medium">{device.location.location_name}</p>
                                <p className="text-xs text-muted-foreground">
                                    {device.location.landmark}
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-between pt-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onViewReports?.(device)}
                                    className="gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                >
                                    <BarChart3 className="h-4 w-4" />
                                    Reports
                                </Button>

                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onViewStream?.(device)}
                                        className="h-8 w-8 p-0 hover:bg-green-50"
                                        title="View Live Stream"
                                    >
                                        <ExternalLink className="h-4 w-4 text-green-600" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onEdit?.(device)}
                                        className="h-8 w-8 p-0 hover:bg-orange-50"
                                        title="Edit Device"
                                    >
                                        <Edit className="h-4 w-4 text-orange-600" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onDelete?.(device)}
                                        className="h-8 w-8 p-0 hover:bg-red-50"
                                        title="Delete Device"
                                    >
                                        <Trash2 className="h-4 w-4 text-red-600" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Pagination Footer */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    Showing {dummyCCTVDevices.length} of {dummyCCTVDevices.length} CCTV devices
                </p>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled>
                        Previous
                    </Button>
                    <Button variant="outline" size="sm" className="bg-blue-50 border-blue-200">
                        1
                    </Button>
                    <Button variant="outline" size="sm" disabled>
                        Next
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default CCTVDisplay