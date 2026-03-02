import AiLogDetailsDialog from '@/pages/ai-logs-comp/ai-log-details-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatDateTime } from '@/lib/utils';
import { ConcernFalseAlarmLog } from '@/types/ai-log-types';
import { ArrowDown, ArrowUp, ArrowUpDown, Eye } from 'lucide-react';

type ConcernLogsTableProps = {
    logs: ConcernFalseAlarmLog[];
    sortBy: string;
    sortDir: 'asc' | 'desc';
    onSort: (column: string) => void;
};

const sortIcon = (active: boolean, dir: 'asc' | 'desc') => {
    if (!active) {
        return <ArrowUpDown className="ml-1.5 h-3.5 w-3.5" />;
    }

    return dir === 'asc' ? <ArrowUp className="ml-1.5 h-3.5 w-3.5" /> : <ArrowDown className="ml-1.5 h-3.5 w-3.5" />;
};

const sortableHeader = (
    label: string,
    column: string,
    sortBy: string,
    sortDir: 'asc' | 'desc',
    onSort: (column: string) => void,
) => (
    <Button
        variant="ghost"
        className="h-auto px-0 py-0 font-semibold text-foreground"
        onClick={() => onSort(column)}
    >
        {label}
        {sortIcon(sortBy === column, sortDir)}
    </Button>
);

export default function ConcernLogsTable({ logs, sortBy, sortDir, onSort }: ConcernLogsTableProps) {
    return (
        <div className="overflow-hidden rounded-[var(--radius)] border">
            <Table>
                <TableHeader className="bg-muted">
                    <TableRow>
                        <TableHead className="text-center">{sortableHeader('ID', 'id', sortBy, sortDir, onSort)}</TableHead>
                        <TableHead className="text-center">
                            {sortableHeader('Logged At', 'created_at', sortBy, sortDir, onSort)}
                        </TableHead>
                        <TableHead className="text-center">Citizen</TableHead>
                        <TableHead className="text-center">
                            {sortableHeader('Category', 'category', sortBy, sortDir, onSort)}
                        </TableHead>
                        <TableHead className="text-center">Source</TableHead>
                        <TableHead className="text-center">
                            {sortableHeader('AI Confidence', 'ai_confidence', sortBy, sortDir, onSort)}
                        </TableHead>
                        <TableHead className="text-left">Rejection Reason</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {logs.length > 0 ? (
                        logs.map((log) => (
                            <TableRow key={log.id}>
                                <TableCell className="text-center font-medium">
                                    <div>#{log.id}</div>
                                    <div className="text-xs text-muted-foreground">{log.tracking_code}</div>
                                </TableCell>
                                <TableCell className="text-center">{formatDateTime(log.created_at)}</TableCell>
                                <TableCell className="text-center">{log.citizen_name ?? 'Unknown'}</TableCell>
                                <TableCell className="text-center">
                                    <Badge variant="outline">{log.category ?? 'Uncategorized'}</Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                    <Badge variant={log.rejection_source === 'official' ? 'secondary' : 'destructive'}>
                                        {log.rejection_source === 'official' ? 'Official' : 'AI Model'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                    {log.ai_confidence ?? 'N/A'}
                                </TableCell>
                                <TableCell className="max-w-[420px] whitespace-normal text-sm text-muted-foreground">
                                    <div className="line-clamp-2">{log.rejection_reason ?? 'No reason available'}</div>
                                </TableCell>
                                <TableCell className="text-center">
                                    <AiLogDetailsDialog
                                        title={`Concern False Alarm #${log.id}`}
                                        description="Detailed validation payload for prompt tuning and classifier review."
                                        summary={[
                                            { label: 'Tracking Code', value: log.tracking_code },
                                            { label: 'Citizen', value: log.citizen_name ?? 'Unknown' },
                                            { label: 'Logged At', value: formatDateTime(log.created_at) },
                                            { label: 'Category', value: log.category ?? 'Uncategorized' },
                                            { label: 'Specific Type', value: log.specific_type ?? 'N/A' },
                                            { label: 'Rejection Source', value: log.rejection_source === 'official' ? 'Official' : 'AI Model' },
                                            { label: 'AI Confidence', value: log.ai_confidence ?? 'N/A' },
                                            { label: 'Coherence Score', value: log.coherence_score ?? 'N/A' },
                                            { label: 'Detail Score', value: log.detail_score ?? 'N/A' },
                                        ]}
                                        narrativeLabel="Rejection Reason"
                                        narrativeValue={log.rejection_reason}
                                        rawJsonLabel="AI Analysis Raw JSON"
                                        rawJson={log.ai_analysis_raw}
                                    >
                                        <Button variant="outline" size="sm">
                                            <Eye className="mr-1 h-4 w-4" />
                                            View
                                        </Button>
                                    </AiLogDetailsDialog>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={8} className="h-28 text-center text-muted-foreground">
                                No concern false alarm logs found.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}

