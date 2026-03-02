import { Button } from '@/components/ui/button';
import {
    DialogClose,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Copy } from 'lucide-react';
import { ReactNode } from 'react';

type SummaryItem = {
    label: string;
    value: ReactNode;
};

type AiLogDetailsDialogProps = {
    title: string;
    description?: string;
    summary: SummaryItem[];
    narrativeLabel?: string;
    narrativeValue?: string | null;
    rawJsonLabel: string;
    rawJson: unknown;
    extraJsonLabel?: string;
    extraJson?: unknown;
    children: ReactNode;
};

const toPrettyJson = (value: unknown): string => {
    if (value === null || value === undefined) {
        return 'null';
    }

    try {
        return JSON.stringify(value, null, 2);
    } catch {
        return String(value);
    }
};

const copyText = async (text: string) => {
    if (!navigator?.clipboard) {
        return;
    }

    await navigator.clipboard.writeText(text);
};

export default function AiLogDetailsDialog({
    title,
    description,
    summary,
    narrativeLabel,
    narrativeValue,
    rawJsonLabel,
    rawJson,
    extraJsonLabel,
    extraJson,
    children,
}: AiLogDetailsDialogProps) {
    const rawJsonString = toPrettyJson(rawJson);
    const extraJsonString = extraJsonLabel ? toPrettyJson(extraJson) : null;

    return (
        <Dialog>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    {description ? <DialogDescription>{description}</DialogDescription> : null}
                </DialogHeader>

                <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-3 rounded-md border p-3 text-sm sm:grid-cols-2">
                        {summary.map((item) => (
                            <div key={item.label} className="space-y-1">
                                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                    {item.label}
                                </p>
                                <div className="text-foreground">{item.value}</div>
                            </div>
                        ))}
                    </div>

                    {narrativeLabel && narrativeValue ? (
                        <div className="space-y-1 rounded-md border p-3">
                            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                {narrativeLabel}
                            </p>
                            <p className="text-sm leading-relaxed text-foreground">{narrativeValue}</p>
                        </div>
                    ) : null}

                    <div className="space-y-2 rounded-md border p-3">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                {rawJsonLabel}
                            </p>
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => void copyText(rawJsonString)}
                            >
                                <Copy className="mr-1 h-3.5 w-3.5" />
                                Copy JSON
                            </Button>
                        </div>
                        <pre className="max-h-72 overflow-auto rounded-md bg-muted/50 p-3 text-xs">
                            {rawJsonString}
                        </pre>
                    </div>

                    {extraJsonLabel && extraJsonString ? (
                        <div className="space-y-2 rounded-md border p-3">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                    {extraJsonLabel}
                                </p>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => void copyText(extraJsonString)}
                                >
                                    <Copy className="mr-1 h-3.5 w-3.5" />
                                    Copy JSON
                                </Button>
                            </div>
                            <pre className="max-h-72 overflow-auto rounded-md bg-muted/50 p-3 text-xs">
                                {extraJsonString}
                            </pre>
                        </div>
                    ) : null}
                </div>

                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline">
                            Close
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
