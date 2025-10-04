import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { MoveLeft } from 'lucide-react';

import { users_T } from '@/types/user-types';

type ViewUserProps = {
    user: users_T;
    children: React.ReactNode;
};

function ViewUser({ user, children }: ViewUserProps) {
    // Function to generate initials from user's name
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
            // Fallback to name splitting
            const nameParts = user.name.split(' ');
            firstName = nameParts[0] || '';
            lastName = nameParts[nameParts.length - 1] || '';
        }

        const firstInitial = firstName?.charAt(0)?.toUpperCase() || '';
        const lastInitial = lastName?.charAt(0)?.toUpperCase() || '';
        return firstInitial + lastInitial;
    };

    const getUserFullName = (user: users_T) => {
        if (user.official_details) {
            return `${user.official_details.first_name} ${user.official_details.middle_name ? user.official_details.middle_name + ' ' : ''}${user.official_details.last_name}`;
        } else if (user.citizen_details) {
            return `${user.citizen_details.first_name} ${user.citizen_details.middle_name ? user.citizen_details.middle_name + ' ' : ''}${user.citizen_details.last_name}`;
        }
        return user.name;
    };

    const getUserPhoneNumber = (user: users_T) => {
        if (user.official_details) {
            return user.official_details.contact_number || 'N/A';
        } else if (user.citizen_details) {
            return user.citizen_details.phone_number || 'N/A';
        }
        return 'N/A';
    };

    const getUserBarangay = (user: users_T) => {
        if (user.official_details) {
            return user.official_details.assigned_brgy || 'N/A';
        } else if (user.citizen_details) {
            return user.citizen_details.barangay || 'N/A';
        }
        return 'N/A';
    };

    return (
        <Sheet>
            <SheetTrigger asChild>{children}</SheetTrigger>
            <SheetContent className="max-w-none overflow-y-auto p-2 sm:max-w-lg [&>button]:hidden">
                <SheetHeader>
                    <SheetTitle>User Details</SheetTitle>
                    <SheetDescription>
                        View detailed information about this user account.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex w-full flex-col justify-start gap-10 px-4 py-2">
                    {/* Basic Information */}
                    <div className="flex flex-row items-center gap-4">
                        <Avatar className="h-16 w-16">
                            <AvatarFallback className="bg-primary text-2xl font-semibold text-primary-foreground">
                                {getInitials(user)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="text-left">
                            <h3 className="text-xl font-semibold">
                                {getUserFullName(user)}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                {user.email}
                            </p>
                        </div>
                    </div>
                    {/* Contact Information & Role */}
                    <div className="flex w-full flex-col gap-6">
                        <div className="flex flex-col gap-4">
                            <div className="grid">
                                <p className="text-sm font-medium text-[var(--gray)]">
                                    Contact Information
                                </p>
                            </div>
                            <div className="grid gap-4">
                                <Label htmlFor="email">Email</Label>
                                <div className="relative">
                                    <Input
                                        id="email"
                                        type="email"
                                        value={user.email}
                                        readOnly
                                        tabIndex={-1}
                                        placeholder="Enter email address"
                                        className="cursor-not-allowed border-none bg-muted select-none focus:ring-0 focus:ring-offset-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
                                    />
                                </div>
                            </div>
                            <div className="grid gap-4">
                                <Label htmlFor="contact">Contact Number</Label>
                                <div className="relative">
                                    <Input
                                        id="contact"
                                        type="tel"
                                        value={getUserPhoneNumber(user)}
                                        readOnly
                                        tabIndex={-1}
                                        placeholder="Enter contact number"
                                        className="cursor-not-allowed border-none bg-muted select-none focus:ring-0 focus:ring-offset-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <div className="grid">
                                <p className="text-sm font-medium text-[var(--gray)]">
                                    Role & Location
                                </p>
                            </div>
                            <div className="flex w-full flex-row gap-4">
                                <div className="grid flex-1 gap-4">
                                    <Label htmlFor="role">Role</Label>
                                    <div className="relative">
                                        <Input
                                            id="role"
                                            type="role"
                                            value={
                                                user.role
                                                    ? user.role.name
                                                    : 'N/A'
                                            }
                                            readOnly
                                            tabIndex={-1}
                                            placeholder="Enter role address"
                                            className="cursor-not-allowed border-none bg-muted select-none focus:ring-0 focus:ring-offset-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="grid flex-1 gap-4">
                                    <Label htmlFor="contact">
                                        Assigned Barangay
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="contact"
                                            type="tel"
                                            value={getUserBarangay(user)}
                                            readOnly
                                            tabIndex={-1}
                                            placeholder="Enter contact number"
                                            className="cursor-not-allowed border-none bg-muted select-none focus:ring-0 focus:ring-offset-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <SheetFooter className="px-4">
                    <SheetClose asChild>
                        <Button variant="outline">
                            <MoveLeft className="mr-2 h-6 w-6" />
                            Return
                        </Button>
                    </SheetClose>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}

export default ViewUser;
