import ConcernLogsTable from '@/pages/ai-logs-comp/concern-logs-table';
import YoloLogsTable from '@/pages/ai-logs-comp/yolo-logs-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { AiLogTab, AiLogsFilters, AiLogsPageProps, ConcernFalseAlarmLog, YoloFalseAlarmLog } from '@/types/ai-log-types';
import { BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Filter, Search, X } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';

const DEFAULT_SORT_BY = 'created_at';
const DEFAULT_SORT_DIR: 'asc' | 'desc' = 'desc';
const DEFAULT_PER_PAGE = 20;

const navigationOptions = {
    preserveState: false,
    preserveScroll: true,
    replace: true,
};

export default function AiLogs({ activeTab, logs, filters, options }: AiLogsPageProps) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [dateFrom, setDateFrom] = useState(filters.date_from ?? '');
    const [dateTo, setDateTo] = useState(filters.date_to ?? '');
    const [deviceId, setDeviceId] = useState(filters.device_id ?? '');
    const [attemptedType, setAttemptedType] = useState(filters.attempted_type ?? '');
    const [rejectionSource, setRejectionSource] = useState(filters.rejection_source ?? '');
    const [category, setCategory] = useState(filters.category ?? '');
    const [perPage, setPerPage] = useState(String(filters.per_page ?? DEFAULT_PER_PAGE));

    const currentSortBy = filters.sort_by ?? DEFAULT_SORT_BY;
    const currentSortDir: 'asc' | 'desc' = filters.sort_dir === 'asc' ? 'asc' : 'desc';

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'AI Logs',
            href: '/ai-logs',
        },
    ];

    const activeFilterCount = useMemo(() => {
        const active = [search.trim(), dateFrom, dateTo];
        if (activeTab === 'yolo') {
            active.push(deviceId, attemptedType);
        } else {
            active.push(rejectionSource, category);
        }

        return active.filter((value) => Boolean(value)).length;
    }, [activeTab, attemptedType, category, dateFrom, dateTo, deviceId, rejectionSource, search]);

    const buildQuery = (tab: AiLogTab, overrides: Partial<AiLogsFilters> = {}) => {
        const nextPerPage = Number(overrides.per_page ?? perPage) || DEFAULT_PER_PAGE;

        return {
            tab,
            search: (overrides.search ?? search).trim() || undefined,
            date_from: (overrides.date_from ?? dateFrom) || undefined,
            date_to: (overrides.date_to ?? dateTo) || undefined,
            device_id: tab === 'yolo' ? ((overrides.device_id ?? deviceId) || undefined) : undefined,
            attempted_type: tab === 'yolo' ? ((overrides.attempted_type ?? attemptedType) || undefined) : undefined,
            rejection_source: tab === 'concerns' ? ((overrides.rejection_source ?? rejectionSource) || undefined) : undefined,
            category: tab === 'concerns' ? ((overrides.category ?? category) || undefined) : undefined,
            per_page: nextPerPage,
            sort_by: overrides.sort_by ?? currentSortBy,
            sort_dir: overrides.sort_dir ?? currentSortDir,
        };
    };

    const handleApplyFilters = (event: FormEvent) => {
        event.preventDefault();
        router.get('/ai-logs', buildQuery(activeTab), navigationOptions);
    };

    const handleResetFilters = () => {
        setSearch('');
        setDateFrom('');
        setDateTo('');
        setDeviceId('');
        setAttemptedType('');
        setRejectionSource('');
        setCategory('');
        setPerPage(String(DEFAULT_PER_PAGE));

        router.get(
            '/ai-logs',
            {
                tab: activeTab,
                per_page: DEFAULT_PER_PAGE,
                sort_by: DEFAULT_SORT_BY,
                sort_dir: DEFAULT_SORT_DIR,
            },
            navigationOptions,
        );
    };

    const handleTabChange = (value: string) => {
        const nextTab = (value === 'concerns' ? 'concerns' : 'yolo') as AiLogTab;
        router.get(
            '/ai-logs',
            {
                tab: nextTab,
                search: search.trim() || undefined,
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined,
                per_page: Number(perPage) || DEFAULT_PER_PAGE,
                sort_by: DEFAULT_SORT_BY,
                sort_dir: DEFAULT_SORT_DIR,
            },
            navigationOptions,
        );
    };

    const handleSort = (column: string) => {
        const nextSortDir: 'asc' | 'desc' =
            currentSortBy === column && currentSortDir === 'asc' ? 'desc' : 'asc';

        router.get(
            '/ai-logs',
            buildQuery(activeTab, {
                sort_by: column,
                sort_dir: nextSortDir,
            }),
            navigationOptions,
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="AI Logs" />
            <div className="mx-auto w-full space-y-4 px-6 py-4">
                <div className="flex flex-col gap-1">
                    <h1 className="text-xl font-bold tracking-tight text-foreground">AI Logs</h1>
                    <p className="text-sm text-muted-foreground">
                        Unified prompt-tuning logs for YOLO and concern validation.
                    </p>
                </div>

                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                    <TabsList className="grid w-full max-w-md grid-cols-2">
                        <TabsTrigger value="yolo">YOLO False Alarms</TabsTrigger>
                        <TabsTrigger value="concerns">Concern False Alarms</TabsTrigger>
                    </TabsList>
                </Tabs>

                <Card>
                    <CardContent className="pt-6">
                        <form onSubmit={handleApplyFilters} className="space-y-3">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                                <div className="relative flex-1">
                                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Search logs, reasoning, citizen, or tracking code"
                                        value={search}
                                        onChange={(event) => setSearch(event.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Filter className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">Filters</span>
                                    <Badge variant="outline">{activeFilterCount} active</Badge>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
                                <Input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(event) => setDateFrom(event.target.value)}
                                />
                                <Input
                                    type="date"
                                    value={dateTo}
                                    onChange={(event) => setDateTo(event.target.value)}
                                />

                                {activeTab === 'yolo' ? (
                                    <>
                                        <Select value={deviceId || 'all'} onValueChange={(value) => setDeviceId(value === 'all' ? '' : value)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="All devices" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All devices</SelectItem>
                                                {options.devices.map((device) => (
                                                    <SelectItem key={device.id} value={String(device.id)}>
                                                        {device.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Select
                                            value={attemptedType || 'all'}
                                            onValueChange={(value) => setAttemptedType(value === 'all' ? '' : value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="All attempted types" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All attempted types</SelectItem>
                                                {options.attemptedTypes.map((type) => (
                                                    <SelectItem key={type} value={type}>
                                                        {type}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </>
                                ) : (
                                    <>
                                        <Select
                                            value={rejectionSource || 'all'}
                                            onValueChange={(value) => setRejectionSource(value === 'all' ? '' : value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="All rejection sources" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All rejection sources</SelectItem>
                                                <SelectItem value="ai_model">AI Model</SelectItem>
                                                <SelectItem value="official">Official</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Select
                                            value={category || 'all'}
                                            onValueChange={(value) => setCategory(value === 'all' ? '' : value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="All categories" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All categories</SelectItem>
                                                {options.concernCategories.map((concernCategory) => (
                                                    <SelectItem key={concernCategory} value={concernCategory}>
                                                        {concernCategory}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </>
                                )}
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">Rows per page</span>
                                    <Select value={perPage} onValueChange={setPerPage}>
                                        <SelectTrigger className="w-[110px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {[10, 20, 30, 50, 100].map((size) => (
                                                <SelectItem key={size} value={String(size)}>
                                                    {size}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button type="submit">Apply Filters</Button>
                                    <Button type="button" variant="outline" onClick={handleResetFilters}>
                                        <X className="mr-1 h-4 w-4" />
                                        Clear
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                        Showing {logs.from ?? 0}-{logs.to ?? 0} of {logs.total} logs
                    </span>
                    <span>
                        Sorted by <span className="font-medium text-foreground">{currentSortBy}</span> ({currentSortDir})
                    </span>
                </div>

                {activeTab === 'yolo' ? (
                    <YoloLogsTable
                        logs={logs.data as YoloFalseAlarmLog[]}
                        sortBy={currentSortBy}
                        sortDir={currentSortDir}
                        onSort={handleSort}
                    />
                ) : (
                    <ConcernLogsTable
                        logs={logs.data as ConcernFalseAlarmLog[]}
                        sortBy={currentSortBy}
                        sortDir={currentSortDir}
                        onSort={handleSort}
                    />
                )}

                {logs.links && logs.links.length > 0 ? (
                    <div className="flex justify-center pt-2">
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        href={logs.prev_page_url || '#'}
                                        className={!logs.prev_page_url ? 'pointer-events-none opacity-50' : ''}
                                    />
                                </PaginationItem>
                                {logs.links.map((link, index) => {
                                    if (link.url !== null && index !== 0 && index !== logs.links.length - 1) {
                                        return (
                                            <PaginationItem key={`${link.label}-${index}`}>
                                                <PaginationLink isActive={link.active} href={link.url}>
                                                    {link.label}
                                                </PaginationLink>
                                            </PaginationItem>
                                        );
                                    }

                                    return null;
                                })}
                                <PaginationItem>
                                    <PaginationEllipsis />
                                </PaginationItem>
                                <PaginationItem>
                                    <PaginationNext
                                        href={logs.next_page_url || '#'}
                                        className={!logs.next_page_url ? 'pointer-events-none opacity-50' : ''}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>
                ) : null}
            </div>
        </AppLayout>
    );
}

