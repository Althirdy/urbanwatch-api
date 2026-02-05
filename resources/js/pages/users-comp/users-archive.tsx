import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { users_T } from '@/types/user-types';
import { useForm } from '@inertiajs/react';
import { Archive, User, MapPin, Mail } from 'lucide-react';
import { useState } from 'react';
import { baseBadgeClasses, getRoleColorClass, getStatusColorClass } from '@/lib/badgeStyles';

type ArchiveUserProps = {
    user: users_T;
    children: React.ReactNode;
};

function ArchiveUser({ user, children }: ArchiveUserProps) {
    const [confirmText, setConfirmText] = useState('');
    const { patch, processing } = useForm();

    const handleArchive = () => {
        if (confirmText !== getUserFullName(user)) {
            return;
        }

        patch(`/user/${user.id}/archive`, {
            preserveScroll: true,
            onSuccess: () => {
                setConfirmText('');
            },
        });
    };

    const getUserFullName = (user: users_T) => {
        if (user.official_details) {
            return `${user.official_details.first_name} ${user.official_details.middle_name ? user.official_details.middle_name + ' ' : ''}${user.official_details.last_name}`;
        } else if (user.citizen_details) {
            return `${user.citizen_details.first_name} ${user.citizen_details.middle_name ? user.citizen_details.middle_name + ' ' : ''}${user.citizen_details.last_name}`;
        }
        return user.name;
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
            <AlertDialogContent className="sm:max-w-md">
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-muted-foreground">
                        <Archive className="h-6 w-6" />
                        Archive User
                    </AlertDialogTitle>
                    <AlertDialogDescription className="mt-2 text-foreground/90">
                        Are you sure you want to archive this user? This
                        action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="space-y-4">
                    {/* User info card */}
                    <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
                        <div className="flex items-center gap-3">

                            <div className="flex flex-col gap-2">
                                <h3 className="text-lg font-semibold truncate text-foreground">
                                    {getUserFullName(user)}
                                </h3>
                                <div className="flex gap-2 items-center">
                                    <Badge
                                        variant="outline"
                                        className={`${baseBadgeClasses} ${getRoleColorClass(user.role?.name || '')}`}
                                    >
                                        {user.role?.name || 'N/A'}
                                    </Badge>
                                    {user.role?.name?.toLowerCase() !== 'citizen' && (
                                        <Badge
                                            variant="outline"
                                            className={`shrink-0 ${baseBadgeClasses} capitalize ${getStatusColorClass(user.official_details?.status || user.citizen_details?.status || 'inactive')}`}
                                        >
                                            {user.official_details?.status || user.citizen_details?.status}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* User Info */}
                        <div className="space-y-0 flex flex-col">
                            {/* Location */}
                            <div className="flex items-center gap-2 p-2 ">
                                <MapPin className="h-4 w-auto text-muted-foreground shrink-0" />
                                <span className="truncate text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                                    {user.official_details?.purok?.name
                                        ? `Purok: ${user.official_details.purok.name}`
                                        : user.citizen_details?.barangay || user.official_details?.assigned_brgy || 'N/A'}
                                </span>
                            </div>

                            {/* Email */}
                            <div className="flex items-center gap-2 p-2 ">
                                <Mail className="h-4 w-auto text-muted-foreground shrink-0" />
                                <span className="truncate text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                                    {user.email}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 py-2">
                        <Label
                            htmlFor="archive-user"
                            className="text-sm text-muted-foreground"
                        >
                            To confirm archiving, type{' '}
                            <span className="font-bold text-destructive">
                                "{getUserFullName(user)}"
                            </span>{' '}
                            below:
                        </Label>
                        <div className="relative">
                            <Input
                                id="archive-user"
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value)}
                                placeholder="Enter full name to confirm"
                                className={
                                    confirmText &&
                                        confirmText !== getUserFullName(user)
                                        ? 'border-destructive'
                                        : ''
                                }
                            />
                            {confirmText &&
                                confirmText !== getUserFullName(user) && (
                                    <span className="absolute -bottom-5 left-0 text-[10px] text-destructive">
                                        Name must match exactly
                                    </span>
                                )}
                        </div>
                    </div>
                </div>

                <AlertDialogFooter className="gap-2 pt-2">
                    <AlertDialogCancel
                        className="cursor-pointer"
                        onClick={() => setConfirmText('')}
                    >
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleArchive}
                        disabled={
                            confirmText !== getUserFullName(user) || processing
                        }
                        className="cursor-pointer bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {processing ? 'Archiving...' : 'Archive User'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export default ArchiveUser;
