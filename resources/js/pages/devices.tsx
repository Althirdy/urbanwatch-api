import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { devices } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { cctv_T, location_T, paginated_T } from '../types/cctv-location-types';
import CCTVDisplay from './cctv-comp/cctvDisplay';
import AddCCTVDevice from './cctv-comp/createCCTV';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: devices().url,
    },
];

type Device_T = paginated_T<cctv_T>;

export default function Devices({
    devices,
    locations,
}: {
    devices: Device_T;
    locations: location_T[];
}) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="p-4">
                <Tabs defaultValue="cctv">
                    <TabsList>
                        <TabsTrigger value="cctv">CCTV</TabsTrigger>
                        <TabsTrigger value="uwDevice">UW Device</TabsTrigger>
                    </TabsList>
                    <TabsContent value="cctv" className="space-y-6">
                        <AddCCTVDevice location={locations} />
                        <CCTVDisplay devices={devices} locations={locations} />
                    </TabsContent>
                    <TabsContent value="uwDevice"></TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
