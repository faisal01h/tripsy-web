import { cn } from '@/lib/utils';

type StatCardProps = {
    label: string;
    value: string;
    className?: string;
};

export default function StatCard({ label, value, className }: StatCardProps) {
    return (
        <div
            className={cn(
                'rounded-xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-sm',
                className,
            )}
        >
            <p className="text-xs uppercase tracking-[0.12em] text-white/70">{label}</p>
            <p className="mt-1 text-xl font-semibold text-white">{value}</p>
        </div>
    );
}
