import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useEffect, useState } from 'react';

import { reports_T } from '@/types/report-types';

const ReportActionTab = ({
    reports,
    reportTypes,
    statusOptions,
    setFilteredReports,
}: {
    reports: { data: reports_T[]; links: any[]; meta: any };
    reportTypes: string[];
    statusOptions: { value: string; label: string }[];
    setFilteredReports: (reports: reports_T[]) => void;
}) => {
    const [reportTypeOpen, setReportTypeOpen] = useState(false);
    const [statusOpen, setStatusOpen] = useState(false);
    const [reportTypeValue, setReportTypeValue] = useState<string | null>(null);
    const [statusValue, setStatusValue] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>('');

    // Filter displayed reports based on selected report type, status, and search query
    useEffect(() => {
        let filteredResults = reports.data;

        // Filter by report type if selected
        if (reportTypeValue) {
            filteredResults = filteredResults.filter(
                (report: reports_T) => report.report_type === reportTypeValue,
            );
        }

        // Filter by status if selected
        if (statusValue) {
            if (statusValue === 'pending') {
                filteredResults = filteredResults.filter(
                    (report: reports_T) => !report.is_acknowledge,
                );
            } else if (statusValue === 'acknowledged') {
                filteredResults = filteredResults.filter(
                    (report: reports_T) => report.is_acknowledge,
                );
            }
        }

        // Filter by search query (description, report type, or user name)
        if (searchQuery.trim()) {
            filteredResults = filteredResults.filter((report: reports_T) => {
                const description = report.description.toLowerCase();
                const reportType = report.report_type.toLowerCase();
                const userName = report.user?.name?.toLowerCase() || '';
                const query = searchQuery.toLowerCase();

                return (
                    description.includes(query) ||
                    reportType.includes(query) ||
                    userName.includes(query)
                );
            });
        }

        setFilteredReports(filteredResults);
    }, [
        reportTypeValue,
        statusValue,
        searchQuery,
        reports.data,
        setFilteredReports,
    ]);

    return (
        <div className="flex max-w-4xl flex-wrap gap-4">
            <Input
                placeholder="Search reports by description, type, or reporter"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 min-w-[300px] flex-1"
            />

            <Popover open={reportTypeOpen} onOpenChange={setReportTypeOpen}>
                <PopoverTrigger asChild className="h-12">
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={reportTypeOpen}
                        className="w-[180px] cursor-pointer justify-between"
                    >
                        {reportTypeValue || 'Select report type...'}
                        <ChevronsUpDown className="opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[180px] p-0">
                    <Command>
                        <CommandInput
                            placeholder="Search report type..."
                            className="h-9"
                        />
                        <CommandList>
                            <CommandEmpty>No report type found.</CommandEmpty>
                            <CommandGroup>
                                {/* Add "All Report Types" option */}
                                <CommandItem
                                    key="all-report-types"
                                    value=""
                                    onSelect={() => {
                                        setReportTypeValue(null);
                                        setReportTypeOpen(false);
                                    }}
                                >
                                    All Report Types
                                    <Check
                                        className={cn(
                                            'ml-auto',
                                            reportTypeValue === null
                                                ? 'opacity-100'
                                                : 'opacity-0',
                                        )}
                                    />
                                </CommandItem>
                                {/* Use reportTypes for dropdown options */}
                                {reportTypes.map((reportType) => (
                                    <CommandItem
                                        key={reportType}
                                        value={reportType}
                                        onSelect={(currentValue) => {
                                            setReportTypeValue(
                                                currentValue === reportTypeValue
                                                    ? null
                                                    : currentValue,
                                            );
                                            setReportTypeOpen(false);
                                        }}
                                    >
                                        {reportType}
                                        <Check
                                            className={cn(
                                                'ml-auto',
                                                reportTypeValue === reportType
                                                    ? 'opacity-100'
                                                    : 'opacity-0',
                                            )}
                                        />
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            <Popover open={statusOpen} onOpenChange={setStatusOpen}>
                <PopoverTrigger asChild className="h-12">
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={statusOpen}
                        className="w-[180px] cursor-pointer justify-between"
                    >
                        {statusValue
                            ? statusOptions.find(
                                  (option) => option.value === statusValue,
                              )?.label
                            : 'Select status...'}
                        <ChevronsUpDown className="opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[180px] p-0">
                    <Command>
                        <CommandInput
                            placeholder="Search status..."
                            className="h-9"
                        />
                        <CommandList>
                            <CommandEmpty>No status found.</CommandEmpty>
                            <CommandGroup>
                                {/* Add "All Status" option */}
                                <CommandItem
                                    key="all-status"
                                    value=""
                                    onSelect={() => {
                                        setStatusValue(null);
                                        setStatusOpen(false);
                                    }}
                                >
                                    All Status
                                    <Check
                                        className={cn(
                                            'ml-auto',
                                            statusValue === null
                                                ? 'opacity-100'
                                                : 'opacity-0',
                                        )}
                                    />
                                </CommandItem>
                                {/* Use status options for dropdown */}
                                {statusOptions.map((status) => (
                                    <CommandItem
                                        key={status.value}
                                        value={status.value}
                                        onSelect={(currentValue) => {
                                            setStatusValue(
                                                currentValue === statusValue
                                                    ? null
                                                    : currentValue,
                                            );
                                            setStatusOpen(false);
                                        }}
                                    >
                                        {status.label}
                                        <Check
                                            className={cn(
                                                'ml-auto',
                                                statusValue === status.value
                                                    ? 'opacity-100'
                                                    : 'opacity-0',
                                            )}
                                        />
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
};

export default ReportActionTab;
