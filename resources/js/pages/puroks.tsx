import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Map as MapIcon, Plus, SquarePen, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PurokEditorMap from '@/components/purok-editor-map';
import { toast } from '@/components/use-toast';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Territories (Puroks)',
        href: '/puroks',
    },
];

interface Purok {
    id: number;
    name: string;
    color: string;
    geometry: {
        type: string;
        coordinates: any[][];
    };
}

interface PuroksProps {
    puroks: Purok[];
}

export default function Puroks({ puroks }: PuroksProps) {
    const [editingPurok, setEditingPurok] = useState<Purok | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const { data, setData, put, post, processing, reset, delete: destroy } = useForm({
        name: '',
        color: '#3b82f6',
        coordinates: [] as [number, number][],
    });

    const handleEdit = (purok: Purok) => {
        setEditingPurok(purok);
        setData({
            name: purok.name,
            color: purok.color || '#3b82f6',
            coordinates: purok.geometry.coordinates[0] as [number, number][],
        });
    };

    const handleUpdate = (coordinates: [number, number][]) => {
        if (!editingPurok) return;

        // Coordinates come in as [lng, lat]
        put(route('puroks.update', editingPurok.id), {
            data: { ...data, coordinates },
            onSuccess: () => {
                toast({ title: "Updated", description: "Purok boundary updated successfully." });
                setEditingPurok(null);
                reset();
            },
        });
    };

    const handleCreate = (coordinates: [number, number][]) => {
        post(route('puroks.store'), {
            data: { ...data, coordinates },
            onSuccess: () => {
                toast({ title: "Created", description: "New Purok territory created." });
                setIsCreateModalOpen(false);
                reset();
            },
        });
    };

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this territory? This action cannot be undone.')) {
            destroy(route('puroks.destroy', id), {
                onSuccess: () => {
                    toast({ title: "Deleted", description: "Purok removed from system." });
                }
            });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Territories" />
            <div className="p-4 space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Territory Management</h2>
                        <p className="text-muted-foreground">Define and edit Purok boundaries for geographic routing.</p>
                    </div>
                    <Button onClick={() => { reset(); setIsCreateModalOpen(true); }}>
                        <Plus className="w-4 h-4 mr-2" /> Add New Territory
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {puroks.map((purok) => (
                        <Card key={purok.id} className="overflow-hidden">
                            <div className="h-2 w-full" style={{ backgroundColor: purok.color || '#3b82f6' }} />
                            <CardHeader className="p-4 pb-2">
                                <div className="flex justify-between items-start">
                                    <CardTitle className="text-lg">{purok.name}</CardTitle>
                                    <Badge variant="outline" className="text-[10px]">
                                        {purok.geometry?.coordinates[0]?.length || 0} Points
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                                <div className="flex justify-end gap-2 mt-4">
                                    <Button variant="outline" size="sm" onClick={() => handleEdit(purok)}>
                                        <SquarePen className="w-3.5 h-3.5 mr-1.5" /> Edit Boundary
                                    </Button>
                                    <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(purok.id)}>
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Edit Modal */}
                <Dialog open={!!editingPurok} onOpenChange={(open) => !open && setEditingPurok(null)}>
                    <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
                        <DialogHeader className="p-6 pb-0">
                            <DialogTitle>Edit Territory: {editingPurok?.name}</DialogTitle>
                            <DialogDescription>
                                Modify the name, color, and geographic boundary of this Purok.
                            </DialogDescription>
                        </DialogHeader>
                        
                        <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Territory Name</Label>
                                    <Input 
                                        value={data.name} 
                                        onChange={e => setData('name', e.target.value)} 
                                        placeholder="e.g. Maharlika 1"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Map Color</Label>
                                    <div className="flex gap-2">
                                        <Input 
                                            type="color" 
                                            className="w-12 p-1 h-10"
                                            value={data.color} 
                                            onChange={e => setData('color', e.target.value)} 
                                        />
                                        <Input 
                                            value={data.color} 
                                            onChange={e => setData('color', e.target.value)} 
                                            placeholder="#3b82f6"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 flex-1 flex flex-col min-h-[450px]">
                                <Label>Boundary Editor</Label>
                                <PurokEditorMap 
                                    initialCoordinates={data.coordinates}
                                    color={data.color}
                                    onSave={handleUpdate}
                                />
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Create Modal */}
                <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                    <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
                        <DialogHeader className="p-6 pb-0">
                            <DialogTitle>Add New Territory</DialogTitle>
                            <DialogDescription>
                                Create a new geographic area for concern routing.
                            </DialogDescription>
                        </DialogHeader>
                        
                        <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Territory Name</Label>
                                    <Input 
                                        value={data.name} 
                                        onChange={e => setData('name', e.target.value)} 
                                        placeholder="e.g. New Purok"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Map Color</Label>
                                    <Input 
                                        type="color" 
                                        className="w-full"
                                        value={data.color} 
                                        onChange={e => setData('color', e.target.value)} 
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 flex-1 flex flex-col min-h-[450px]">
                                <Label>Boundary Editor</Label>
                                <PurokEditorMap 
                                    color={data.color}
                                    onSave={handleCreate}
                                />
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
