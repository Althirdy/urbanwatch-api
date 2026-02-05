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
import { Archive, User } from 'lucide-react';
import { useState } from 'react';
import { getRoleColorClass, getStatusColorClass } from '@/lib/badgeStyles';

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
                            <div className="h-fit w-fit rounded-md bg-muted p-2 text-muted-foreground">
                                <User className="h-6 w-6" />
                            </div>
                            <div className="flex flex-1 flex-col min-w-0">
                                <h3 className="text-lg font-bold truncate text-foreground">
                                    {getUserFullName(user)}
                                </h3>
                                <div className="flex items-center gap-2">
                                    <Badge
                                        className={`capitalize ${getRoleColorClass(user.role?.name || 'citizen')}`}
                                    >
                                        {user.role?.name || 'Citizen'}
                                    </Badge>
                                    <Badge
                                        className={getStatusColorClass(user.status || 'inactive')}
                                    >
                                        {user.status || 'Inactive'}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1 border-t border-border pt-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Username:</span>
                                <span className="font-medium text-foreground">{user.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Mobile:</span>
                                <span className="font-medium text-foreground">
                                    {user.official_details?.contact_number || user.citizen_details?.phone_number || 'N/A'}
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
