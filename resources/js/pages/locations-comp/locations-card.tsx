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
import { Archive, Cctv, ExternalLink, SquarePen } from 'lucide-react';
import { cn } from '@/lib/utils';

import { location_T, LocationCategory_T } from '@/types/location-types';
import DeleteLocation from './locations-archive';
import EditLocation from './locations-edit';
import ViewLocation from './locations-view';

const getCategoryColor = (categoryName: string) => {
    const colorMap: Record<string, string> = {
        School: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
        Hospital: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20',
        Market: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20',
        Park: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
        'Government Office': 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20',
        Historic: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
        Religious: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20',
        Commercial: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20',
        Residential: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/20',
        Transportation: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-500/10 dark:text-teal-400 dark:border-teal-500/20',
    };
    return colorMap[categoryName] || 'bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-500/10 dark:text-zinc-400 dark:border-zinc-500/20';
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
                                        <h3 className="text-lg font-bold">
                                            {loc.location_name}
                                        </h3>
                                        <p className="text-base text-muted-foreground">
                                            {loc.landmark}
                                        </p>
                                        <p className="flex items-center gap-2 text-base text-muted-foreground mt-1">
                                            <Cctv size={20} />
                                            <span>
                                                {loc.cctv_count} camera/s
                                            </span>
                                        </p>
                                        <div className="mt-1 flex flex-wrap gap-1">
                                            {loc.category && (
                                                <Badge variant="outline" className={cn("text-[10px] font-medium", getCategoryColor(loc.category.name))}>
                                                    {loc.category.name}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                </div>
                            </CardHeader>
                            <CardContent className="text-sm px-4 py-2">
                                <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800/50 p-2 rounded-md border border-zinc-100 dark:border-zinc-800/80">
                                    <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-bold">Barangay</span>
                                    <span className="font-semibold text-sm text-zinc-700 dark:text-zinc-300">{loc.barangay}</span>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <div className="flex w-full justify-end gap-2 pt-2 border-t dark:border-zinc-800">
                                    <Tooltip>
                                        <ViewLocation location={loc}>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="cursor-pointer h-8 w-8 p-0 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                                >
                                                    <ExternalLink className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                                                </Button>
                                            </TooltipTrigger>
                                        </ViewLocation>
                                        <TooltipContent side="bottom" className="text-[10px] py-1 px-2">
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
                                                    className="cursor-pointer h-8 w-8 p-0 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                                >
                                                    <SquarePen className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                                                </Button>
                                            </TooltipTrigger>
                                        </EditLocation>
                                        <TooltipContent side="bottom" className="text-[10px] py-1 px-2">
                                            <p>Edit Location</p>
                                        </TooltipContent>
                                    </Tooltip>

                                    <Tooltip>
                                        <DeleteLocation location={loc}>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="cursor-pointer h-8 w-8 p-0 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 group"
                                                >
                                                    <Archive className="h-4 w-4 text-zinc-400 group-hover:text-red-500 transition-colors" />
                                                </Button>
                                            </TooltipTrigger>
                                        </DeleteLocation>
                                        <TooltipContent side="bottom" className="text-[10px] py-1 px-2 border-red-500/20 bg-red-50/90 dark:bg-red-950/90 text-red-600 dark:text-red-400">
                                            <p>Archive Location</p>
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
