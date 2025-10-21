import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { locations } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { List, Table } from 'lucide-react';
import { useState } from 'react';
import {
    location_T,
    LocationCategory_T,
    paginated_T,
} from '../types/cctv-location-types';
import LocationCardView from './locations-comp/location-card-list';
import CreateLocation from './locations-comp/location-create';
import LocationActionTab from './locations-comp/location-tab';
import LocationTable from './locations-comp/location-table';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Locations',
        href: locations().url,
    },
];

type location_paginated_T = paginated_T<location_T>;

type Barangay = {
    id: number;
    name: string;
};

export default function Locations({
    locationCategories = [],
    locations,
    barangays = [],
}: {
    locationCategories?: LocationCategory_T[];
    locations?: location_paginated_T;
    barangays?: Barangay[];
}) {
    const [filtered_locations, setFilteredLocations] = useState<location_T[]>(
        locations?.data || [],
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Locations" />
            <div className="space-y-4 p-4">
                <CreateLocation
                    locationCategory={locationCategories}
                    barangayList={barangays}
                />

                <Tabs defaultValue="table" className="w-full space-y-2">
                    <div className="flex flex-row gap-4">
                        <LocationActionTab
                            locations={locations!}
                            locationCategories={locationCategories}
                            setFilteredLocations={setFilteredLocations}
                        />
                        <TabsList className="h-12 w-24">
                            <TabsTrigger
                                value="table"
                                className="cursor-pointer"
                            >
                                <List className="h-8 w-8" />
                            </TabsTrigger>
                            <TabsTrigger
                                value="card"
                                className="cursor-pointer"
                            >
                                <Table className="h-4 w-4" />
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="table" className="w-full">
                        <LocationTable
                            location={{
                                ...locations!,
                                data: filtered_locations,
                            }}
                            locationCategory={locationCategories}
                        />
                    </TabsContent>
                    <TabsContent value="card" className="w-full">
                        <LocationCardView
                            location={{
                                ...locations!,
                                data: filtered_locations,
                            }}
                            locationCategory={locationCategories}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
