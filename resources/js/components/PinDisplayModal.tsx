import { useState } from 'react';
import { Copy, Check, AlertTriangle } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/use-toast';

interface PinDisplayModalProps {
    pin: string;
    name: string;
    isOpen: boolean;
    onClose: () => void;
}

export function PinDisplayModal({ pin, name, isOpen, onClose }: PinDisplayModalProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(pin);
            setCopied(true);
            toast({
                title: 'PIN Copied',
                description: 'The PIN has been copied to your clipboard.',
            });
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            toast({
                title: 'Copy Failed',
                description: 'Failed to copy PIN. Please select and copy manually.',
                variant: 'destructive',
            });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md" showCloseButton={false}>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 " />
                        PIN Generated Successfully
                    </DialogTitle>
                    <DialogDescription>
                        A new PIN has been generated for <strong>{name}</strong>
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4 py-4">
                    {/* PIN Display */}
                    <div className="bg-card rounded-[var(--radius)] p-6 text-center border-2 border-dashed ">
                        <p className="text-sm text-muted-foreground mb-2">Generated PIN</p>
                        <p className="text-5xl font-mono font-bold tracking-wider text-slate-900 dark:text-slate-100 select-all">
                            {pin}
                        </p>
                    </div>

                    {/* Warning Message */}
                    <div className="bg-card dark:bg-card/20 border rounded-[var(--radius)] p-3">
                        <p className="text-xs leading-relaxed text-yellow-800 dark:text-yellow-200 flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span>
                                <strong>Important:</strong> This PIN will only be shown once.
                                Make sure to copy it and share it securely with the Purok Leader.
                            </span>
                        </p>
                    </div>
                </div>

                <DialogFooter className="sm:justify-between">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleCopy}
                        className="gap-2"
                    >
                        {copied ? (
                            <>
                                <Check className="h-4 w-4" />
                                Copied!
                            </>
                        ) : (
                            <>
                                <Copy className="h-4 w-4" />
                                Copy PIN
                            </>
                        )}
                    </Button>
                    <Button
                        type="button"
                        onClick={onClose}
                        disabled={!copied}
                        className={!copied ? 'opacity-50' : ''}
                    >
                        {copied ? 'Close' : 'Copy PIN First'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
