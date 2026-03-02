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
import { YoloFalseAlarmLog } from '@/types/ai-log-types';
import { ArrowDown, ArrowUp, ArrowUpDown, Eye } from 'lucide-react';

type YoloLogsTableProps = {
    logs: YoloFalseAlarmLog[];
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

export default function YoloLogsTable({ logs, sortBy, sortDir, onSort }: YoloLogsTableProps) {
    return (
        <div className="overflow-hidden rounded-[var(--radius)] border">
            <Table>
                <TableHeader className="bg-muted">
                    <TableRow>
                        <TableHead className="text-center">{sortableHeader('ID', 'id', sortBy, sortDir, onSort)}</TableHead>
                        <TableHead className="text-center">
                            {sortableHeader('Logged At', 'created_at', sortBy, sortDir, onSort)}
                        </TableHead>
                        <TableHead className="text-center">Device</TableHead>
                        <TableHead className="text-center">
                            {sortableHeader('Attempted Type', 'attempted_accident_type', sortBy, sortDir, onSort)}
                        </TableHead>
                        <TableHead className="text-center">
                            {sortableHeader('Confidence', 'confidence_score', sortBy, sortDir, onSort)}
                        </TableHead>
                        <TableHead className="text-left">Reasoning</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {logs.length > 0 ? (
                        logs.map((log) => (
                            <TableRow key={log.id}>
                                <TableCell className="text-center font-medium">#{log.id}</TableCell>
                                <TableCell className="text-center">{formatDateTime(log.created_at)}</TableCell>
                                <TableCell className="text-center">{log.device_name}</TableCell>
                                <TableCell className="text-center">
                                    <Badge variant="outline">{log.attempted_accident_type ?? 'Unknown'}</Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                    {log.confidence_score ?? 'N/A'}
                                </TableCell>
                                <TableCell className="max-w-[420px] whitespace-normal text-sm text-muted-foreground">
                                    <div className="line-clamp-2">{log.gemini_reasoning}</div>
                                </TableCell>
                                <TableCell className="text-center">
                                    <AiLogDetailsDialog
                                        title={`YOLO False Alarm #${log.id}`}
                                        description="Detailed payload for prompt tuning and model evaluation."
                                        summary={[
                                            { label: 'Logged At', value: formatDateTime(log.created_at) },
                                            { label: 'Device', value: log.device_name },
                                            { label: 'Location', value: log.location_name },
                                            { label: 'Attempted Type', value: log.attempted_accident_type ?? 'Unknown' },
                                            { label: 'Confidence', value: log.confidence_score ?? 'N/A' },
                                            { label: 'Detected At', value: log.detected_at ? formatDateTime(log.detected_at) : 'N/A' },
                                        ]}
                                        narrativeLabel="Gemini Reasoning"
                                        narrativeValue={log.gemini_reasoning}
                                        rawJsonLabel="Gemini Metadata JSON"
                                        rawJson={log.gemini_metadata}
                                        extraJsonLabel="Detected Objects JSON"
                                        extraJson={log.detected_objects}
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
                            <TableCell colSpan={7} className="h-28 text-center text-muted-foreground">
                                No YOLO false alarm logs found.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}

