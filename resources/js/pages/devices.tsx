import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { devices } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import {
    cctv_T,
    location_T,
    paginated_T,
    uwDevice_T,
} from '../types/cctv-location-types';
import CCTVDisplay from './cctv-comp/cctv-view';
import AddCCTVDevice from './cctv-comp/cctv-create';
import AddUWDevice from './uwdevice-comp/createDevice';
import UWDeviceDisplay from './uwdevice-comp/deviceDisplay';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Devices',
        href: devices().url,
    },
];

type Device_T = paginated_T<cctv_T>;
type UWDevice_T = paginated_T<uwDevice_T>;

interface DevicesPageProps {
    devices: Device_T;
    uwDevices: UWDevice_T;
    locations: location_T[];
    cctvDevices: cctv_T[];
}

export default function Devices({
    devices,
    uwDevices,
    locations,
    cctvDevices,
}: DevicesPageProps) {
    const [viewMode, setViewMode] = useState<'cctv' | 'uwDevice'>('cctv');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Devices" />

            <div className="space-y-2 p-4">
                <div className="flex items-center  gap-2">
                    {viewMode === 'cctv' ? (
                        <AddCCTVDevice location={locations} />

                    ) : (
                        <AddUWDevice
                            location={locations}
                            cctvDevices={cctvDevices}
                        />

                    )}

                    {/* View Toggle */}
                    <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'cctv' | 'uwDevice')}>
                        <TabsList className="h-10 p-1">
                            <TabsTrigger
                                value="cctv"
                                className="h-7 px-3 text- data-[state=active]:bg-background"
                            >
                                CCTV
                            </TabsTrigger>
                            <TabsTrigger
                                value="uwDevice"
                                className="h-7 px-3 text-xs data-[state=active]:bg-background"
                            >
                                IoT Box
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>



                {/* Content */}
                {viewMode === 'cctv' ? (

                    <CCTVDisplay devices={devices} locations={locations} />

                ) : (

                    <UWDeviceDisplay
                        devices={uwDevices}
                        locations={locations}
                        cctvDevices={cctvDevices}
                    />
                )}
            </div>


        </AppLayout>
    );
}
