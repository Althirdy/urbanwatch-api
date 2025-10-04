import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
    type CarouselApi,
} from '@/components/ui/carousel';
import { reports_T } from '@/types/report-types';
import { useEffect, useState } from 'react';
import OngoingReport from './reports-ongoing';

interface ReportsCarouselProps {
    reports: reports_T[];
}

const ReportsCarousel = ({ reports }: ReportsCarouselProps) => {
    const ongoingReports = reports.filter((report) => !report.is_acknowledge);

    const [api, setApi] = useState<CarouselApi>();
    const [current, setCurrent] = useState(0);
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (!api) {
            return;
        }
        setCount(api.scrollSnapList().length);
        setCurrent(api.selectedScrollSnap() + 1);
        api.on('select', () => {
            setCurrent(api.selectedScrollSnap() + 1);
        });
    }, [api]);

    if (ongoingReports.length === 0) {
        return (
            <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">
                    No pending reports at the moment
                </p>
            </div>
        );
    }

    return (
        <div className="relative w-full space-y-4 px-8">
            <Carousel
                setApi={setApi}
                opts={{
                    align: 'start',
                    loop: false,
                }}
                className="w-full px-2"
            >
                <CarouselContent className="-ml-4 md:-ml-4">
                    {ongoingReports.map((report) => (
                        <CarouselItem
                            key={report.id}
                            className="pl-2 md:basis-1/2 md:pl-4 lg:basis-1/3"
                        >
                            <OngoingReport report={report} />
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious className="-left-8" />
                <CarouselNext className="-right-8" />
            </Carousel>
            <div className="flex w-auto items-center gap-2 rounded-full bg-muted px-4 py-2">
                <span className="text-sm font-medium">
                    {current} / {count}
                </span>
                <span className="text-xs text-muted-foreground">
                    {count === 1 ? 'report' : 'reports'}
                </span>
            </div>
        </div>
    );
};

export default ReportsCarousel;
