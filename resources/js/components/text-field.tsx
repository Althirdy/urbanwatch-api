import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type FormFieldProps = {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    error?: string;
    type?: 'text' | 'email' | 'number' | 'password';
    required?: boolean;
    readOnly?: boolean;
};

export function TextField({
    id,
    label,
    value,
    onChange,
    placeholder,
    error,
    type = 'text',
    required = false,
    readOnly = false,
}: FormFieldProps) {
    return (
        <div className="grid gap-2">
            <Label htmlFor={id} className="text-muted-foreground">
                {label} {!required && ''}
            </Label>
            <div className="relative">
                <Input
                    id={id}
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    readOnly={readOnly}
                    className={
                        error
                            ? 'border-red-500 focus:ring-red-500'
                            : readOnly
                              ? 'cursor-not-allowed border-none bg-muted select-none focus:ring-0 focus:ring-offset-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none'
                              : ''
                    }
                />
                {error && (
                    <span className="mt-1 block text-xs text-red-500">
                        {error}
                    </span>
                )}
            </div>
        </div>
    );
}
