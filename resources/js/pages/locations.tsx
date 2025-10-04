import AppLayout from '@/layouts/app-layout';
import { locations } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { paginated_T } from '../types/cctv-location-types';
import CreateLocation from './locations-comp/createLocation';
import LocationCardView from './locations-comp/locationCardList';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Locations',
        href: locations().url,
    },
];

export type LocationCategory_T = {
    id: number;
    name: string;
};

export type location_T = {
    id: number;
    location_name: string;
    location_category?: LocationCategory_T;
    landmark: string;
    barangay: string;
    category: string;
    category_name?: string;
    longitude: string;
    latitude: string;
    description?: string;
    cctv_count?: number;
};

type location_paginated_T = paginated_T<location_T>;

const locationCategory: LocationCategory_T[] = [
    { id: 1, name: 'School' },
    { id: 2, name: 'Hospital' },
    { id: 3, name: 'Market' },
    { id: 4, name: 'Park' },
    { id: 5, name: 'Government Office' },
];

export default function Locations({
    locationCategories = [],
    locations,
}: {
    locationCategories?: LocationCategory_T[];
    locations?: location_paginated_T;
}) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Locations" />
            <div className="space-y-4 p-4">
                <div className="flex">
                    <CreateLocation
                        locationCategory={
                            locationCategories.length > 0
                                ? locationCategories
                                : locationCategory
                        }
                    />
                </div>
                <LocationCardView
                    location={locations}
                    locationCategory={locationCategories}
                />
            </div>
        </AppLayout>
    );
}
