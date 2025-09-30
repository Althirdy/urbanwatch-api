import React from 'react'
import { pagination_T } from '../locations'
import { MapPin, ChevronLeft, ChevronRight, Link } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { LocationCategory_T } from '../locations'
import ViewLocation from './viewLocation'
import EditLocation from './editLocation'
import DeleteLocation from './archiveLocation'
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"

function LocationCardView({ location, locationCategory = [] }: { location?: pagination_T, locationCategory?: LocationCategory_T[] }) {

    return (
        <div className="space-y-6">
            {/* Location Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(location?.data || []).map((loc) => (
                    <Card key={loc.id} className="p-4 rounded-lg border bg-card">
                        <CardHeader className='flex-row items-center p-0'>
                            <MapPin className="h-6 w-6 text-muted-foreground" />
                            <div className="flex-1 items-center flex justify-between">
                                <div>
                                    <h3 className="font-semibold">{loc.location_name}</h3>
                                    <p className="text-sm text-muted-foreground">{loc.landmark}</p>
                                </div>
                                <span className="font-medium text-muted-foreground text-sm rounded">
                                    {loc.location_category?.name}
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent className=''>
                            <span className='text-sm text-muted-foreground'>Description</span>
                            <p>
                                {loc.description}
                            </p>
                        </CardContent>
                        <CardFooter className='p-0 justify-end'>
                            <ViewLocation location={loc} />
                            <EditLocation location={loc} locationCategory={locationCategory} />
                            <DeleteLocation location={loc} />
                        </CardFooter>
                    </Card>
                ))}
            </div>

            {/* Pagination Controls */}
            {location && location.links && (
                <Pagination className='flex justify-end'>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious href={location.prev_page_url || '#'} />
                        </PaginationItem>
                        {
                            location.links.map((link, index) => {
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
                            <PaginationNext href={location.next_page_url || '#'} />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            )}
        </div>
    )
}

export default LocationCardView