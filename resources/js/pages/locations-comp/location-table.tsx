import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    location_T,
    LocationCategory_T,
    paginated_T,
} from '@/types/cctv-location-types';
import DeleteLocation from './location-archive';
import EditLocation from './location-edit';
import ViewLocation from './location-view';

function LocationTable({
    location,
    locationCategory = [],
}: {
    location?: paginated_T<location_T>;
    locationCategory?: LocationCategory_T[];
}) {
    return (
        <div className="overflow-hidden rounded-[var(--radius)] bg-[var(--sidebar)]">
            <Table className="m-0 border">
                <TableHeader className="bg-muted/50">
                    <TableRow>
                        <TableHead className="border-r py-4 text-center font-semibold">
                            Location ID
                        </TableHead>
                        <TableHead className="border-r py-4 text-center font-semibold">
                            Location Name
                        </TableHead>
                        <TableHead className="border-r py-4 text-center font-semibold">
                            Landmark
                        </TableHead>
                        <TableHead className="border-r py-4 text-center font-semibold">
                            Barangay
                        </TableHead>
                        <TableHead className="border-r py-4 text-center font-semibold">
                            Category
                        </TableHead>
                        <TableHead className="border-r py-4 text-center font-semibold">
                            CCTV Count
                        </TableHead>
                        <TableHead className="py-4 text-center font-semibold">
                            Actions
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {(location?.data || []).length === 0 ? (
                        <TableRow>
                            <TableCell
                                colSpan={7}
                                className="py-8 text-center text-muted-foreground"
                            >
                                No locations found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        (location?.data || []).map((loc: location_T) => (
                            <TableRow
                                key={loc.id}
                                className="text-center text-muted-foreground"
                            >
                                <TableCell className="py-3">
                                    #{loc.id}
                                </TableCell>
                                <TableCell className="py-3">
                                    {loc.location_name}
                                </TableCell>
                                <TableCell className="py-3">
                                    {loc.landmark}
                                </TableCell>
                                <TableCell className="py-3">
                                    {loc.barangay}
                                </TableCell>
                                <TableCell className="py-3">
                                    {loc.location_category?.name || 'N/A'}
                                </TableCell>
                                <TableCell className="py-3">
                                    {loc.cctv_count}
                                </TableCell>
                                <TableCell className="py-3">
                                    <div className="flex justify-center gap-2">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div>
                                                    <ViewLocation
                                                        location={loc}
                                                    />
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>View Details</p>
                                            </TooltipContent>
                                        </Tooltip>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div>
                                                    <EditLocation
                                                        location={loc}
                                                        locationCategory={
                                                            locationCategory
                                                        }
                                                    />
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Edit Location</p>
                                            </TooltipContent>
                                        </Tooltip>

                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div>
                                                    <DeleteLocation
                                                        location={loc}
                                                    />
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Archive Location</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
            {location && location.links && location.links.length > 0 && (
                <Pagination className="flex justify-end border-t p-4">
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
                                if (
                                    link.label !== '&laquo; Previous' &&
                                    link.label !== 'Next &raquo;' &&
                                    link.url
                                ) {
                                    return (
                                        <PaginationItem key={index}>
                                            <PaginationLink
                                                isActive={link.active}
                                                href={link.url}
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

export default LocationTable;
