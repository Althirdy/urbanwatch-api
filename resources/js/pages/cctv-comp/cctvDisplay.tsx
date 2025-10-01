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
import { cctv_T, location_T, paginated_T } from '../type'
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import EditCCTVDevice from './EditCCTV'
import ArchiveCCTV from './archiveCCTV'


interface CCTVDisplayProps {
    onEdit?: (device: any) => void
    onDelete?: (device: any) => void
    onViewReports?: (device: any) => void
    onViewStream?: (device: any) => void
    devices: paginated_T<cctv_T>
    locations: location_T[]
}

function CCTVDisplay({
    onEdit,
    onDelete,
    onViewReports,
    onViewStream,
    devices,
    locations = []
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
                {devices?.data.map((device) => (
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
                                    <EditCCTVDevice location={locations} cctv={device} />
                                    <ArchiveCCTV cctv={device} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Pagination Controls */}
            {devices && devices.links && (
                <Pagination className='flex justify-end'>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious href={devices.prev_page_url || '#'} />
                        </PaginationItem>
                        {
                            devices.links.map((link, index) => {
                                if (link.url !== null) {
                                    return (
                                        <PaginationItem key={index}>
                                            <PaginationLink isActive={link.active} href={link.url || '#'}>{link.label}</PaginationLink>
                                        </PaginationItem>
                                    )
                                }
                            })
                        }
                        <PaginationItem>
                            <PaginationEllipsis />
                        </PaginationItem>
                        <PaginationItem>
                            <PaginationNext href={devices.next_page_url || '#'} />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            )}
        </div>
    )
}

export default CCTVDisplay