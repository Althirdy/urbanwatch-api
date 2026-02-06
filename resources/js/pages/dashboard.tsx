import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import DashboardMap from '@/components/dashboard-map';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Map, Users } from 'lucide-react';
import { assign } from '@/routes/dashboard';

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
            <div className="flex flex-col gap-6 p-4 md:p-6 max-w-7xl mx-auto w-full">

                {/* Stats Row */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="relative overflow-hidden shadow-sm border-red-500/20 bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent dark:from-red-500/20 dark:via-red-500/10 dark:to-transparent transition-all hover:shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-bold uppercase tracking-wider text-red-600/80 dark:text-red-400/80">Unmapped Concerns</CardTitle>
                            <div className="rounded-full bg-red-500/10 p-1.5">
                                <AlertTriangle className="h-4 w-4 text-red-500" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black tracking-tight text-red-700 dark:text-red-400">{unmappedConcerns.length}</div>
                            <p className="text-[11px] font-medium text-red-600/70 dark:text-red-400/60 mt-1 uppercase tracking-tight">Require manual assignment</p>
                        </CardContent>
                    </Card>

                    <Card className="relative overflow-hidden shadow-sm border-blue-500/20 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent dark:from-blue-500/20 dark:via-blue-500/10 dark:to-transparent transition-all hover:shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-bold uppercase tracking-wider text-blue-600/80 dark:text-blue-400/80">Mapped Territories</CardTitle>
                            <div className="rounded-full bg-blue-500/10 p-1.5">
                                <Map className="h-4 w-4 text-blue-500" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black tracking-tight text-blue-700 dark:text-blue-400">{puroks.length}</div>
                            <p className="text-[11px] font-medium text-blue-600/70 dark:text-blue-400/60 mt-1 uppercase tracking-tight">Purok boundaries defined</p>
                        </CardContent>
                    </Card>

                    <Card className="relative overflow-hidden shadow-sm border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent dark:from-emerald-500/20 dark:via-emerald-500/10 dark:to-transparent transition-all hover:shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-bold uppercase tracking-wider text-emerald-600/80 dark:text-emerald-400/80">Active Leaders</CardTitle>
                            <div className="rounded-full bg-emerald-500/10 p-1.5">
                                <Users className="h-4 w-4 text-emerald-500" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black tracking-tight text-emerald-700 dark:text-emerald-400">{purokLeaders.length}</div>
                            <p className="text-[11px] font-medium text-emerald-600/70 dark:text-emerald-400/60 mt-1 uppercase tracking-tight">Officials available for duty</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Live Citizen Concern Map */}
                <div className="rounded-xl border shadow-sm bg-card overflow-hidden">
                    <div className="flex items-center gap-3 p-4 border-b bg-muted/20">
                        <div className="rounded-md bg-primary/10 p-2.5 text-primary">
                            <Map className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-bold tracking-tight">Geographic Concern Overview</h2>
                            <p className="text-sm text-muted-foreground mt-0.5">
                                {unmappedConcerns.length === 0 
                                    ? 'All concerns have been assigned to officials. Great work!' 
                                    : `${unmappedConcerns.length} unmapped concern${unmappedConcerns.length === 1 ? '' : 's'} requiring assignment. Click any marker to route to a Purok Leader.`
                                }
                            </p>
                        </div>
                    </div>
                    <div className="h-[calc(100vh-320px)] min-h-[600px]">
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