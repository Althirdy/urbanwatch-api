import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/use-toast';
import { AvailablePunishmentsData, users_T } from '@/types/user-types';
import { router } from '@inertiajs/react';
import { formatDistanceToNow, format, isPast, differenceInDays } from 'date-fns';
import { AlertTriangle, Ban, Calendar, Clock, History, MoveLeft, Shield, ShieldOff, User, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { baseBadgeClasses, getSuspensionBadgeClass, suspensionColors } from '@/lib/badgeStyles';

type SuspensionUsersProps = {
    user: users_T;
    children: React.ReactNode;
};

function SuspensionUser({ user, children }: SuspensionUsersProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<AvailablePunishmentsData | null>(null);
    const [selectedPunishment, setSelectedPunishment] = useState('');
    const [reason, setReason] = useState('');
    const [processing, setProcessing] = useState(false);
    const [liftingProcessing, setLiftingProcessing] = useState(false);

    useEffect(() => {
        if (open) {
            fetchAvailablePunishments();
        }
    }, [open]);

    const fetchAvailablePunishments = async () => {
        try {
            setLoading(true);
            const response = await fetch(
                `/user/${user.id}/available-punishments`,
            );
            const result = await response.json();
            setData(result);
        } catch (error) {
            console.error('Failed to fetch available punishments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSuspend = () => {
        if (!selectedPunishment) {
            return;
        }

        setProcessing(true);

        router.post(
            `/user/${user.id}/suspend`,
            {
                punishment_type: selectedPunishment,
                reason: reason || null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast({
                        title: 'Success',
                        description: 'User suspension applied successfully.',
                    });
                    setOpen(false);
                    setSelectedPunishment('');
                    setReason('');
                },
                onError: (errors) => {
                    toast({
                        title: 'Error',
                        description: errors?.error || 'Failed to apply suspension. Please try again.',
                        variant: 'destructive',
                    });
                },
                onFinish: () => {
                    setProcessing(false);
                },
            },
        );
    };

    const handleLiftSuspension = () => {
        setLiftingProcessing(true);

        router.patch(
            `/user/${user.id}/revoke-suspension`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast({
                        title: 'Success',
                        description: 'Suspension lifted successfully. User has been restored.',
                    });
                    setOpen(false);
                },
                onError: (errors) => {
                    toast({
                        title: 'Error',
                        description: errors?.error || 'Failed to lift suspension. Please try again.',
                        variant: 'destructive',
                    });
                },
                onFinish: () => {
                    setLiftingProcessing(false);
                },
            },
        );
    };

    const getUserFullName = (user: users_T) => {
        if (user.official_details) {
            return `${user.official_details.first_name} ${user.official_details.middle_name ? user.official_details.middle_name + ' ' : ''}${user.official_details.last_name}`;
        } else if (user.citizen_details) {
            return `${user.citizen_details.first_name} ${user.citizen_details.middle_name ? user.citizen_details.middle_name + ' ' : ''}${user.citizen_details.last_name}`;
        }
        return user.name;
    };

    const getPunishmentBadgeClass = (status: string, isActive: boolean) => {
        if (isActive) return 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50';
        if (status === 'expired') return 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700';
        if (status === 'revoked') return 'bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:hover:bg-orange-900/50';
        return 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50';
    };

    const formatFullPunishmentType = (type: string): string => {
        const formats: Record<string, string> = {
            warning_1: 'Warning 1 - 3 days',
            warning_2: 'Warning 2 - 7 days',
            suspension: 'Permanent Suspension',
        };
        return formats[type] || type;
    };

    const formatSummaryPunishmentType = (type: string): string => {
        const formats: Record<string, string> = {
            warning_1: 'Warning 1 ',
            warning_2: 'Warning 2 ',
            suspension: 'Permanent Suspension',
        };
        return formats[type] || type;
    };

    const formatRelativeTime = (dateString: string) => {
        const date = new Date(dateString);
        if (isPast(date)) {
            return `Expired ${formatDistanceToNow(date, { addSuffix: false })} ago`;
        }
        return `Expires ${formatDistanceToNow(date, { addSuffix: true })}`;
    };

    const getExpiryStatus = (expiresAt: string | null) => {
        if (!expiresAt) return { text: 'Permanent', className: 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400' };
        const date = new Date(expiresAt);
        const daysLeft = differenceInDays(date, new Date());
        if (isPast(date)) {
            return { text: 'Expired', className: 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400' };
        }
        if (daysLeft <= 1) {
            return { text: `${daysLeft} day left`, className: 'bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-400' };
        }
        return { text: `${daysLeft} days left`, className: 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400' };
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-h-[90vh] max-w-none overflow-y-auto sm:max-w-xl">
                {/* X Close Button */}
                <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                </DialogClose>

                <DialogHeader className="border-b pb-4 dark:border-zinc-800">
                    <DialogTitle className="flex flex-row items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                            <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <span className="text-lg font-semibold">
                                {data?.is_suspended ? 'Upgrade Suspension' : 'Suspend User'}
                            </span>
                            <p className="text-sm font-normal text-muted-foreground">
                                Manage suspension for this citizen
                            </p>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                {/* User Info Card */}
                <div className="flex items-center gap-3 rounded-lg border  p-3 ">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-800">
                        <User className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
                    </div>
                    <div>
                        <p className="font-semibold text-foreground">{getUserFullName(user)}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-12">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                        <p className="text-sm text-muted-foreground">Loading suspension data...</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Active Suspension Alert */}
                        {data?.is_suspended && data.active_suspension && (
                            <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/30">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50">
                                        <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-semibold text-red-800 dark:text-red-300">Currently Suspended</h4>
                                            <Badge className="text-[10px] font-medium bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400">Active</Badge>
                                        </div>
                                        <div className="mt-2 space-y-1 text-sm">
                                            <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                                                <span className="font-medium">Type:</span>
                                                <span>{formatFullPunishmentType(data.active_suspension.type)}</span>
                                            </div>
                                            {data.active_suspension.expires_at && (
                                                <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    <span>{formatRelativeTime(data.active_suspension.expires_at)}</span>
                                                    <span className="text-xs text-red-600/70 dark:text-red-400/70">
                                                        ({format(new Date(data.active_suspension.expires_at), 'MMM d, yyyy')})
                                                    </span>
                                                </div>
                                            )}
                                            {!data.active_suspension.expires_at && (
                                                <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    <span className="font-medium">Permanent ban</span>
                                                </div>
                                            )}
                                        </div>
                                        {data.active_suspension.reason && (
                                            <p className="mt-2 text-xs text-red-600/80 dark:text-red-400/80">
                                                <span className="font-medium">Reason:</span> {data.active_suspension.reason}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Current Suspension - shown separately from history */}
                        {data?.is_suspended && data.active_suspension && (() => {
                            const currentSuspension = data.suspension_history?.find(s => s.is_active);
                            if (!currentSuspension) return null;
                            const expiryStatus = getExpiryStatus(currentSuspension.expires_at);
                            return (
                                <div className="rounded-lg border-2 border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30">
                                    <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-100/50 px-4 py-2.5 dark:border-amber-800 dark:bg-amber-900/30">
                                        <Shield className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                        <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-300">Current Suspension</h4>
                                        <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
                                    </div>
                                    <div className="p-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <Badge className={`text-[10px] font-medium ${getPunishmentBadgeClass(currentSuspension.status, true)}`}>
                                                {formatSummaryPunishmentType(currentSuspension.punishment_type)}
                                            </Badge>
                                            <Badge className={`text-[10px] font-medium ${expiryStatus.className}`}>
                                                {expiryStatus.text}
                                            </Badge>
                                        </div>
                                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-amber-700 dark:text-amber-400">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="h-3 w-3" />
                                                <span>Started: {format(new Date(currentSuspension.suspended_at), 'MMM d, yyyy')}</span>
                                            </div>
                                            {currentSuspension.expires_at && (
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="h-3 w-3" />
                                                    <span>Ends: {format(new Date(currentSuspension.expires_at), 'MMM d, yyyy')}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-500">
                                            <User className="h-3 w-3" />
                                            <span>By: {currentSuspension.suspended_by}</span>
                                        </div>
                                        {currentSuspension.reason && (
                                            <p className="mt-1.5 text-xs text-amber-600/80 dark:text-amber-400/80 italic">
                                                "{currentSuspension.reason}"
                                            </p>
                                        )}
                                        {/* Lift Suspension Button */}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="mt-3 w-full gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-100 hover:text-amber-800 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-900/50"
                                            onClick={handleLiftSuspension}
                                            disabled={liftingProcessing}
                                        >
                                            <ShieldOff className="h-4 w-4" />
                                            {liftingProcessing ? 'Lifting...' : 'Lift Suspension'}
                                        </Button>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Past Suspension History - excludes current active suspension */}
                        {data?.suspension_history && data.suspension_history.filter(s => !s.is_active).length > 0 && (
                            <div className="rounded-lg border dark:border-zinc-800">
                                <div className="flex items-center gap-2 border-b bg-zinc-50 px-4 py-2.5 dark:border-zinc-800 dark:bg-zinc-900/50">
                                    <History className="h-4 w-4 text-muted-foreground" />
                                    <h4 className="text-sm font-semibold">Past Suspensions</h4>
                                    <Badge className="ml-auto text-[10px] font-medium bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400">
                                        {data.suspension_history.filter(s => !s.is_active).length} record{data.suspension_history.filter(s => !s.is_active).length > 1 ? 's' : ''}
                                    </Badge>
                                </div>
                                <div className="max-h-40 divide-y overflow-y-auto dark:divide-zinc-800">
                                    {data.suspension_history.filter(s => !s.is_active).map((suspension) => {
                                        const expiryStatus = getExpiryStatus(suspension.expires_at);
                                        return (
                                            <div key={suspension.id} className="p-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/30">
                                                <div className="flex items-start justify-between gap-2">
                                                    <Badge
                                                        className={`text-[10px] font-medium ${getPunishmentBadgeClass(suspension.status, false)}`}
                                                    >
                                                        {formatSummaryPunishmentType(suspension.punishment_type)}
                                                    </Badge>
                                                    <Badge className={`text-[10px] font-medium ${expiryStatus.className}`}>
                                                        {expiryStatus.text}
                                                    </Badge>
                                                </div>
                                                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                                    <div className="flex items-center gap-1.5">
                                                        <Calendar className="h-3 w-3" />
                                                        <span>Started: {format(new Date(suspension.suspended_at), 'MMM d, yyyy')}</span>
                                                    </div>
                                                    {suspension.expires_at && (
                                                        <div className="flex items-center gap-1.5">
                                                            <Clock className="h-3 w-3" />
                                                            <span>Ends: {format(new Date(suspension.expires_at), 'MMM d, yyyy')}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                                                    <User className="h-3 w-3" />
                                                    <span>By: {suspension.suspended_by}</span>
                                                </div>
                                                {suspension.reason && (
                                                    <p className="mt-1.5 text-xs text-muted-foreground/80 italic">
                                                        "{suspension.reason}"
                                                    </p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Available Punishments */}
                        {data?.available_punishments && data.available_punishments.length > 0 ? (
                            <div className="space-y-3">
                                <div className="rounded-lg border ">
                                    <div className="flex items-center gap-2 border-b px-4 py-2.5  ">
                                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                                        <h4 className="text-sm font-semibold">
                                            {data?.is_suspended ? 'Upgrade Punishment' : 'Select Punishment Type'}
                                        </h4>
                                    </div>
                                    <div className="p-3">
                                        <RadioGroup
                                            value={selectedPunishment}
                                            onValueChange={setSelectedPunishment}
                                            className="space-y-2"
                                        >
                                            {data.available_punishments.map((punishment) => (
                                                <div
                                                    key={punishment.type}
                                                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all hover:border hover:border-primary/80  ${selectedPunishment === punishment.type
                                                        ? 'border-primary bg-primary/5'
                                                        : 'dark:border-zinc-800'
                                                        }`}
                                                    onClick={() => setSelectedPunishment(punishment.type)}
                                                >
                                                    <RadioGroupItem value={punishment.type} id={punishment.type} />
                                                    <div className="flex-1">
                                                        <Label htmlFor={punishment.type} className="cursor-pointer">
                                                            <span className="font-semibold">{punishment.label}</span>
                                                            <span className="text-muted-foreground"> - {punishment.description}</span>
                                                        </Label>
                                                    </div>
                                                    {punishment.duration && (
                                                        <Badge className="text-[10px] font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400">
                                                            {punishment.duration} days
                                                        </Badge>
                                                    )}
                                                    {!punishment.duration && (
                                                        <Badge className="text-[10px] font-medium bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400">
                                                            Permanent
                                                        </Badge>
                                                    )}
                                                </div>
                                            ))}
                                        </RadioGroup>
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="reason" className="text-sm font-semibold">
                                        Reason <span className="font-normal text-muted-foreground">(Optional)</span>
                                    </Label>
                                    <Textarea
                                        id="reason"
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        placeholder="Provide a reason for this suspension (e.g., 'Sent fake emergency reports')"
                                        className="mt-2 resize-none"
                                        rows={2}
                                    />
                                </div>
                            </div>
                        ) : !loading && (
                            <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-8 dark:border-zinc-800">
                                <Shield className="h-8 w-8 text-muted-foreground/50" />
                                <p className="text-sm text-muted-foreground">
                                    Maximum punishment level reached
                                </p>
                                <p className="text-xs text-muted-foreground/70">
                                    This user has a permanent suspension
                                </p>
                            </div>
                        )}
                    </div>
                )}

                <DialogFooter className="border-t pt-4 dark:border-zinc-800">
                    <DialogClose asChild>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setSelectedPunishment('');
                                setReason('');
                            }}
                            className="gap-1.5"
                        >
                            <MoveLeft className="h-4 w-4" />
                            Cancel
                        </Button>
                    </DialogClose>
                    <Button
                        onClick={handleSuspend}
                        disabled={
                            !selectedPunishment ||
                            processing ||
                            loading ||
                            !data?.available_punishments?.length
                        }
                        className="gap-1.5 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        <AlertTriangle className="h-4 w-4" />
                        {processing ? 'Applying...' : data?.is_suspended ? 'Upgrade Suspension' : 'Apply Suspension'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default SuspensionUser;
