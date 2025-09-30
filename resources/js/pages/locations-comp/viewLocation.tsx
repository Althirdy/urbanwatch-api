import React from 'react'
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
import { Button } from '@/components/ui/button'
import { ExternalLink, MapPin } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { location_T } from '../locations'

interface ViewLocationProps {
    location: location_T;
}

function ViewLocation({ location }: ViewLocationProps) {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <div className='p-2 rounded-full hover:bg-secondary/20 cursor-pointer' >
                    <ExternalLink size={20} />
                </div>
            </SheetTrigger>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Location Details
                    </SheetTitle>
                    <SheetDescription>
                        View detailed information about this location.
                    </SheetDescription>
                </SheetHeader>
                <div className="grid flex-1 auto-rows-min gap-6 px-4 py-6">
                    <div className="grid gap-3">
                        <Label htmlFor="location-name">Location Name</Label>
                        <Input
                            id="location-name"
                            value={location.location_name}
                            readOnly
                            className="bg-muted"
                        />
                    </div>

                    <div className="grid gap-3">
                        <Label htmlFor="landmark">Near Landmark</Label>
                        <Input
                            id="landmark"
                            value={location.landmark}
                            readOnly
                            className="bg-muted"
                        />
                    </div>

                    <div className="grid gap-3">
                        <Label htmlFor="barangay">Barangay</Label>
                        <Input
                            id="barangay"
                            value={location.barangay}
                            readOnly
                            className="bg-muted"
                        />
                    </div>

                    <div className="grid gap-3">
                        <Label htmlFor="category">Category</Label>
                        <div className="p-2">
                            <Badge variant="secondary" className="text-sm">
                                {location.location_category ? location.location_category.name : 'Uncategorized'}
                            </Badge>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label htmlFor="latitude">Latitude</Label>
                            <Input
                                id="latitude"
                                value={location.latitude}
                                readOnly
                                className="bg-muted"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="longitude">Longitude</Label>
                            <Input
                                id="longitude"
                                value={location.longitude}
                                readOnly
                                className="bg-muted"
                            />
                        </div>
                    </div>

                    <div className="grid gap-3">
                        <Label htmlFor="cameras">Available Cameras</Label>
                        <div className="p-2">
                            <span className="text-2xl font-bold text-primary">
                                {location.cameras || 0}
                            </span>
                            <span className="text-sm text-muted-foreground ml-2">cameras</span>
                        </div>
                    </div>

                    <div className="grid gap-3">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id='description'
                            className='resize-none bg-muted'
                            value={location.description || 'No description provided.'}
                            readOnly
                            rows={4}
                        />
                    </div>
                </div>
                <SheetFooter className="px-4">
                    <SheetClose asChild>
                        <Button variant="outline">Close</Button>
                    </SheetClose>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}

export default ViewLocation