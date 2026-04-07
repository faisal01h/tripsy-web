import { Head, Link } from '@inertiajs/react';
import { CalendarDays, Compass, Send, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboard } from '@/routes';
import { index as friendsIndex } from '@/routes/friends';
import { index as tripsIndex } from '@/routes/trips';

type DashboardStats = {
    total_trips: number;
    hosting_trips: number;
    upcoming_trips: number;
    accepted_friends: number;
    incoming_requests: number;
    outgoing_requests: number;
};

type DashboardTrip = {
    id: number;
    name: string;
    destination: string | null;
    start_date: string | null;
    end_date: string | null;
};

type DashboardRecentTrip = DashboardTrip & {
    members_count: number;
    expenses_count: number;
    is_host: boolean;
};

type DashboardPageProps = {
    stats: DashboardStats;
    nextTrip: DashboardTrip | null;
    recentTrips: DashboardRecentTrip[];
};

function formatDateRange(startDate: string | null, endDate: string | null): string {
    if (startDate === null && endDate === null) {
        return 'Dates not set';
    }

    const formatter = new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });

    const formattedStart = startDate === null ? null : formatter.format(new Date(startDate));
    const formattedEnd = endDate === null ? null : formatter.format(new Date(endDate));

    if (formattedStart !== null && formattedEnd !== null) {
        return `${formattedStart} - ${formattedEnd}`;
    }

    return formattedStart ?? formattedEnd ?? 'Dates not set';
}

export default function Dashboard({ stats, nextTrip, recentTrips }: DashboardPageProps) {
    return (
        <>
            <Head title="Dashboard" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-4 md:p-6">
                <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-linear-to-br from-slate-950 via-slate-900 to-cyan-900 p-6 text-white shadow-xl md:p-8">
                    <div className="pointer-events-none absolute -right-10 -top-12 h-44 w-44 rounded-full bg-cyan-400/20 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-14 left-20 h-36 w-36 rounded-full bg-sky-300/15 blur-3xl" />

                    <div className="relative flex flex-wrap items-end justify-between gap-5">
                        <div className="max-w-2xl">
                            <p className="text-xs uppercase tracking-[0.18em] text-cyan-200">Overview</p>
                            <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
                                Your travel workspace at a glance
                            </h1>
                            <p className="mt-2 text-sm text-cyan-100/90 md:text-base">
                                Track active trips, upcoming plans, and social activity before jumping into planning.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button asChild variant="secondary" className="bg-white/90 text-slate-900 hover:bg-white">
                                <Link href={tripsIndex.url()}>Go to Trips</Link>
                            </Button>
                            <Button asChild variant="outline" className="border-white/30 text-white hover:bg-white/10">
                                <Link href={friendsIndex.url()}>Manage Friends</Link>
                            </Button>
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <StatCard title="Total Trips" value={stats.total_trips} icon={Compass} />
                    <StatCard title="Hosting" value={stats.hosting_trips} icon={CalendarDays} />
                    <StatCard title="Upcoming" value={stats.upcoming_trips} icon={Send} />
                    <StatCard title="Friends" value={stats.accepted_friends} icon={Users} />
                </section>

                <section className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
                    <Card className="rounded-2xl border-slate-200 dark:border-slate-700 dark:bg-slate-900 bg-white shadow-sm">
                        <CardHeader>
                            <CardTitle>Recent Trips</CardTitle>
                            <CardDescription>Continue where you left off across your latest trips.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {recentTrips.length === 0 && (
                                <p className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 p-4 text-sm text-muted-foreground">
                                    No trips yet. Create your first trip in the Trips page.
                                </p>
                            )}

                            {recentTrips.map((trip) => (
                                <Link
                                    key={trip.id}
                                    href={tripsIndex.url()}
                                    className="block rounded-xl border border-slate-200 dark:border-slate-700 p-4 transition hover:border-cyan-300 hover:bg-cyan-50/40 dark:hover:border-cyan-700 dark:hover:bg-cyan-900/20"
                                    prefetch
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="font-medium text-slate-900 dark:text-slate-100">{trip.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {trip.destination ?? 'Destination not set'}
                                            </p>
                                        </div>
                                        <Badge variant="secondary">{trip.is_host ? 'Host' : 'Member'}</Badge>
                                    </div>
                                    <p className="mt-3 text-xs text-muted-foreground">
                                        {formatDateRange(trip.start_date, trip.end_date)}
                                    </p>
                                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-600">
                                        <span>{trip.members_count} members</span>
                                        <span>{trip.expenses_count} expense entries</span>
                                    </div>
                                </Link>
                            ))}
                        </CardContent>
                    </Card>

                    <div className="space-y-6">
                    <Card className="rounded-2xl border-slate-200 dark:border-slate-700 dark:bg-slate-900 bg-white shadow-sm">
                            <CardHeader>
                                <CardTitle>Next Trip</CardTitle>
                                <CardDescription>Your nearest upcoming travel window.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {nextTrip === null ? (
                                    <p className="text-sm text-muted-foreground">
                                        No upcoming trip yet. Add one to start planning.
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{nextTrip.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {nextTrip.destination ?? 'Destination not set'}
                                        </p>
                                        <p className="text-sm text-slate-700 dark:text-slate-300">
                                            {formatDateRange(nextTrip.start_date, nextTrip.end_date)}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="rounded-2xl border-slate-200 dark:border-slate-700 dark:bg-slate-900 bg-white shadow-sm">
                            <CardHeader>
                                <CardTitle>Friend Requests</CardTitle>
                                <CardDescription>Stay on top of pending invites.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Incoming</span>
                                    <span className="font-medium text-slate-900 dark:text-slate-100">{stats.incoming_requests}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Outgoing</span>
                                    <span className="font-medium text-slate-900 dark:text-slate-100">{stats.outgoing_requests}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </section>
            </div>
        </>
    );
}

function StatCard({
    title,
    value,
    icon: Icon,
}: {
    title: string;
    value: number;
    icon: React.ComponentType<{ className?: string }>;
}) {
    return (
        <Card className="rounded-2xl border-slate-200 dark:border-slate-700 dark:bg-slate-900 bg-white shadow-sm">
            <CardContent className="flex items-center justify-between p-5">
                <div>
                    <p className="text-xs uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">{title}</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">{value}</p>
                </div>
                <span className="rounded-full bg-cyan-100 dark:bg-cyan-900/40 p-2 text-cyan-700 dark:text-cyan-400">
                    <Icon className="h-5 w-5" />
                </span>
            </CardContent>
        </Card>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
