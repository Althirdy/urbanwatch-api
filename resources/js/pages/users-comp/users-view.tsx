import { TextField } from '@/components/text-field';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
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

import {
    getInitials,
    getUserBarangay,
    getUserFullName,
    getUserPhoneNumber,
} from '@/lib/user-utils';
import { users_T } from '@/types/user-types';

type ViewUserProps = {
    user: users_T;
    children: React.ReactNode;
};

function ViewUser({ user, children }: ViewUserProps) {
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
                            <TextField
                                id="email"
                                label="Email"
                                type="email"
                                value={user.email}
                                onChange={() => {}}
                                placeholder="Enter email address"
                                readOnly
                            />
                            <TextField
                                id="contact"
                                label="Contact Number"
                                value={getUserPhoneNumber(user)}
                                onChange={() => {}}
                                placeholder="Enter contact number"
                                readOnly
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <div className="grid">
                                <p className="text-sm font-medium text-[var(--gray)]">
                                    Role & Location
                                </p>
                            </div>
                            <div className="flex w-full flex-row gap-4">
                                <div className="grid flex-1 gap-4">
                                    <TextField
                                        id="role"
                                        label="Role"
                                        value={
                                            user.role ? user.role.name : 'N/A'
                                        }
                                        onChange={() => {}}
                                        placeholder="Enter role"
                                        readOnly
                                    />
                                </div>
                                <div className="grid flex-1 gap-4">
                                    <TextField
                                        id="barangay"
                                        label="Assigned Barangay"
                                        value={getUserBarangay(user)}
                                        onChange={() => {}}
                                        placeholder="Enter barangay"
                                        readOnly
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <SheetFooter className="flex w-full flex-col items-end justify-end px-4">
                    <SheetClose asChild>
                        <Button
                            variant="outline"
                            className="w-1/4 cursor-pointer py-4"
                        >
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
