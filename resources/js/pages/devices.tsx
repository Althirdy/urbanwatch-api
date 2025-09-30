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


const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: devices().url,
    },
];
type Device_T = []

export type location_T = {
    id: number,
    location_name: string,
    category_name?: string,
    landmark: string,
    barangay: string,
}

export default function Devices({ devices, locations }: { devices: Device_T, locations: location_T[] }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className='p-4'>
                <Tabs defaultValue="cctv">
                    <TabsList>
                        <TabsTrigger value="cctv">CCTV</TabsTrigger>
                        <TabsTrigger value="uwDevice">UW Device</TabsTrigger>
                    </TabsList>
                    <TabsContent value="cctv">
                        <AddCCTVDevice location={locations} />
                    </TabsContent>
                    <TabsContent value="uwDevice">
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
