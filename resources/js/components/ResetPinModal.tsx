import { useState, FormEvent } from 'react';
import { router } from '@inertiajs/react';
import { Key, AlertCircle } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ResetPinModalProps {
    userId: number;
    userName: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (pin: string, name: string) => void;
}

export function ResetPinModal({
    userId,
    userName,
    isOpen,
    onClose,
    onSuccess,
}: ResetPinModalProps) {
    const [operatorPassword, setOperatorPassword] = useState('');
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        router.post(
            `/user/${userId}/reset-pin`,
            {
                operator_password: operatorPassword,
                reason: reason || null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    // Clear form on success
                    handleClose();
                },
                onError: (errors) => {
                    setIsSubmitting(false);
                    if (errors.operator_password) {
                        setError(errors.operator_password as string);
                    } else if (errors.error) {
                        setError(errors.error as string);
                    } else {
                        setError('Failed to reset PIN. Please try again.');
                    }
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            }
        );
    };

    const handleClose = () => {
        setOperatorPassword('');
        setReason('');
        setError(null);
        setIsSubmitting(false);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">

                        Reset Purok Leader PIN
                    </DialogTitle>
                    <DialogDescription>
                        Reset PIN for <strong>{userName}</strong>. A new 4-digit PIN will be
                        auto-generated.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="flex flex-col gap-4 py-4">
                        {/* Security Notice */}
                        <Alert className='flex items-center gap-2'>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="text-xs">
                                For security, please enter your password to confirm this action.
                            </AlertDescription>
                        </Alert>

                        {/* Error Display */}
                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription className="text-sm">{error}</AlertDescription>
                            </Alert>
                        )}

                        {/* Operator Password Field */}
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="operator-password">Your Password *</Label>
                            <Input
                                id="operator-password"
                                type="password"
                                placeholder="Enter your password"
                                value={operatorPassword}
                                onChange={(e) => setOperatorPassword(e.target.value)}
                                required
                                disabled={isSubmitting}
                                autoFocus
                            />
                        </div>

                        {/* Optional Reason Field */}
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="reason">
                                Reason <span className="text-muted-foreground">(Optional)</span>
                            </Label>
                            <Textarea
                                id="reason"
                                placeholder="e.g., Purok Leader forgot PIN, security concern, etc."
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                disabled={isSubmitting}
                                rows={3}
                                maxLength={500}
                            />
                            <p className="text-xs text-muted-foreground text-right">
                                {reason.length}/500
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting || !operatorPassword}
                            className="gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="animate-spin">⏳</span>
                                    Resetting...
                                </>
                            ) : (
                                <>
                                    <Key className="h-4 w-4" />
                                    Reset PIN
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
