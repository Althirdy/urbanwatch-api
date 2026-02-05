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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/use-toast';
import { users_T } from '@/types/user-types';
import { router } from '@inertiajs/react';
import { format } from 'date-fns';
import { AlertTriangle, Calendar, Clock, Eye, EyeOff, History, Key, Lock, Mail, MapPin, MoveLeft, Phone, Shield, User, X } from 'lucide-react';
import { useEffect, useState } from 'react';

type OperatorDetailsProps = {
    user: users_T;
    children: React.ReactNode;
};

type PasswordLog = {
    id: number;
    action: string;
    reason: string | null;
    changed_by: string;
    changed_at: string;
    changed_at_human: string;
    ip_address: string | null;
};

type OperatorData = {
    user: {
        id: number;
        name: string;
        email: string;
        role: string;
        created_at: string;
        official_details: {
            first_name: string;
            middle_name: string;
            last_name: string;
            contact_number: string;
            office_address: string;
            assigned_brgy: string;
            status: string;
        } | null;
    };
    password_logs: PasswordLog[];
};

function OperatorDetails({ user, children }: OperatorDetailsProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<OperatorData | null>(null);
    const [showResetForm, setShowResetForm] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [reason, setReason] = useState('');
    const [processing, setProcessing] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (open) {
            fetchOperatorDetails();
        }
    }, [open]);

    const fetchOperatorDetails = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/user/${user.id}/operator-details`);
            const result = await response.json();
            setData(result);
        } catch (error) {
            console.error('Failed to fetch operator details:', error);
            toast({
                title: 'Error',
                description: 'Failed to load operator details.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = () => {
        if (!newPassword || !confirmPassword) {
            toast({
                title: 'Error',
                description: 'Please fill in all password fields.',
                variant: 'destructive',
            });
            return;
        }

        if (newPassword !== confirmPassword) {
            toast({
                title: 'Error',
                description: 'Passwords do not match.',
                variant: 'destructive',
            });
            return;
        }

        if (newPassword.length < 8) {
            toast({
                title: 'Error',
                description: 'Password must be at least 8 characters long.',
                variant: 'destructive',
            });
            return;
        }

        setProcessing(true);

        router.post(
            `/user/${user.id}/reset-password`,
            {
                new_password: newPassword,
                new_password_confirmation: confirmPassword,
                reason: reason || null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast({
                        title: 'Success',
                        description: 'Password reset successfully.',
                    });
                    setShowResetForm(false);
                    setNewPassword('');
                    setConfirmPassword('');
                    setReason('');
                    fetchOperatorDetails(); // Refresh logs
                },
                onError: (errors) => {
                    toast({
                        title: 'Error',
                        description: errors?.error || 'Failed to reset password.',
                        variant: 'destructive',
                    });
                },
                onFinish: () => {
                    setProcessing(false);
                },
            },
        );
    };

    const getUserFullName = () => {
        if (data?.user.official_details) {
            const d = data.user.official_details;
            return `${d.first_name} ${d.middle_name ? d.middle_name + ' ' : ''}${d.last_name}`;
        }
        return data?.user.name || user.name;
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
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                            <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <span className="text-lg font-semibold">Operator Details</span>
                            <p className="text-sm font-normal text-muted-foreground">
                                View and manage operator account
                            </p>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                {loading ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-12">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                        <p className="text-sm text-muted-foreground">Loading operator details...</p>
                    </div>
                ) : data ? (
                    <div className="space-y-4">
                        {/* Operator Info Card */}
                        <div className="rounded-lg border bg-gradient-to-br from-blue-50 to-indigo-50 p-4 dark:border-zinc-800 dark:from-blue-950/20 dark:to-indigo-950/20">
                            <div className="flex items-start gap-4">
                                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-200 dark:bg-blue-900/50">
                                    <User className="h-7 w-7 text-blue-700 dark:text-blue-300" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-lg font-semibold">{getUserFullName()}</h3>
                                        <Badge className="text-[10px] font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400">
                                            {data.user.role}
                                        </Badge>
                                        {data.user.official_details?.status && (
                                            <Badge className={`text-[10px] font-medium ${data.user.official_details.status === 'active'
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                }`}>
                                                {data.user.official_details.status}
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <Mail className="h-3.5 w-3.5" />
                                            <span>{data.user.email}</span>
                                        </div>
                                        {data.user.official_details?.contact_number && (
                                            <div className="flex items-center gap-2">
                                                <Phone className="h-3.5 w-3.5" />
                                                <span>{data.user.official_details.contact_number}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2">
                                            <MapPin className="h-3.5 w-3.5" />
                                            <span>{data.user.official_details?.assigned_brgy || 'BRGY 176 E'}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-3.5 w-3.5" />
                                            <span>Joined: {data.user.created_at}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Password Reset Section */}
                        <div className="rounded-lg border dark:border-zinc-800">
                            <div className="flex items-center justify-between gap-2 border-b bg-zinc-50 px-4 py-2.5 dark:border-zinc-800 dark:bg-zinc-900/50">
                                <div className="flex items-center gap-2">
                                    <Key className="h-4 w-4 text-amber-500" />
                                    <h4 className="text-sm font-semibold">Password Management</h4>
                                </div>
                                {!showResetForm && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-1.5 text-xs"
                                        onClick={() => setShowResetForm(true)}
                                    >
                                        <Lock className="h-3.5 w-3.5" />
                                        Reset Password
                                    </Button>
                                )}
                            </div>

                            {showResetForm ? (
                                <div className="space-y-4 p-4">
                                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
                                        <div className="flex items-start gap-2">
                                            <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-600 dark:text-amber-400" />
                                            <p className="text-xs text-amber-700 dark:text-amber-400">
                                                This action will be logged. Make sure you have proper authorization to reset this operator's password.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid gap-3">
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="new_password" className="text-xs font-medium">New Password</Label>
                                            <div className="relative">
                                                <Input
                                                    id="new_password"
                                                    type={showPassword ? 'text' : 'password'}
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    placeholder="Enter new password"
                                                    className="pr-10"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                >
                                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="confirm_password" className="text-xs font-medium">Confirm Password</Label>
                                            <Input
                                                id="confirm_password"
                                                type={showPassword ? 'text' : 'password'}
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                placeholder="Confirm new password"
                                            />
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="reason" className="text-xs font-medium">
                                                Reason <span className="font-normal text-muted-foreground">(Required for audit)</span>
                                            </Label>
                                            <Textarea
                                                id="reason"
                                                value={reason}
                                                onChange={(e) => setReason(e.target.value)}
                                                placeholder="e.g., Operator forgot password and requested reset"
                                                className="resize-none"
                                                rows={2}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1"
                                            onClick={() => {
                                                setShowResetForm(false);
                                                setNewPassword('');
                                                setConfirmPassword('');
                                                setReason('');
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            size="sm"
                                            className="flex-1 gap-1.5 bg-amber-600 text-white hover:bg-amber-700"
                                            onClick={handleResetPassword}
                                            disabled={processing || !newPassword || !confirmPassword}
                                        >
                                            <Lock className="h-3.5 w-3.5" />
                                            {processing ? 'Resetting...' : 'Confirm Reset'}
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4">
                                    <p className="text-xs text-muted-foreground">
                                        Use this option to reset the operator's password if they have forgotten it. All password changes are logged for security purposes.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Password Change Logs */}
                        <div className="rounded-lg border dark:border-zinc-800">
                            <div className="flex items-center gap-2 border-b bg-zinc-50 px-4 py-2.5 dark:border-zinc-800 dark:bg-zinc-900/50">
                                <History className="h-4 w-4 text-muted-foreground" />
                                <h4 className="text-sm font-semibold">Password Change History</h4>
                                <Badge className="ml-auto text-[10px] font-medium bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400">
                                    {data.password_logs.length} record{data.password_logs.length !== 1 ? 's' : ''}
                                </Badge>
                            </div>
                            <div className="max-h-48 divide-y overflow-y-auto dark:divide-zinc-800">
                                {data.password_logs.length > 0 ? (
                                    data.password_logs.map((log) => (
                                        <div key={log.id} className="p-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/30">
                                            <div className="flex items-start justify-between gap-2">
                                                <Badge className="text-[10px] font-medium bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400">
                                                    {log.action === 'reset' ? 'Password Reset' : log.action}
                                                </Badge>
                                                <span className="text-[10px] text-muted-foreground">{log.changed_at_human}</span>
                                            </div>
                                            <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                                                <div className="flex items-center gap-1.5">
                                                    <User className="h-3 w-3" />
                                                    <span>By: {log.changed_by}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="h-3 w-3" />
                                                    <span>{log.changed_at}</span>
                                                </div>
                                                {log.ip_address && (
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-mono text-[10px]">IP: {log.ip_address}</span>
                                                    </div>
                                                )}
                                            </div>
                                            {log.reason && (
                                                <p className="mt-1.5 text-xs text-muted-foreground/80 italic">
                                                    "{log.reason}"
                                                </p>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                                        <History className="h-8 w-8 text-muted-foreground/30" />
                                        <p className="text-sm text-muted-foreground">No password changes recorded</p>
                                        <p className="text-xs text-muted-foreground/70">Password change history will appear here</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center gap-2 py-12">
                        <AlertTriangle className="h-8 w-8 text-red-500" />
                        <p className="text-sm text-muted-foreground">Failed to load operator details</p>
                    </div>
                )}

                <DialogFooter className="border-t pt-4 dark:border-zinc-800">
                    <DialogClose asChild>
                        <Button variant="outline" className="gap-1.5">
                            <MoveLeft className="h-4 w-4" />
                            Close
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default OperatorDetails;
