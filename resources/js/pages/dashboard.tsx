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
                        <div className="flex items-center gap-3">
                            <div className="rounded-md bg-primary/10 p-2 text-primary">
                                <Map className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-bold tracking-tight">Live Incident Map</h3>
                                <p className="text-xs text-muted-foreground">Geographic overview of all incidents and boundaries within the barangay.</p>
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
        <Card className="flex flex-col h-full border-muted-foreground/10 hover:border-primary/30 hover:shadow-lg transition-all duration-300 overflow-hidden group">
            <CardHeader className="pb-3 border-b bg-muted/20">
                <div className="flex items-start justify-between gap-2">
                    <Badge variant="secondary" className="px-2 py-0 text-[10px] uppercase font-bold tracking-wider">{concern.category}</Badge>
                    <span className="text-[10px] text-muted-foreground font-semibold bg-muted px-1.5 py-0.5 rounded">ID #{concern.id}</span>
                </div>
                <CardTitle className="text-base font-bold line-clamp-1 mt-2 text-foreground group-hover:text-primary transition-colors">{concern.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 space-y-4 pt-4">
                <p className="text-sm text-muted-foreground/90 line-clamp-3 min-h-[4.5em] leading-relaxed italic">
                    "{concern.description}"
                </p>

                <form onSubmit={handleAssign} className="space-y-4 pt-2 border-t border-dashed">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-muted-foreground/70 tracking-widest flex items-center gap-1.5">
                            <Users className="h-3 w-3" /> Assign to Official
                        </label>
                        <Select
                            value={data.leader_id}
                            onValueChange={(val) => setData('leader_id', val)}
                        >
                            <SelectTrigger className="h-10 text-xs bg-muted/30 border-muted-foreground/20 focus:ring-primary/20">
                                <SelectValue placeholder="Select Purok Leader" />
                            </SelectTrigger>
                            <SelectContent>
                                {purokLeaders.map((leader) => (
                                    <SelectItem key={leader.id} value={leader.id.toString()}>
                                        <div className="flex flex-col">
                                            <span className="font-semibold">{leader.name}</span>
                                            <span className="text-[10px] text-muted-foreground"> {leader.purok_name}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button
                        type="submit"
                        size="sm"
                        className="w-full text-xs font-bold tracking-tighter shadow-sm transition-all active:scale-[0.98]"
                        disabled={processing || !data.leader_id}
                    >
                        {processing ? <Spinner className="w-3 h-3 mr-2" /> : <Send className="w-3 h-3 mr-2" />}
                        Route Concern
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}