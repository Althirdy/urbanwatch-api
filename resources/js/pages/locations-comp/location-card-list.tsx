import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
} from '@/components/ui/card';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import { location_T, LocationCategory_T } from '@/types/cctv-location-types';
import { Cctv, MapPin } from 'lucide-react';
import { paginated_T } from '../../types/cctv-location-types';
import DeleteLocation from './location-archive';
import EditLocation from './location-edit';
import ViewLocation from './location-view';

function LocationCardView({
    location,
    locationCategory = [],
}: {
    location?: paginated_T<location_T>;
    locationCategory?: LocationCategory_T[];
}) {
    return (
        <div className="space-y-6">
            {/* Location Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {(location?.data || []).length === 0 && (
                    <div className="flex min-h-[200px] items-center justify-center rounded-[var(--radius)] border border-dashed">
                        <p className="text-sm text-muted-foreground">
                            No locations found at the moment
                        </p>
                    </div>
                )}

                {(location?.data || []).map((loc: location_T) => (
                    <Card
                        key={loc.id}
                        className="rounded-lg border bg-card p-4"
                    >
                        <CardHeader className="flex-row items-center p-0">
                            <MapPin className="h-6 w-6 text-muted-foreground" />
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold">
                                        {loc.location_name}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        {loc.landmark}
                                    </p>
                                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Cctv size={18} />
                                        <span>{loc.cctv_count} Camera</span>
                                    </p>
                                </div>
                                <span className="rounded text-sm font-medium text-muted-foreground">
                                    {loc.location_category?.name}
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent className="">
                            <span className="text-sm text-muted-foreground">
                                Description
                            </span>
                            <p>{loc.description}</p>
                        </CardContent>
                        <CardFooter className="justify-end p-0">
                            <ViewLocation location={loc} />
                            <EditLocation
                                location={loc}
                                locationCategory={locationCategory}
                            />
                            <DeleteLocation location={loc} />
                        </CardFooter>
                    </Card>
                ))}
            </div>

            {/* Pagination Controls */}
            {location && location.links && (
                <Pagination className="flex justify-end">
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious
                                href={location.prev_page_url || '#'}
                            />
                        </PaginationItem>
                        {location.links.map(
                            (
                                link: {
                                    url: string | null;
                                    active: boolean;
                                    label: string;
                                },
                                index: number,
                            ) => {
                                if (link.url !== null) {
                                    return (
                                        <PaginationItem key={index}>
                                            <PaginationLink
                                                isActive={link.active}
                                                href={link.url || '#'}
                                            >
                                                {link.label}
                                            </PaginationLink>
                                        </PaginationItem>
                                    );
                                }
                            },
                        )}
                        <PaginationItem>
                            <PaginationEllipsis />
                        </PaginationItem>
                        <PaginationItem>
                            <PaginationNext
                                href={location.next_page_url || '#'}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            )}
        </div>
    );
}

export default LocationCardView;
