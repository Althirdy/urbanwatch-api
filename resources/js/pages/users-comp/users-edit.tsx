import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { location_T } from '@/types/location-types';
import { roles_T } from '@/types/role-types';
import { users_T } from '@/types/user-types';
import { useForm } from '@inertiajs/react';
import {
    Info,
    Mail,
    MapPin,
    MoveLeft,
    Phone,
    Save,
    ShieldCheck,
    SquarePen,
    User as UserIcon
} from 'lucide-react';
import { FormEvent } from 'react';

type EditUserProps = {
    user: users_T;
    roles: roles_T[];
    locations: location_T[];
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
};

function EditUser({ user, roles, locations, children }: EditUserProps) {
    const getInitials = (user: users_T) => {
        let firstName = '';
        let lastName = '';

        if (user.official_details) {
            firstName = user.official_details.first_name;
            lastName = user.official_details.last_name;
        } else if (user.citizen_details) {
            firstName = user.citizen_details.first_name;
            lastName = user.citizen_details.last_name;
        } else {
            const nameParts = user.name.split(' ');
            firstName = nameParts[0] || '';
            lastName = nameParts[nameParts.length - 1] || '';
        }

        return (firstName?.charAt(0) || '') + (lastName?.charAt(0) || '');
    };

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
            status: user.status || 'Active',
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
            <DialogContent className="flex max-h-[90vh] max-w-none flex-col overflow-hidden p-0 sm:max-w-2xl border-zinc-800 bg-zinc-950 shadow-2xl" showCloseButton={false}>
                <form onSubmit={handleSubmit} className="flex h-full flex-col overflow-hidden">
                    <TooltipProvider>
                        <DialogHeader className="px-6 pt-6 pb-2 shrink-0 border-b border-zinc-800 bg-zinc-900/50">
                            <div className="flex flex-row items-center gap-4">
                                <Avatar className="h-12 w-12 border-2 border-primary/20 shadow-inner">
                                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-lg font-bold text-primary-foreground uppercase">
                                        {getInitials(user)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="text-left">
                                    <DialogTitle className="text-xl font-bold tracking-tight text-zinc-100 italic">
                                        Edit Account
                                    </DialogTitle>
                                    <p className="text-xs text-zinc-500 font-medium">
                                        {getUserFullName(user)} • <span className="text-primary/70">{user.role?.name}</span>
                                    </p>
                                </div>
                            </div>
                        </DialogHeader>

                        <div className="flex-1 space-y-8 overflow-y-auto px-6 py-6 scrollbar-thin scrollbar-thumb-zinc-800">
                            {/* Personal Information */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
                                    <UserIcon className="h-4 w-4 text-primary" />
                                    <h4 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Personal Details</h4>
                                </div>
                                <div className="grid grid-cols-5 gap-4">
                                    <div className="col-span-3 space-y-2">
                                        <Label htmlFor="first-name" className="text-xs text-zinc-500 ml-1">First Name</Label>
                                        <Input
                                            id="first-name"
                                            value={data.first_name}
                                            onChange={(e) => setData('first_name', e.target.value)}
                                            className="bg-zinc-900 border-zinc-800 focus-visible:ring-primary/50"
                                        />
                                        {errors.first_name && <span className="text-[10px] text-red-500">{errors.first_name}</span>}
                                    </div>
                                    <div className="col-span-2 space-y-2">
                                        <Label htmlFor="middle-name" className="text-xs text-zinc-500 ml-1">Middle Name</Label>
                                        <Input
                                            id="middle-name"
                                            value={data.middle_name}
                                            onChange={(e) => setData('middle_name', e.target.value)}
                                            placeholder="Optional"
                                            className="bg-zinc-900 border-zinc-800 focus-visible:ring-primary/50"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 gap-4">
                                    <div className="col-span-3 space-y-2">
                                        <Label htmlFor="last-name" className="text-xs text-zinc-500 ml-1">Last Name</Label>
                                        <Input
                                            id="last-name"
                                            value={data.last_name}
                                            onChange={(e) => setData('last_name', e.target.value)}
                                            className="bg-zinc-900 border-zinc-800 focus-visible:ring-primary/50"
                                        />
                                        {errors.last_name && <span className="text-[10px] text-red-500">{errors.last_name}</span>}
                                    </div>
                                    <div className="col-span-1 space-y-2">
                                        <Label htmlFor="suffix" className="text-xs text-zinc-500 ml-1">Suffix</Label>
                                        <Input
                                            id="suffix"
                                            value={data.suffix}
                                            onChange={(e) => setData('suffix', e.target.value)}
                                            placeholder="Jr."
                                            className="bg-zinc-900 border-zinc-800 focus-visible:ring-primary/50"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Contact Information */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
                                    <Mail className="h-4 w-4 text-primary" />
                                    <h4 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Communication</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-xs text-zinc-500 ml-1 flex items-center gap-1">
                                            <Mail className="h-3 w-3" /> Email Address
                                        </Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            className="bg-zinc-900 border-zinc-800 focus-visible:ring-primary/50"
                                        />
                                        {errors.email && <span className="text-[10px] text-red-500">{errors.email}</span>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="contact" className="text-xs text-zinc-500 ml-1 flex items-center gap-1">
                                            <Phone className="h-3 w-3" /> Contact Number
                                        </Label>
                                        <div className="relative group flex items-center">
                                            <div className="absolute left-0 top-0 bottom-0 px-3 flex items-center justify-center bg-zinc-800 border-r border-zinc-700 rounded-l-md text-zinc-400 font-bold text-xs pointer-events-none group-focus-within:bg-primary/20 group-focus-within:text-primary transition-colors">
                                                +63
                                            </div>
                                            <Input
                                                id="contact"
                                                value={data.phone_number}
                                                onChange={(e) => handlePhoneChange(e.target.value)}
                                                className="pl-[52px] bg-zinc-900 border-zinc-800 focus-visible:ring-primary/50 font-mono tracking-wider"
                                                placeholder="9123456789"
                                            />
                                        </div>
                                        {errors.phone_number && <span className="text-[10px] text-red-500">{errors.phone_number}</span>}
                                    </div>
                                </div>
                            </div>

                            {/* Role & Configuration */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
                                    <ShieldCheck className="h-4 w-4 text-primary" />
                                    <h4 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">System Role & Scope</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2 relative">
                                        <Label htmlFor="role" className="text-xs text-zinc-500 ml-1">Access Level</Label>
                                        <Select value={data.role_id} onValueChange={(v) => setData('role_id', v)} disabled={isPurokLeader}>
                                            <SelectTrigger className="bg-zinc-900 border-zinc-800 focus:ring-primary/50">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                                                {roles.map((r) => <SelectItem key={r.id} value={r.id.toString()}>{r.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        {isPurokLeader && (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Info className="h-3 w-3 absolute right-10 top-9 text-zinc-500 cursor-help" />
                                                </TooltipTrigger>
                                                <TooltipContent className="bg-zinc-800 border-zinc-700 text-xs max-w-[200px]">
                                                    Purok Leader role is permanent to maintain accountability and location history.
                                                </TooltipContent>
                                            </Tooltip>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="location" className="text-xs text-zinc-500 ml-1 flex items-center gap-1">
                                            <MapPin className="h-3 w-3" /> Assigned Scope
                                        </Label>
                                        <Select value={data.barangay} onValueChange={(v) => { setData('barangay', v); setData('assigned_brgy', v); }}>
                                            <SelectTrigger className="bg-zinc-900 border-zinc-800 focus:ring-primary/50">
                                                <SelectValue placeholder="Select location" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                                                {locations.map((l) => <SelectItem key={l.id} value={l.location_name}>{l.location_name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Status Toggle */}
                                {user.role?.name?.toLowerCase() !== 'citizen' && (
                                    <div className="space-y-2 pt-2">
                                        <Label className="text-xs text-zinc-500 ml-1">Account Visibility Status</Label>
                                        <Select value={data.status} onValueChange={(v) => setData('status', v)}>
                                            <SelectTrigger className="bg-zinc-900 border-zinc-800 focus:ring-primary/50">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                                                <SelectItem value="Active">Active</SelectItem>
                                                <SelectItem value="Inactive">Inactive</SelectItem>
                                                <SelectItem value="Archived">Archived</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>
                        </div>

                        <DialogFooter className="px-6 py-4 border-t border-zinc-800 bg-zinc-900/50">
                            <div className="flex w-full gap-3">
                                <DialogClose asChild>
                                    <Button type="button" variant="ghost" className="flex-1 border-zinc-800 hover:bg-zinc-800 text-zinc-400">
                                        <MoveLeft className="mr-2 h-4 w-4" /> Cancel
                                    </Button>
                                </DialogClose>
                                <Button type="submit" disabled={processing} className="flex-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/10 transition-all active:scale-[0.98]">
                                    {processing ? <Spinner className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                                    {processing ? 'Processing...' : 'Sync Changes'}
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
