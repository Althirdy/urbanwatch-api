import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
} from '@/components/ui/card';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Cctv, ExternalLink, SquarePen, Trash2 } from 'lucide-react';

import { location_T, LocationCategory_T } from '@/types/location-types';
import DeleteLocation from './locations-archive';
import EditLocation from './locations-edit';
import ViewLocation from './locations-view';

const getCategoryColor = (categoryName: string) => {
    const colorMap: { [key: string]: string } = {
        School: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        Hospital: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        Market: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        Park: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
        'Government Office':
            'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
        Historic:
            'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
        Religious:
            'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
        Commercial:
            'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
        Residential:
            'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
        Transportation:
            'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
    };
    return (
        colorMap[categoryName] ||
        'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    );
};

function LocationCardView({
    locations = [],
    locationCategory = [],
}: {
    locations?: location_T[];
    locationCategory?: LocationCategory_T[];
}) {
    return (
        <div className="space-y-6">
            {/* Location Cards */}
            <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
                {locations.length === 0 ? (
                    <Card className="col-span-full">
                        <CardContent className="py-12 text-center text-muted-foreground">
                            No locations found.
                        </CardContent>
                    </Card>
                ) : (
                    locations.map((loc: location_T) => (
                        <Card
                            key={loc.id}
                    className="group relative overflow-hidden border bg-card transition-all duration-200 hover:shadow-md hover:border-primary/20 dark:border-zinc-800 dark:hover:border-zinc-700"
                        >
                            <CardHeader className="flex-row items-center">
                                <div className="flex flex-1 items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold">
                                            {loc.location_name}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {loc.landmark}
                                        </p>
                                        <p className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Cctv size={18} />
                                            <span>
                                                {loc.cctv_count} camera/s
                                            </span>
                                        </p>
                                    </div>
                                    
                                </div>
                            </CardHeader>
                            <CardContent className="text-sm">
                                <span className="text-muted-foreground ">
                                    Barangay: <span className='text-[var(--color-text-primary)] font-bold'>{loc.barangay}</span>
                                </span>
                            
                            </CardContent>
                            <CardFooter>
                                <div className="flex w-full justify-end gap-2">
                                    <Tooltip>
                                        <ViewLocation location={loc}>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="cursor-pointer"
                                                >
                                                    <ExternalLink className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                        </ViewLocation>
                                        <TooltipContent>
                                            <p>View Details</p>
                                        </TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <EditLocation
                                            location={loc}
                                            locationCategory={locationCategory}
                                        >
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="cursor-pointer"
                                                >
                                                    <SquarePen className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                        </EditLocation>
                                        <TooltipContent>
                                            <p>Edit Location</p>
                                        </TooltipContent>
                                    </Tooltip>

                                    <Tooltip>
                                        <DeleteLocation location={loc}>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="cursor-pointer"
                                                >
                                                    <Trash2 className="h-4 w-4 text-[var(--destructive)]" />
                                                </Button>
                                            </TooltipTrigger>
                                        </DeleteLocation>
                                        <TooltipContent>
                                            <p>Delete Location</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                            </CardFooter>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}

export default LocationCardView;
