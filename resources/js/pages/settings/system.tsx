import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/use-toast';
import { type BreadcrumbItem } from '@/types';

interface SystemSetting {
    id: number;
    key: string;
    value: string;
    description: string | null;
}

interface Props {
    settings: Record<string, SystemSetting>;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'System Settings',
        href: '/system-settings',
    },
];

export default function SystemSettings({ settings }: Props) {
    const { toast } = useToast();
    // Current state from DB
    const geofencingEnabled = settings['geofencing_enabled']?.value === 'true';
    const registrationRestricted = settings['restrict_registration_to_brgy_176']?.value === 'true';

    const { data, setData, processing } = useForm({
        key: 'geofencing_enabled',
        value: geofencingEnabled ? 'true' : 'false',
    });

    const handleToggle = (checked: boolean) => {
        const newValue = checked ? 'true' : 'false';
        setData('value', newValue);
        
        // Immediately submit on toggle using router to ensure correct payload
        router.patch('/system-settings', {
            key: 'geofencing_enabled',
            value: newValue
        }, {
            preserveScroll: true,
            onSuccess: () => {
                toast({
                    title: "Success",
                    description: checked ? 'Geofencing Enabled' : 'Geofencing Disabled',
                });
            },
            onError: () => {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: 'Failed to update setting',
                });
                // Revert state if failed
                setData('value', !checked ? 'true' : 'false');
            }
        });
    };

    const handleRegistrationToggle = (checked: boolean) => {
        const newValue = checked ? 'true' : 'false';
        
        router.patch('/system-settings', {
            key: 'restrict_registration_to_brgy_176',
            value: newValue
        }, {
            preserveScroll: true,
            onSuccess: () => {
                toast({
                    title: "Success",
                    description: checked 
                        ? 'Registration restricted to Barangay 176 only' 
                        : 'Registration opened to all areas',
                });
            },
            onError: () => {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: 'Failed to update registration restriction',
                });
            }
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="System Settings" />
            <div className="p-4 max-w-2xl mx-auto space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Global Configuration</CardTitle>
                        <CardDescription>Manage system-wide settings and restrictions.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        
                        {/* Geofencing Toggle */}
                        <div className="flex items-center justify-between space-x-4">
                            <div className="flex-1 space-y-1">
                                <Label htmlFor="geofencing" className="text-base font-medium">
                                    Geofencing Restriction
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Restrict concern submissions to Barangay 176 E boundary only.
                                    Disable this for demonstrations outside the area.
                                </p>
                            </div>
                            <Switch
                                id="geofencing"
                                checked={data.value === 'true'}
                                onCheckedChange={handleToggle}
                                disabled={processing}
                            />
                        </div>

                        {/* Registration Restriction Toggle */}
                        <div className="flex items-center justify-between space-x-4">
                            <div className="flex-1 space-y-1">
                                <Label htmlFor="registration" className="text-base font-medium">
                                    Registration Restriction
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Restrict user registration to Barangay 176 residents only (addresses starting with PH9).
                                    Disable this to allow registrations from all areas.
                                </p>
                            </div>
                            <Switch
                                id="registration"
                                checked={registrationRestricted}
                                onCheckedChange={handleRegistrationToggle}
                                disabled={processing}
                            />
                        </div>

                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
