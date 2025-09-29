import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { dashboard, locations } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import CreateLocation from './locations-comp/createLocation';

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
    landmark: string,
    barangay: string,
    category: string,
    longitude: string,
    latitude: string,
    cameras: number,
    description?: string,
}

const locationCategory: LocationCategory_T[] = [
    { id: 1, name: 'School' },
    { id: 2, name: 'Hospital' },
    { id: 3, name: 'Market' },
    { id: 4, name: 'Park' },
    { id: 5, name: 'Government Office' },
]

export default function Locations({ locationCategories = [] }: { locationCategories?: LocationCategory_T[] }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Locations" />
            <div className="p-4 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <CreateLocation locationCategory={locationCategories.length > 0 ? locationCategories : locationCategory} />
                </div>
            </div>
        </AppLayout>
    );
}