import { Spinner } from '@/components/ui/spinner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import PurokSelectorMap from '@/components/purok-selector-map';
import { location_T } from '@/types/location-types';
import { roles_T } from '@/types/role-types';
import { users_T } from '@/types/user-types';
import { useForm } from '@inertiajs/react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Info, MoveLeft, Save, SquarePen } from 'lucide-react';
import { FormEvent } from 'react';

type EditUserProps = {
    user: users_T;
    roles: roles_T[];
    locations: location_T[];
    puroks?: any[];
    children?: React.ReactNode;
};

type EditUserForm = {
    first_name: string;
    middle_name: string;
    last_name: string;
    suffix: string;
    email: string;
    phone_number: string;
    role_id: string;
    status: string;
    // For citizens
    date_of_birth: string;
    address: string;
    barangay: string;
    city: string;
    province: string;
    postal_code: string;
    is_verified: boolean;
    // For officials
    office_address: string;
    assigned_brgy: string;
    latitude: string;
    longitude: string;
    purok_id: string;
};

function EditUser({ user, roles, locations, puroks = [], children }: EditUserProps) {
    const getUserFullName = (user: users_T) => {
        if (user.official_details) {
            return `${user.official_details.first_name} ${user.official_details.middle_name ? user.official_details.middle_name + ' ' : ''}${user.official_details.last_name}`;
        } else if (user.citizen_details) {
            return `${user.citizen_details.first_name} ${user.citizen_details.middle_name ? user.citizen_details.middle_name + ' ' : ''}${user.citizen_details.last_name}`;
        }
        return user.name;
    };

    const { data, setData, put, processing, errors, reset, transform } =
        useForm<EditUserForm>({
            first_name: user.official_details?.first_name || user.citizen_details?.first_name || '',
            middle_name: user.official_details?.middle_name || user.citizen_details?.middle_name || '',
            last_name: user.official_details?.last_name || user.citizen_details?.last_name || '',
            suffix: user.official_details?.suffix || user.citizen_details?.suffix || '',
            email: user.email || '',
            phone_number: (user.official_details?.contact_number || user.citizen_details?.phone_number || '').replace(/^\+63|^63|^0/, ''),
            role_id: user.role?.id?.toString() || '',
            status: user.official_details?.status || user.citizen_details?.status || 'active',
            date_of_birth: user.citizen_details?.date_of_birth || '',
            address: user.citizen_details?.address || '',
            barangay: user.official_details?.assigned_brgy || user.citizen_details?.barangay || '',
            city: user.citizen_details?.city || '',
            province: user.citizen_details?.province || '',
            postal_code: user.citizen_details?.postal_code || '',
            is_verified: user.citizen_details?.is_verified || false,
            office_address: user.official_details?.office_address || '',
            assigned_brgy: user.official_details?.assigned_brgy || '',
            latitude: user.official_details?.latitude || '',
            longitude: user.official_details?.longitude || '',
            purok_id: user.official_details?.purok_id?.toString() || '',
        });

    const isPurokLeader = user.role?.name?.toLowerCase() === 'purok leader';

    const handlePhoneChange = (value: string) => {
        let val = value.replace(/\D/g, '');
        if (val.startsWith('0')) val = val.substring(1);
        if (val.length > 10) val = val.substring(0, 10);
        setData('phone_number', val);
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        transform((data) => ({
            ...data,
            phone_number: `+63${data.phone_number}`,
        }));
        put(`/user/${user.id}`, {
            onSuccess: () => {
                const closeButton = document.querySelector('[data-dialog-close]') as HTMLButtonElement;
                if (closeButton) closeButton.click();
            },
            preserveScroll: true,
        });
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                {children || (
                    <div className="cursor-pointer rounded-full p-2 hover:bg-primary/20">
                        <SquarePen size={20} />
                    </div>
                )}
            </DialogTrigger>
            <DialogContent className="flex max-h-[90vh] max-w-none flex-col overflow-hidden p-0 sm:max-w-2xl" showCloseButton={false}>
                <form onSubmit={handleSubmit} className="flex h-full flex-col overflow-hidden">
                    <TooltipProvider>
                        <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4">
                            <DialogTitle>Edit User</DialogTitle>
                            <DialogDescription>
                                Update {getUserFullName(user)}'s account information ({user.role?.name}).
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-2">
                            {/* Personal Information */}
                            <div className="grid flex-1 auto-rows-min gap-4">
                                <div className="grid pb-2">
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Personal Information
                                    </p>
                                </div>
                                <div className="grid grid-cols-5 gap-4">
                                    <div className="col-span-3 grid gap-2">
                                        <Label htmlFor="first-name">First Name</Label>
                                        <div className="relative">
                                            <Input
                                                id="first-name"
                                                value={data.first_name}
                                                onChange={(e) => setData('first_name', e.target.value)}
                                                placeholder="Enter first name"
                                                className={errors.first_name ? 'border-red-500 focus:ring-red-500' : ''}
                                            />
                                            {errors.first_name && <span className="absolute -bottom-5 left-0 text-xs text-red-500">{errors.first_name}</span>}
                                        </div>
                                    </div>
                                    <div className="col-span-2 grid gap-2">
                                        <Label htmlFor="middle-name">Middle Name</Label>
                                        <Input
                                            id="middle-name"
                                            value={data.middle_name}
                                            onChange={(e) => setData('middle_name', e.target.value)}
                                            placeholder="Enter middle name (optional)"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 gap-4">
                                    <div className="col-span-3 grid gap-2">
                                        <Label htmlFor="last-name">Last Name</Label>
                                        <div className="relative">
                                            <Input
                                                id="last-name"
                                                value={data.last_name}
                                                onChange={(e) => setData('last_name', e.target.value)}
                                                placeholder="Enter last name"
                                                className={errors.last_name ? 'border-red-500 focus:ring-red-500' : ''}
                                            />
                                            {errors.last_name && <span className="absolute -bottom-5 left-0 text-xs text-red-500">{errors.last_name}</span>}
                                        </div>
                                    </div>
                                    <div className="col-span-1 grid gap-2">
                                        <Label htmlFor="suffix">Suffix (Optional)</Label>
                                        <Input
                                            id="suffix"
                                            value={data.suffix}
                                            onChange={(e) => setData('suffix', e.target.value)}
                                            placeholder="Jr., Sr., III, etc."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Contact Information */}
                            <div className="grid flex-1 auto-rows-min gap-2">
                                <div className="grid">
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Contact Information
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="email">Email</Label>
                                        <div>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={data.email}
                                                onChange={(e) => setData('email', e.target.value)}
                                                className={errors.email ? 'border-red-500 focus:ring-red-500' : ''}
                                            />
                                            {errors.email && <span className="mt-1 block text-xs text-red-500">{errors.email}</span>}
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="contact">Phone Number</Label>
                                        <div>
                                            <Input
                                                id="contact"
                                                value={data.phone_number}
                                                onChange={(e) => handlePhoneChange(e.target.value)}
                                                placeholder="9123456789"
                                                className={errors.phone_number ? 'border-red-500 focus:ring-red-500' : ''}
                                            />
                                            {errors.phone_number && <span className="mt-1 block text-xs text-red-500">{errors.phone_number}</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Role & Configuration */}
                            <div className="grid flex-1 auto-rows-min gap-2">
                                <div className="grid">
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Role & Location
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid flex-1 gap-2 relative">
                                        <Label htmlFor="role">Role</Label>
                                        <div>
                                            <Select value={data.role_id} onValueChange={(v) => setData('role_id', v)} disabled={isPurokLeader}>
                                                <SelectTrigger className={isPurokLeader ? 'bg-muted' : ''}>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {roles.map((r) => <SelectItem key={r.id} value={r.id.toString()}>{r.name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        {isPurokLeader && (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Info className="h-3 w-3 absolute right-10 top-9 text-muted-foreground cursor-help" />
                                                </TooltipTrigger>
                                                <TooltipContent className="text-xs max-w-[200px]">
                                                    Purok Leader role is permanent to maintain accountability and location history.
                                                </TooltipContent>
                                            </Tooltip>
                                        )}
                                    </div>
                                    <div className="grid flex-1 gap-2">
                                        <Label htmlFor="location">Location / Assignment</Label>
                                        <div>
                                            {isPurokLeader ? (
                                                <Input
                                                    value={data.assigned_brgy || "Select from map below"}
                                                    readOnly
                                                    className="bg-muted"
                                                    placeholder="Select a territory below"
                                                />
                                            ) : (
                                                <Select value={data.barangay} onValueChange={(v) => { setData('barangay', v); setData('assigned_brgy', v); }}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select location" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {locations.map((l) => <SelectItem key={l.id} value={l.location_name}>{l.location_name}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Map Selector for Purok Leaders Re-assignment */}
                            {isPurokLeader && (
                                <div className="grid flex-1 auto-rows-min gap-2">
                                    <Label>Select Territory (Purok)</Label>
                                    <div className="rounded-md border p-1">
                                        <PurokSelectorMap
                                            puroks={puroks}
                                            selectedPurokId={data.purok_id ? parseInt(data.purok_id) : null}
                                            onSelectPurok={(id, name) => {
                                                setData(prev => ({
                                                    ...prev,
                                                    purok_id: id.toString(),
                                                    assigned_brgy: name,
                                                    barangay: name // Keep both in sync for consistency
                                                }));
                                            }}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Green areas are available. Gray areas are already occupied.
                                    </p>
                                </div>
                            )}

                            {/* Status Toggle */}
                            {user.role?.name?.toLowerCase() !== 'citizen' && (
                                <div className="grid flex-1 auto-rows-min gap-2">
                                    <div className="grid">
                                        <p className="text-sm font-medium text-muted-foreground">
                                            Account Status
                                        </p>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="status">Status</Label>
                                        <Select value={data.status} onValueChange={(v) => setData('status', v)}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Active">Active</SelectItem>
                                                <SelectItem value="Inactive">Inactive</SelectItem>
                                                <SelectItem value="Archived">Archived</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            )}
                        </div>

                        <DialogFooter className="flex-shrink-0 bg-background px-6 py-4">
                            <div className="flex w-full gap-2">
                                <DialogClose asChild>
                                    <Button type="button" variant="outline" data-dialog-close className="flex-1">
                                        <MoveLeft className="inline h-4 w-4" />
                                        Close
                                    </Button>
                                </DialogClose>
                                <Button type="submit" disabled={processing} className="flex-2">
                                    {processing ? <Spinner className="inline h-4 w-4" /> : <Save className="inline h-4 w-4" />}
                                    {processing ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        </DialogFooter>
                    </TooltipProvider>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default EditUser;
