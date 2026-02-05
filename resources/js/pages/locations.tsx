import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { locations } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { location_T } from '@/types/location-types';
import { Head } from '@inertiajs/react';
import { LayoutGrid, Table } from 'lucide-react';
import { useState } from 'react';
import LocationCardView from './locations-comp/locations-card';
import CreateLocation from './locations-comp/locations-create';
import LocationActionTab from './locations-comp/locations-tab';
import LocationsTable from './locations-comp/locations-table';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Locations',
        href: locations().url,
    },
];

export default function Locations({
    locations = [],
    packages = [],
}: {
    locations?: location_T[];
    packages?: { id: number; name: string }[];
}) {
    const [filteredLocations, setFilteredLocations] = useState<location_T[]>(
        locations || [],
    );
    const [viewMode, setViewMode] = useState<'table' | 'card'>('card');


    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Locations" />
            <div className="space-y-4 p-4">

                <div className="flex items-center justify-between gap-4">
                    <CreateLocation packages={packages} />

                    {/* View Toggle */}
                    <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'table' | 'card')}>
                        <TabsList className="h-9 p-1">
                            <TabsTrigger
                                value="table"
                                className="h-7 px-3 text-xs data-[state=active]:bg-background"
                            >
                                <Table className="h-3.5 w-3.5 mr-1.5" />
                                Table
                            </TabsTrigger>
                            <TabsTrigger
                                value="card"
                                className="h-7 px-3 text-xs data-[state=active]:bg-background"
                            >
                                <LayoutGrid className="h-3.5 w-3.5 mr-1.5" />
                                Cards
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
                <LocationActionTab
                    locations={locations}
                    setFilteredLocations={setFilteredLocations}
                />

                {viewMode === 'table' ? (
                    <LocationsTable locations={filteredLocations} />
                ) : (
                    <LocationCardView locations={filteredLocations} />
                )}

            </div>
        </AppLayout>
    );
}
