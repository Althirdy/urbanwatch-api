import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import DashboardMap from '@/components/dashboard-map';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Map, Users } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

interface DashboardProps {
    unmappedConcerns: any[];
    puroks: any[];
    purokLeaders: any[];
}

export default function Dashboard({ unmappedConcerns, puroks, purokLeaders }: DashboardProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex flex-col gap-4 p-4">
                
                {/* Stats Row */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Unmapped Concerns</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{unmappedConcerns.length}</div>
                            <p className="text-xs text-muted-foreground">Require manual assignment</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Mapped Territories</CardTitle>
                            <Map className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{puroks.length}</div>
                            <p className="text-xs text-muted-foreground">Purok boundaries defined</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Leaders</CardTitle>
                            <Users className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{purokLeaders.length}</div>
                            <p className="text-xs text-muted-foreground">Officials available for duty</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Map Section */}
                <div className="flex-1 rounded-xl border overflow-hidden bg-card">
                    <div className="p-4 border-b">
                        <h3 className="font-semibold">Live Incident Map</h3>
                        <p className="text-sm text-muted-foreground">View and route unmapped concerns to Purok Leaders.</p>
                    </div>
                    <div className="p-0">
                        <DashboardMap 
                            puroks={puroks}
                            concerns={unmappedConcerns}
                            purokLeaders={purokLeaders}
                        />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}