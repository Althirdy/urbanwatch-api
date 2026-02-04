import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import DashboardMap from '@/components/dashboard-map';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Map, Users, ChevronDown, ChevronUp, MapPin, Send } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from '@inertiajs/react';
import { toast } from '@/components/use-toast';
import { Spinner } from '@/components/ui/spinner';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
    const [isMapOpen, setIsMapOpen] = useState(false);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex flex-col gap-6 p-4 md:p-6 max-w-7xl mx-auto w-full">

                {/* Stats Row */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="shadow-sm border-red-100 bg-red-50/30">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Unmapped Concerns</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-700">{unmappedConcerns.length}</div>
                            <p className="text-xs text-muted-foreground">Require manual assignment</p>
                        </CardContent>
                    </Card>
                    <Card className="shadow-sm border-blue-100 bg-blue-50/30">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Mapped Territories</CardTitle>
                            <Map className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-700">{puroks.length}</div>
                            <p className="text-xs text-muted-foreground">Purok boundaries defined</p>
                        </CardContent>
                    </Card>
                    <Card className="shadow-sm border-green-100 bg-green-50/30">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Leaders</CardTitle>
                            <Users className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-700">{purokLeaders.length}</div>
                            <p className="text-xs text-muted-foreground">Officials available for duty</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Unassigned Queue Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h2 className="text-xl font-bold tracking-tight">Unassigned Queue</h2>
                            <p className="text-sm text-muted-foreground">
                                These concerns could not be automatically routed. Please assign them to a Purok Leader.
                            </p>
                        </div>
                    </div>

                    {unmappedConcerns.length === 0 ? (
                        <Card className="border-dashed flex items-center justify-center p-12 text-center">
                            <div className="space-y-2">
                                <MapPin className="h-8 w-8 text-muted-foreground/50 mx-auto" />
                                <p className="text-muted-foreground">No unassigned concerns at the moment.</p>
                            </div>
                        </Card>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {unmappedConcerns.map((concern) => (
                                <UnassignedConcernCard
                                    key={concern.id}
                                    concern={concern}
                                    purokLeaders={purokLeaders}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Collapsible Map Section */}
                <Collapsible
                    open={isMapOpen}
                    onOpenChange={setIsMapOpen}
                    className="rounded-xl border shadow-sm bg-card overflow-hidden"
                >
                    <div className="flex items-center justify-between p-4 border-b">
                        <div className="flex items-center gap-2">
                            <Map className="h-5 w-5 text-primary" />
                            <div>
                                <h3 className="font-semibold leading-none">Live Incident Map</h3>
                                <p className="text-xs text-muted-foreground mt-1">Geographic overview of all incidents and boundaries.</p>
                            </div>
                        </div>
                        <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                {isMapOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                        </CollapsibleTrigger>
                    </div>
                    <CollapsibleContent>
                        <div className="p-0 h-[500px]">
                            <DashboardMap
                                puroks={puroks}
                                concerns={unmappedConcerns}
                                purokLeaders={purokLeaders}
                            />
                        </div>
                    </CollapsibleContent>
                </Collapsible>
            </div>
        </AppLayout>
    );
}

function UnassignedConcernCard({ concern, purokLeaders }: { concern: any, purokLeaders: any[] }) {
    const { data, setData, post, processing, reset } = useForm({
        leader_id: '',
    });

    const handleAssign = (e: React.FormEvent) => {
        e.preventDefault();
        if (!data.leader_id) return;

        post(assign(concern.id).url, {
            onSuccess: () => {
                toast({
                    title: "Assigned Successfully",
                    description: "The concern has been routed.",
                });
                reset();
            },
            preserveScroll: true
        });
    };

    return (
        <Card className="flex flex-col h-full hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                    <Badge variant="outline" className="capitalize">{concern.category}</Badge>
                    <span className="text-[10px] text-muted-foreground font-mono">#{concern.id}</span>
                </div>
                <CardTitle className="text-base line-clamp-1 mt-2">{concern.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-3 min-h-[4.5em]">
                    {concern.description}
                </p>

                <form onSubmit={handleAssign} className="space-y-3 pt-2">
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider">Assign to Official</label>
                        <Select
                            value={data.leader_id}
                            onValueChange={(val) => setData('leader_id', val)}
                        >
                            <SelectTrigger className="h-9 text-xs">
                                <SelectValue placeholder="Select Purok Leader" />
                            </SelectTrigger>
                            <SelectContent>
                                {purokLeaders.map((leader) => (
                                    <SelectItem key={leader.id} value={leader.id.toString()}>
                                        {leader.name} — {leader.purok_name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button type="submit" size="sm" className="w-full text-xs" disabled={processing || !data.leader_id}>
                        {processing ? <Spinner className="w-3 h-3 mr-2" /> : <Send className="w-3 h-3 mr-2" />}
                        Route Concern
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}