import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { devices } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { Button } from '@/components/ui/button';
import AddCCTVDevice from './cctv-comp/createCCTV';
import { cctv_T, location_T, paginated_T, uwDevice_T } from './type';
import CCTVDisplay from './cctv-comp/cctvDisplay';
import AddUWDevice from './uwdevice-comp/createDevice';
import UWDeviceDisplay from './uwdevice-comp/deviceDisplay';


const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Devices',
        href: devices().url,
    },
];

type Device_T = paginated_T<cctv_T>
type UWDevice_T = paginated_T<uwDevice_T>

interface DevicesPageProps {
    devices: Device_T;
    uwDevices: UWDevice_T;
    locations: location_T[];
    cctvDevices: cctv_T[];
}

export default function Devices({ devices, uwDevices, locations, cctvDevices }: DevicesPageProps) {

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Devices" />
            <div className='p-4'>
                <Tabs defaultValue="cctv">
                    <TabsList>
                        <TabsTrigger value="cctv">CCTV</TabsTrigger>
                        <TabsTrigger value="uwDevice">UW Device</TabsTrigger>
                    </TabsList>
                    <TabsContent value="cctv" className='space-y-6'>
                        <AddCCTVDevice location={locations} />
                        <CCTVDisplay devices={devices} locations={locations} />
                    </TabsContent>
                    <TabsContent value="uwDevice" className='space-y-6'>
                        <AddUWDevice location={locations} cctvDevices={cctvDevices} />
                        <UWDeviceDisplay 
                            devices={uwDevices} 
                            locations={locations}
                            cctvDevices={cctvDevices}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
