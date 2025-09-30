import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { dashboard, locations } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
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
}

export type location_T = {
    id: number,
    location_name: string,
    location_category?: LocationCategory_T
    landmark: string,
    barangay: string,
    category: string,
    category_name?: string,
    longitude: string,
    latitude: string,
    cameras: number,
    description?: string,
}

export type pagination_T = {
    current_page: number,
    first_page_url: string,
    data: location_T[],
    from: number,
    last_page_url: string,
    links: { url: string | null, label: string, active: boolean }[],
    next_page_url: string | null,
    path: string,
    per_page: number,
    prev_page_url: string | null,
    to: number,
    total: number,
}

const locationCategory: LocationCategory_T[] = [
    { id: 1, name: 'School' },
    { id: 2, name: 'Hospital' },
    { id: 3, name: 'Market' },
    { id: 4, name: 'Park' },
    { id: 5, name: 'Government Office' },
]




export default function Locations({ locationCategories = [], locations }: { locationCategories?: LocationCategory_T[], locations?: pagination_T }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Locations" />
            <div className="p-4 space-y-4">
                <div className="flex">
                    <CreateLocation locationCategory={locationCategories.length > 0 ? locationCategories : locationCategory} />
                </div>
                <LocationCardView location={locations} locationCategory={locationCategories} />
            </div>
        </AppLayout>
    );
}