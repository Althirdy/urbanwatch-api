import { ImagePreview } from '@/components/image-preview';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from '@/components/ui/carousel';
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
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import { formatDateTime } from '@/lib/utils';
import { reports_T } from '@/types/report-types';
import { router } from '@inertiajs/react';
import {
    Camera,
    Check,
    Clock,
    LocateFixed,
    Mail,
    MoveLeft,
    Phone,
    TriangleAlert,
    User,
} from 'lucide-react';

type ViewReportDetailsProps = {
    report: reports_T;
    children?: React.ReactNode;
};

type DetailItem = {
    icon: React.ComponentType<{ className?: string }>;
    text: string;
};

function renderDetailItems(items: DetailItem[]) {
    return items.map(({ icon: Icon, text }, index) => (
        <div
            key={index}
            className="flex flex-row items-center gap-2 text-muted-foreground"
        >
            <Icon className="h-5 w-5" />
            <span>{text}</span>
        </div>
    ));
}

function ViewReportDetails({ report, children }: ViewReportDetailsProps) {
    const handleAcknowledge = () => {
        router.patch(
            `/report/${report.id}/acknowledge`,
            {},
            {
                preserveScroll: true,
            },
        );
    };

    // Check if there are multiple media items
    const hasMultipleMedia = report.media && report.media.length > 1;
    const mediaItems = report.media || [];

    return (
        <Dialog>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent
                className="flex max-h-[90vh] max-w-none flex-col overflow-hidden p-0 sm:max-w-2xl"
                showCloseButton={false}
            >
                <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4">
                    <DialogTitle>Incident Details</DialogTitle>
                    <DialogDescription className="flex flex-col gap-2">
                        <span className="text-base font-semibold">
                            Report ID: #{report.id}
                        </span>
                        <div className="flex flex-wrap gap-2">
                            <Badge variant="default" className="text-xs">
                                {report.report_type}
                            </Badge>
                            {report.status === 'False Alarm' ? (
                                <Badge variant="outline" className="text-xs border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400">
                                    FALSE ALARM
                                </Badge>
                            ) : (
                                <Badge
                                    variant={
                                        report.status === 'Pending'
                                            ? 'destructive'
                                            : 'default'
                                    }
                                    className="text-xs"
                                >
                                    {report.status.toUpperCase()}
                                </Badge>
                            )}
                        </div>
                    </DialogDescription>
                </DialogHeader>
                <div className="flex w-full flex-1 flex-col justify-start gap-4 overflow-y-auto px-6 py-4">
                    {/* Accident Image / Carousel */}
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <p className="text-md font-semibold text-foreground">
                                Incident Snapshots {hasMultipleMedia && `(${mediaItems.length})`}
                            </p>
                            {hasMultipleMedia && (
                                <Badge variant="secondary" className="text-[10px] font-bold">
                                    TIMELINE VIEW
                                </Badge>
                            )}
                        </div>
                        
                        <div className="relative w-full overflow-hidden rounded-xl border border-sidebar-border/70 bg-muted/30 dark:border-sidebar-border">
                            {mediaItems.length > 0 ? (
                                <Carousel className="w-full">
                                    <CarouselContent>
                                        {mediaItems.map((image, index) => (
                                            <CarouselItem key={index}>
                                                <ImagePreview src={image} alt={`Accident snapshot ${index + 1}`}>
                                                    <div className="relative aspect-video w-full">
                                                        <img
                                                            src={image}
                                                            alt={`Accident snapshot ${index + 1}`}
                                                            className="h-full w-full object-cover"
                                                        />
                                                        <div className="absolute top-2 right-2 flex flex-col gap-2">
                                                            <Badge variant="destructive" className="text-[10px] shadow-md">
                                                                <Camera className="mr-1 h-2.5 w-2.5" />
                                                                YOLO {index === 0 ? 'INITIAL' : `UPDATE ${index}`}
                                                            </Badge>
                                                        </div>
                                                        {hasMultipleMedia && (
                                                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
                                                                <Badge variant="secondary" className="bg-black/60 text-white backdrop-blur-md border-none">
                                                                    Photo {index + 1} of {mediaItems.length}
                                                                </Badge>
                                                            </div>
                                                        )}
                                                    </div>
                                                </ImagePreview>
                                            </CarouselItem>
                                        ))}
                                    </CarouselContent>
                                    {hasMultipleMedia && (
                                        <>
                                            <CarouselPrevious className="left-2 h-8 w-8 opacity-70 hover:opacity-100" />
                                            <CarouselNext className="right-2 h-8 w-8 opacity-70 hover:opacity-100" />
                                        </>
                                    )}
                                </Carousel>
                            ) : (
                                <div className="relative flex aspect-video w-full items-center justify-center bg-muted">
                                    <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                                    {report.status === 'False Alarm' ? (
                                        <div className="relative z-10 flex flex-col items-center gap-3 text-amber-500/50">
                                            <TriangleAlert className="h-16 w-16" />
                                            <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/70">Image Discarded by AI</span>
                                        </div>
                                    ) : (
                                        <Camera className="relative z-10 h-16 w-16 text-muted-foreground/20" />
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Incident Description */}
                    <div className="flex flex-col gap-1">
                        <p className="text-md font-semibold">
                            Incident Description
                        </p>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {report.description}
                        </p>
                    </div>

                    {/* Details */}
                    <div className="flex flex-col gap-2">
                        <p className="text-md font-semibold">Location & Time</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="flex items-center gap-3 rounded-lg border border-sidebar-border/50 bg-muted/20 p-3">
                                <LocateFixed className="h-5 w-5 text-primary" />
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Coordinates</span>
                                    <span className="text-sm font-medium">{Number(report.latitude).toFixed(4)}, {Number(report.longtitude).toFixed(4)}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 rounded-lg border border-sidebar-border/50 bg-muted/20 p-3">
                                <Clock className="h-5 w-5 text-primary" />
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Detection Time</span>
                                    <span className="text-sm font-medium">{formatDateTime(report.created_at)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Report Information - Show "Unknown" for YOLO detections */}
                    <div className="flex flex-col gap-2">
                        <p className="text-md font-semibold">
                            Device / Reporting Info
                        </p>
                        <div className="rounded-lg border border-sidebar-border/50 bg-muted/20 p-3 space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                                    <Camera className="h-4 w-4 text-primary" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Source</span>
                                    <span className="text-sm font-medium">YOLO AI Detection</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                                    <User className="h-4 w-4 text-primary" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Authorized Observer</span>
                                    <span className="text-sm font-medium">{report.user?.name || 'System Auto-Log'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <DialogFooter className="flex-shrink-0 border-t bg-muted/20 px-6 py-4">
                    <div className="flex w-full gap-2">
                        <DialogClose asChild>
                            <Button
                                variant="outline"
                                className={
                                    !report.is_acknowledge ? 'flex-1' : 'w-full'
                                }
                            >
                                {!report.is_acknowledge && (
                                    <MoveLeft className="mr-2 h-4 w-4" />
                                )}
                                Back to Monitoring
                            </Button>
                        </DialogClose>
                        {!report.is_acknowledge && (
                            <Button
                                variant="default"
                                onClick={handleAcknowledge}
                                className="flex-[2] font-bold shadow-sm"
                            >
                                <Check className="mr-2 h-4 w-4" />
                                Acknowledge & Dispatch
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
export default ViewReportDetails;
