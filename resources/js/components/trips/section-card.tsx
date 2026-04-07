import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ReactNode } from 'react';

type SectionCardProps = {
    title: string;
    description?: string;
    children: ReactNode;
    className?: string;
};

export default function SectionCard({
    title,
    description,
    children,
    className,
}: SectionCardProps) {
    return (
        <Card className={className}>
            <CardHeader className="pb-3">
                <CardTitle>{title}</CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent className="space-y-4">{children}</CardContent>
        </Card>
    );
}
