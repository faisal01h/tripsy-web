import { Form, Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowRight,
    Calendar,
    Clock,
    EllipsisVertical,
    Globe,
    MapPin,
    Plus,
    Receipt,
    Split,
    Trash2,
    TrendingUp,
    Users,
    Wallet,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { ComponentType } from 'react';
import InputError from '@/components/input-error';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import trips from '@/routes/trips';

const formatCurrency = (value: number, currency: string) => {
    try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
        }).format(value);
    } catch {
        return `${currency} ${value.toFixed(2)}`;
    }
};

type TripSummary = {
    id: number;
    name: string;
    destination: string | null;
    start_date: string | null;
    end_date: string | null;
    host_name: string | null;
    members_count: number;
    total_expenses: number;
    default_currency: string;
};

type TripMember = {
    id: number;
    name: string;
    email: string;
    paid_total: number;
    owed_total: number;
    net_balance: number;
};

type TripItinerary = {
    id: number;
    title: string;
    scheduled_for: string | null;
    notes: string | null;
    created_by_name: string | null;
};

type TripExpense = {
    id: number;
    title: string;
    amount: number;
    currency: string;
    amount_in_default_currency: number;
    default_currency: string;
    split_user_ids: number[];
    split_member_names: string[];
    incurred_on: string | null;
    notes: string | null;
    paid_by_user_id: number;
    paid_by_name: string | null;
};

type SelectedTrip = {
    id: number;
    name: string;
    destination: string | null;
    start_date: string | null;
    end_date: string | null;
    members_can_edit_entries: boolean;
    default_currency: string;
    host_user_id: number;
    host_name: string | null;
    permissions: {
        can_manage_members: boolean;
        can_edit_trip: boolean;
        can_add_entries: boolean;
        can_delete_trip: boolean;
    };
    stats: {
        total_expenses: number;
        member_count: number;
        per_member_share: number;
        currency: string;
        conversion_warning: boolean;
    };
    members: TripMember[];
    itineraries: TripItinerary[];
    expenses: TripExpense[];
};

type AvailableMember = {
    id: number;
    name: string;
    email: string;
};

type TripsPageProps = {
    trips: TripSummary[];
    selectedTrip: SelectedTrip | null;
    acceptedFriends: AvailableMember[];
};

export default function TripsPage({
    trips: tripSummaries,
    selectedTrip,
    acceptedFriends,
}: TripsPageProps) {
    const { auth } = usePage().props;
    const [editingExpense, setEditingExpense] = useState<TripExpense | null>(null);
    const [createSheetOpen, setCreateSheetOpen] = useState(false);

    const availableMembers = useMemo(() => {
        const existingMemberIds = new Set(selectedTrip?.members.map((m) => m.id) ?? []);

        return acceptedFriends.filter((m) => !existingMemberIds.has(m.id));
    }, [acceptedFriends, selectedTrip]);

    return (
        <>
            <Head title="Trips" />

            <div className="flex h-full overflow-hidden">
                {/* ── Sidebar ── */}
                <aside className="flex w-72 shrink-0 flex-col border-r bg-white dark:bg-slate-900 dark:border-slate-700">
                    <div className="flex items-center justify-between border-b px-4 py-3.5 dark:border-slate-700">
                        <div>
                            <h1 className="text-sm font-semibold text-slate-900 dark:text-slate-100">My Trips</h1>
                            <p className="text-xs text-slate-400">
                                {tripSummaries.length === 0
                                    ? 'No trips yet'
                                    : `${tripSummaries.length} trip${tripSummaries.length !== 1 ? 's' : ''}`}
                            </p>
                        </div>

                        <Sheet open={createSheetOpen} onOpenChange={setCreateSheetOpen}>
                            <SheetTrigger asChild>
                                <Button
                                    size="sm"
                                    className="h-8 gap-1.5 bg-teal-600 text-xs hover:bg-teal-700"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    New Trip
                                </Button>
                            </SheetTrigger>
                            <SheetContent className="flex flex-col overflow-y-auto sm:max-w-md">
                                <SheetHeader className="border-b pb-4">
                                    <SheetTitle>Create a new trip</SheetTitle>
                                    <SheetDescription>
                                        Set up your trip details, dates, and member permissions.
                                    </SheetDescription>
                                </SheetHeader>

                                <Form
                                    action={trips.store.url()}
                                    method="post"
                                    className="flex-1 space-y-4 overflow-y-auto p-4"
                                    onSuccess={() => setCreateSheetOpen(false)}
                                >
                                    {({ errors, processing }) => (
                                        <>
                                            <div className="grid gap-2">
                                                <Label htmlFor="new-trip-name">Trip name</Label>
                                                <Input
                                                    id="new-trip-name"
                                                    name="name"
                                                    placeholder="Bali Food Crawl"
                                                    required
                                                />
                                                <InputError message={errors.name} />
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="new-trip-destination">
                                                    Destination
                                                </Label>
                                                <Input
                                                    id="new-trip-destination"
                                                    name="destination"
                                                    placeholder="Bali, Indonesia"
                                                />
                                                <InputError message={errors.destination} />
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="new-trip-start">
                                                        Start date
                                                    </Label>
                                                    <Input
                                                        id="new-trip-start"
                                                        name="start_date"
                                                        type="date"
                                                    />
                                                    <InputError message={errors.start_date} />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="new-trip-end">End date</Label>
                                                    <Input
                                                        id="new-trip-end"
                                                        name="end_date"
                                                        type="date"
                                                    />
                                                    <InputError message={errors.end_date} />
                                                </div>
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="new-trip-default-currency">
                                                    Default currency
                                                </Label>
                                                <Input
                                                    id="new-trip-default-currency"
                                                    name="default_currency"
                                                    placeholder="USD"
                                                    defaultValue="USD"
                                                    required
                                                />
                                                <InputError message={errors.default_currency} />
                                            </div>

                                            <label
                                                htmlFor="new-trip-members-can-edit"
                                                className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-600 dark:bg-slate-800"
                                            >
                                                <input
                                                    id="new-trip-members-can-edit"
                                                    type="checkbox"
                                                    name="members_can_edit_entries"
                                                    value="1"
                                                    className="h-4 w-4 rounded border border-input accent-teal-600"
                                                />
                                                <div>
                                                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                                                        Open editing
                                                    </p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                                        Members can add itinerary and expenses
                                                    </p>
                                                </div>
                                            </label>

                                            <Button
                                                disabled={processing}
                                                className="w-full bg-teal-600 hover:bg-teal-700"
                                            >
                                                <Plus className="mr-2 h-4 w-4" />
                                                Create Trip
                                            </Button>
                                        </>
                                    )}
                                </Form>
                            </SheetContent>
                        </Sheet>
                    </div>

                    {/* Trip list */}
                    <div className="flex-1 overflow-y-auto p-2">
                        {tripSummaries.length === 0 ? (
                            <div className="mt-8 px-4 text-center">
                                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                                    <Globe className="h-5 w-5 text-slate-400" />
                                </div>
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No trips yet</p>
                                <p className="mt-1 text-xs text-slate-400">
                                    Hit "New Trip" to get started.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-1 pt-1">
                                {tripSummaries.map((trip) => (
                                    <Link
                                        key={trip.id}
                                        href={trips.show.url({ trip: trip.id })}
                                        prefetch
                                        className={cn(
                                            'group flex flex-col gap-1 rounded-xl px-3 py-2.5 transition-all',
                                            selectedTrip?.id === trip.id
                                                ? 'bg-teal-50 ring-1 ring-teal-200 dark:bg-teal-900/30 dark:ring-teal-700'
                                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/60',
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <p
                                                className={cn(
                                                    'truncate text-sm font-semibold',
                                                    selectedTrip?.id === trip.id
                                                        ? 'text-teal-800 dark:text-teal-300'
                                                        : 'text-slate-800 dark:text-slate-100',
                                                )}
                                            >
                                                {trip.name}
                                            </p>
                                            <span className="shrink-0 text-[10px] font-medium text-slate-400">
                                                {trip.members_count} members
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <p className="truncate text-xs text-slate-400">
                                                {trip.destination ?? 'No destination'}
                                            </p>
                                            <p
                                                className={cn(
                                                    'shrink-0 text-xs font-semibold',
                                                    selectedTrip?.id === trip.id
                                                        ? 'text-teal-600'
                                                        : 'text-slate-500 dark:text-slate-400',
                                                )}
                                            >
                                                {formatCurrency(
                                                    trip.total_expenses,
                                                    trip.default_currency,
                                                )}
                                            </p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </aside>

                {/* ── Main content ── */}
                <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950">
                    {selectedTrip ? (
                        <TripDetail
                            trip={selectedTrip}
                            availableMembers={availableMembers}
                            editingExpense={editingExpense}
                            setEditingExpense={setEditingExpense}
                            authUserId={(auth as { user: { id: number } }).user.id}
                        />
                    ) : (
                        <EmptyState />
                    )}
                </main>
            </div>
        </>
    );
}

/* ─────────────────────────────────────────────────────────
   Trip Detail
───────────────────────────────────────────────────────── */
function TripDetail({
    trip,
    availableMembers,
    editingExpense,
    setEditingExpense,
    authUserId,
}: {
    trip: SelectedTrip;
    availableMembers: AvailableMember[];
    editingExpense: TripExpense | null;
    setEditingExpense: (e: TripExpense | null) => void;
    authUserId: number;
}) {
    return (
        <div className="flex flex-col">
            {/* Hero banner */}
            <div className="relative overflow-hidden bg-linear-to-br from-slate-900 via-teal-900 to-cyan-800 px-6 py-8 text-white md:px-8 md:py-10">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(45,212,191,0.15)_0%,transparent_60%)]" />
                <div className="pointer-events-none absolute bottom-0 left-0 h-32 w-64 rounded-full bg-teal-400/10 blur-3xl" />

                <div className="relative flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                        <p className="mb-1.5 text-xs font-medium tracking-widest text-teal-300 uppercase">
                            Trip Dashboard
                        </p>
                        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
                            {trip.name}
                        </h2>
                        <p className="mt-1 text-sm text-teal-100/80">
                            Hosted by {trip.host_name ?? 'you'}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                            {trip.destination && (
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-xs text-white backdrop-blur-sm">
                                    <MapPin className="h-3 w-3 text-teal-300" />
                                    {trip.destination}
                                </span>
                            )}
                            {trip.start_date && (
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-xs text-white backdrop-blur-sm">
                                    <Calendar className="h-3 w-3 text-teal-300" />
                                    {trip.start_date} → {trip.end_date ?? 'TBD'}
                                </span>
                            )}
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-xs text-white backdrop-blur-sm">
                                <Split className="h-3 w-3 text-teal-300" />
                                {trip.default_currency}
                            </span>
                        </div>
                    </div>

                    {trip.permissions.can_delete_trip && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="border border-rose-400/40 bg-rose-500/20 text-rose-200 hover:bg-rose-500/40 hover:text-rose-100"
                            onClick={() => {
                                if (
                                    confirm(
                                        'Delete this trip permanently? This removes members, itinerary, and expenses.',
                                    )
                                ) {
                                    router.delete(trips.destroy.url({ trip: trip.id }));
                                }
                            }}
                        >
                            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                            Delete Trip
                        </Button>
                    )}
                </div>

                {/* Stats row */}
                <div className="relative mt-6 grid grid-cols-3 gap-3">
                    <HeroStat
                        icon={Wallet}
                        label="Total Expenses"
                        value={formatCurrency(trip.stats.total_expenses, trip.stats.currency)}
                    />
                    <HeroStat
                        icon={TrendingUp}
                        label="Per Member"
                        value={formatCurrency(trip.stats.per_member_share, trip.stats.currency)}
                    />
                    <HeroStat
                        icon={Users}
                        label="Members"
                        value={String(trip.stats.member_count)}
                    />
                </div>
            </div>

            {/* Trip settings bar (if editable) */}
            {trip.permissions.can_edit_trip && (
                <div className="border-b bg-white px-6 py-3 md:px-8 dark:bg-slate-900 dark:border-slate-700">
                    <Form
                        action={trips.update.url({ trip: trip.id })}
                        method="patch"
                        className="flex flex-wrap items-end gap-3"
                    >
                        {({ processing }) => (
                            <>
                                <div className="grid gap-1">
                                    <Label
                                        className="text-xs text-slate-500"
                                        htmlFor="trip-default-currency"
                                    >
                                        Default currency
                                    </Label>
                                    <Input
                                        id="trip-default-currency"
                                        name="default_currency"
                                        defaultValue={trip.default_currency}
                                        className="h-8 w-24 text-sm"
                                        required
                                    />
                                </div>
                                <label
                                    htmlFor="trip-members-can-edit"
                                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 dark:border-slate-600 dark:bg-slate-800"
                                >
                                    <input
                                        type="hidden"
                                        name="members_can_edit_entries"
                                        value="0"
                                    />
                                    <input
                                        id="trip-members-can-edit"
                                        type="checkbox"
                                        name="members_can_edit_entries"
                                        value="1"
                                        defaultChecked={trip.members_can_edit_entries}
                                        className="h-4 w-4 rounded border border-input accent-teal-600"
                                    />
                                    <span className="text-xs text-slate-600 dark:text-slate-300">
                                        Members can add entries
                                    </span>
                                </label>
                                <Button
                                    disabled={processing}
                                    size="sm"
                                    variant="outline"
                                    className="h-8 text-sm"
                                >
                                    Save
                                </Button>
                            </>
                        )}
                    </Form>
                </div>
            )}

            {/* Tabbed sections */}
            <div className="flex-1 p-4 md:p-6">
                <Tabs defaultValue="members" className="space-y-4">
                    <TabsList className="h-10 bg-white shadow-sm ring-1 ring-slate-200/80 dark:bg-slate-800 dark:ring-slate-700">
                        <TabsTrigger
                            value="members"
                            className="gap-1.5 text-sm data-[state=active]:text-teal-700"
                        >
                            <Users className="h-3.5 w-3.5" />
                            Members
                            <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                                {trip.stats.member_count}
                            </span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="itinerary"
                            className="gap-1.5 text-sm data-[state=active]:text-teal-700"
                        >
                            <Clock className="h-3.5 w-3.5" />
                            Itinerary
                            <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                                {trip.itineraries.length}
                            </span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="expenses"
                            className="gap-1.5 text-sm data-[state=active]:text-teal-700"
                        >
                            <Receipt className="h-3.5 w-3.5" />
                            Expenses
                            <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                                {trip.expenses.length}
                            </span>
                        </TabsTrigger>
                    </TabsList>

                    {/* ── Members tab ── */}
                    <TabsContent value="members">
                        <div className="space-y-4">
                            <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
                            {trip.permissions.can_manage_members && (
                                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                                    <h3 className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">
                                        Add a member
                                    </h3>
                                    <Form
                                        action={trips.members.store.url({ trip: trip.id })}
                                        method="post"
                                        className="space-y-3"
                                    >
                                        {({ errors, processing }) => (
                                            <>
                                                <div className="grid gap-2">
                                                    <Label
                                                        htmlFor="member-user-id"
                                                        className="text-xs text-slate-500"
                                                    >
                                                        Choose from accepted friends
                                                    </Label>
                                                    <select
                                                        id="member-user-id"
                                                        name="user_id"
                                                        disabled={availableMembers.length === 0}
                                                        className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 focus:outline-none disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                                                        defaultValue=""
                                                    >
                                                        <option value="" disabled>
                                                            {availableMembers.length === 0
                                                                ? 'No friends available to add'
                                                                : 'Select a friend…'}
                                                        </option>
                                                        {availableMembers.map((m) => (
                                                            <option key={m.id} value={m.id}>
                                                                {m.name} ({m.email})
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <InputError message={errors.user_id} />
                                                </div>
                                                <Button
                                                    size="sm"
                                                    disabled={
                                                        processing ||
                                                        availableMembers.length === 0
                                                    }
                                                    className="w-full bg-teal-600 hover:bg-teal-700"
                                                >
                                                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                                                    Add Member
                                                </Button>
                                            </>
                                        )}
                                    </Form>
                                </div>
                            )}

                            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
                                <div className="border-b px-5 py-3.5 dark:border-slate-700">
                                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                                        Members &amp; balances
                                    </h3>
                                </div>
                                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {trip.members.map((member) => (
                                        <MemberBalanceRow
                                            key={member.id}
                                            member={member}
                                            currency={trip.stats.currency}
                                            canRemove={
                                                trip.permissions.can_manage_members &&
                                                member.id !== trip.host_user_id
                                            }
                                            onRemove={() => {
                                                router.delete(
                                                    trips.members.destroy.url({
                                                        trip: trip.id,
                                                        user: member.id,
                                                    }),
                                                    { preserveScroll: true },
                                                );
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                        <SettlementSection members={trip.members} currency={trip.stats.currency} />
                    </div>
                    </TabsContent>

                    {/* ── Itinerary tab ── */}
                    <TabsContent value="itinerary">
                        <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
                            {trip.permissions.can_add_entries ? (
                                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                                    <h3 className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">
                                        Add to itinerary
                                    </h3>
                                    <Form
                                        action={trips.itineraries.store.url({ trip: trip.id })}
                                        method="post"
                                        className="space-y-3"
                                    >
                                        {({ errors, processing }) => (
                                            <>
                                                <div className="grid gap-2">
                                                    <Label
                                                        htmlFor="itinerary-title"
                                                        className="text-xs text-slate-500"
                                                    >
                                                        Activity
                                                    </Label>
                                                    <Input
                                                        id="itinerary-title"
                                                        name="title"
                                                        placeholder="Beach brunch"
                                                        required
                                                    />
                                                    <InputError message={errors.title} />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label
                                                        htmlFor="itinerary-time"
                                                        className="text-xs text-slate-500"
                                                    >
                                                        Date &amp; time
                                                    </Label>
                                                    <Input
                                                        id="itinerary-time"
                                                        name="scheduled_for"
                                                        type="datetime-local"
                                                    />
                                                    <InputError message={errors.scheduled_for} />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label
                                                        htmlFor="itinerary-notes"
                                                        className="text-xs text-slate-500"
                                                    >
                                                        Notes
                                                    </Label>
                                                    <textarea
                                                        id="itinerary-notes"
                                                        name="notes"
                                                        rows={3}
                                                        className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-teal-900"
                                                        placeholder="Meet at lobby at 09:00"
                                                    />
                                                    <InputError message={errors.notes} />
                                                </div>
                                                <Button
                                                    size="sm"
                                                    disabled={processing}
                                                    className="w-full bg-teal-600 hover:bg-teal-700"
                                                >
                                                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                                                    Add to Itinerary
                                                </Button>
                                            </>
                                        )}
                                    </Form>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-700">
                                    <AlertTriangle className="h-4 w-4 shrink-0" />
                                    <span>Only the host can add itinerary for this trip.</span>
                                </div>
                            )}

                            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
                                <div className="border-b px-5 py-3.5 dark:border-slate-700">
                                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                                        Schedule
                                    </h3>
                                </div>
                                {trip.itineraries.length === 0 ? (
                                    <div className="py-12 text-center">
                                        <Clock className="mx-auto mb-2 h-8 w-8 text-slate-200" />
                                        <p className="text-sm text-slate-400">
                                            No itinerary items yet.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-100 dark:divide-slate-700">
                                        {trip.itineraries.map((item) => (
                                            <ItineraryItem key={item.id} item={item} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    {/* ── Expenses tab ── */}
                    <TabsContent value="expenses">
                        <div className="space-y-4">
                            {trip.permissions.can_add_entries && (
                                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                                    <h3 className="mb-4 text-sm font-semibold text-slate-800 dark:text-slate-100">
                                        Add an expense
                                    </h3>
                                    <Form
                                        action={trips.expenses.store.url({ trip: trip.id })}
                                        method="post"
                                        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
                                    >
                                        {({ errors, processing }) => (
                                            <>
                                                <div className="grid gap-2 sm:col-span-2">
                                                    <Label
                                                        htmlFor="expense-title"
                                                        className="text-xs text-slate-500"
                                                    >
                                                        Item description
                                                    </Label>
                                                    <Input
                                                        id="expense-title"
                                                        name="title"
                                                        placeholder="Airport transfer"
                                                        required
                                                    />
                                                    <InputError message={errors.title} />
                                                </div>

                                                <div className="grid gap-2">
                                                    <Label
                                                        htmlFor="expense-amount"
                                                        className="text-xs text-slate-500"
                                                    >
                                                        Amount
                                                    </Label>
                                                    <Input
                                                        id="expense-amount"
                                                        name="amount"
                                                        type="number"
                                                        step="0.01"
                                                        min="0.01"
                                                        placeholder="0.00"
                                                        required
                                                    />
                                                    <InputError message={errors.amount} />
                                                </div>

                                                <div className="grid gap-2">
                                                    <Label
                                                        htmlFor="expense-currency"
                                                        className="text-xs text-slate-500"
                                                    >
                                                        Currency
                                                    </Label>
                                                    <Input
                                                        id="expense-currency"
                                                        name="currency"
                                                        defaultValue={trip.default_currency}
                                                        required
                                                    />
                                                    <InputError message={errors.currency} />
                                                </div>

                                                <div className="grid gap-2">
                                                    <Label
                                                        htmlFor="expense-payer"
                                                        className="text-xs text-slate-500"
                                                    >
                                                        Paid by
                                                    </Label>
                                                    <select
                                                        id="expense-payer"
                                                        name="paid_by_user_id"
                                                        className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                                                        defaultValue={String(authUserId)}
                                                    >
                                                        {trip.members.map((m) => (
                                                            <option key={m.id} value={m.id}>
                                                                {m.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <InputError message={errors.paid_by_user_id} />
                                                </div>

                                                <div className="grid gap-2">
                                                    <Label
                                                        htmlFor="expense-date"
                                                        className="text-xs text-slate-500"
                                                    >
                                                        Date
                                                    </Label>
                                                    <Input
                                                        id="expense-date"
                                                        name="incurred_on"
                                                        type="date"
                                                    />
                                                    <InputError message={errors.incurred_on} />
                                                </div>

                                                <div className="grid gap-2 sm:col-span-2">
                                                    <Label
                                                        htmlFor="expense-notes"
                                                        className="text-xs text-slate-500"
                                                    >
                                                        Notes (optional)
                                                    </Label>
                                                    <Input
                                                        id="expense-notes"
                                                        name="notes"
                                                        placeholder="Cash to driver"
                                                    />
                                                    <InputError message={errors.notes} />
                                                </div>

                                                <div className="grid gap-2 sm:col-span-2 lg:col-span-4">
                                                    <Label className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                                                        <Users className="h-3.5 w-3.5" />
                                                        Split for (leave blank = all members)
                                                    </Label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {trip.members.map((m) => (
                                                            <label
                                                                key={m.id}
                                                                className="flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 hover:border-teal-300 hover:bg-teal-50 has-checked:border-teal-400 has-checked:bg-teal-50 has-checked:text-teal-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-teal-600 dark:has-checked:border-teal-500 dark:has-checked:bg-teal-900/30 dark:has-checked:text-teal-300"
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    name="split_user_ids[]"
                                                                    value={m.id}
                                                                    className="h-3 w-3 rounded accent-teal-600"
                                                                />
                                                                {m.name}
                                                            </label>
                                                        ))}
                                                    </div>
                                                    <InputError message={errors.split_user_ids} />
                                                </div>

                                                <div className="sm:col-span-2 lg:col-span-4">
                                                    <Button
                                                        disabled={processing}
                                                        className="bg-teal-600 hover:bg-teal-700"
                                                    >
                                                        <Plus className="mr-1.5 h-4 w-4" />
                                                        Add Expense
                                                    </Button>
                                                </div>
                                            </>
                                        )}
                                    </Form>
                                </div>
                            )}

                            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
                                <div className="flex items-center justify-between border-b px-5 py-3.5 dark:border-slate-700">
                                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                                        Expense log
                                    </h3>
                                    <span className="text-xs font-semibold text-teal-600">
                                        {formatCurrency(
                                            trip.stats.total_expenses,
                                            trip.stats.currency,
                                        )}{' '}
                                        total
                                    </span>
                                </div>

                                {trip.stats.conversion_warning && (
                                    <div className="mx-4 mt-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                                        Some currency rates unavailable — totals may use fallback
                                        values.
                                    </div>
                                )}

                                {trip.expenses.length === 0 ? (
                                    <div className="py-12 text-center">
                                        <Receipt className="mx-auto mb-2 h-8 w-8 text-slate-200" />
                                        <p className="text-sm text-slate-400">No expenses yet.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-175 text-sm">
                                            <thead>
                                                <tr className="border-b dark:border-slate-700">
                                                    <th className="px-5 py-3 text-left text-xs font-medium tracking-wide text-slate-400 uppercase">
                                                        Item
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium tracking-wide text-slate-400 uppercase">
                                                        Paid by
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium tracking-wide text-slate-400 uppercase">
                                                        Date
                                                    </th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium tracking-wide text-slate-400 uppercase">
                                                        In {trip.default_currency}
                                                    </th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium tracking-wide text-slate-400 uppercase">
                                                        Original
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                                {trip.expenses.map((expense) => (
                                                    <ExpenseRow
                                                        key={expense.id}
                                                        expense={expense}
                                                        defaultCurrency={trip.default_currency}
                                                        canEdit={trip.permissions.can_add_entries}
                                                        onEdit={() => setEditingExpense(expense)}
                                                    />
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Edit expense dialog */}
            {editingExpense && (
                <Dialog
                    open={editingExpense !== null}
                    onOpenChange={(open) => !open && setEditingExpense(null)}
                >
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Edit Expense</DialogTitle>
                            <DialogDescription>
                                Update amount, payer, and split details.
                            </DialogDescription>
                        </DialogHeader>

                        <Form
                            key={editingExpense.id}
                            action={trips.expenses.update.url({
                                trip: trip.id,
                                tripExpense: editingExpense.id,
                            })}
                            method="patch"
                            className="space-y-4"
                            onSuccess={() => setEditingExpense(null)}
                        >
                            {({ errors, processing }) => (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-expense-title">Item</Label>
                                        <Input
                                            id="edit-expense-title"
                                            name="title"
                                            defaultValue={editingExpense.title}
                                            required
                                        />
                                        <InputError message={errors.title} />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="grid gap-2">
                                            <Label htmlFor="edit-expense-amount">Amount</Label>
                                            <Input
                                                id="edit-expense-amount"
                                                name="amount"
                                                type="number"
                                                step="0.01"
                                                min="0.01"
                                                defaultValue={editingExpense.amount}
                                                required
                                            />
                                            <InputError message={errors.amount} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="edit-expense-currency">Currency</Label>
                                            <Input
                                                id="edit-expense-currency"
                                                name="currency"
                                                defaultValue={editingExpense.currency}
                                                required
                                            />
                                            <InputError message={errors.currency} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="grid gap-2">
                                            <Label htmlFor="edit-expense-payer">Paid by</Label>
                                            <select
                                                id="edit-expense-payer"
                                                name="paid_by_user_id"
                                                className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm focus:border-teal-400 focus:ring-2 focus:ring-teal-100 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                                                defaultValue={String(
                                                    editingExpense.paid_by_user_id,
                                                )}
                                            >
                                                {trip.members.map((m) => (
                                                    <option key={m.id} value={m.id}>
                                                        {m.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <InputError message={errors.paid_by_user_id} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="edit-expense-date">Date</Label>
                                            <Input
                                                id="edit-expense-date"
                                                name="incurred_on"
                                                type="date"
                                                defaultValue={editingExpense.incurred_on ?? ''}
                                            />
                                            <InputError message={errors.incurred_on} />
                                        </div>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-expense-notes">Notes</Label>
                                        <Input
                                            id="edit-expense-notes"
                                            name="notes"
                                            defaultValue={editingExpense.notes ?? ''}
                                        />
                                        <InputError message={errors.notes} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label>Split for</Label>
                                        <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
                                            {trip.members.map((m) => (
                                                <label
                                                    key={m.id}
                                                    className="flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 hover:border-teal-300 has-checked:border-teal-400 has-checked:bg-teal-50 has-checked:text-teal-800 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:border-teal-600 dark:has-checked:border-teal-500 dark:has-checked:bg-teal-900/30 dark:has-checked:text-teal-300"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        name="split_user_ids[]"
                                                        value={m.id}
                                                        defaultChecked={editingExpense.split_user_ids.includes(
                                                            m.id,
                                                        )}
                                                        className="h-3 w-3 rounded accent-teal-600"
                                                    />
                                                    {m.name}
                                                </label>
                                            ))}
                                        </div>
                                        <InputError message={errors.split_user_ids} />
                                    </div>

                                    <div className="flex justify-end gap-2 pt-1">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() => setEditingExpense(null)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            disabled={processing}
                                            className="bg-teal-600 hover:bg-teal-700"
                                        >
                                            Save Changes
                                        </Button>
                                    </div>
                                </>
                            )}
                        </Form>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}

/* ─────────────────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────────────────── */
function HeroStat({
    icon: Icon,
    label,
    value,
}: {
    icon: ComponentType<{ className?: string }>;
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 backdrop-blur-sm">
            <div className="mb-1 flex items-center gap-1.5 text-teal-200">
                <Icon className="h-3.5 w-3.5" />
                <p className="text-[10px] font-medium tracking-wider uppercase">{label}</p>
            </div>
            <p className="text-base font-bold text-white">{value}</p>
        </div>
    );
}

function MemberBalanceRow({
    member,
    currency,
    canRemove,
    onRemove,
}: {
    member: TripMember;
    currency: string;
    canRemove: boolean;
    onRemove: () => void;
}) {
    const initials = member.name
        .split(' ')
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    return (
        <div className="flex items-center gap-4 px-5 py-3.5">
            <Avatar className="h-9 w-9 shrink-0">
                <AvatarFallback className="bg-teal-100 text-sm font-semibold text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
                    {initials}
                </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{member.name}</p>
                <p className="truncate text-xs text-slate-400">{member.email}</p>
            </div>

            <div className="shrink-0 text-right">
                <p className="text-xs text-slate-400">
                    Paid{' '}
                    <span className="font-medium text-slate-600 dark:text-slate-300">
                        {formatCurrency(member.paid_total, currency)}
                    </span>
                </p>
                <p
                    className={cn(
                        'mt-0.5 text-sm font-bold',
                        member.net_balance >= 0 ? 'text-emerald-600' : 'text-rose-500',
                    )}
                >
                    {member.net_balance >= 0 ? '+' : ''}
                    {formatCurrency(member.net_balance, currency)}
                </p>
            </div>

            {canRemove && (
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 shrink-0 px-2 text-xs text-slate-400 hover:text-rose-500"
                    onClick={onRemove}
                >
                    Remove
                </Button>
            )}
        </div>
    );
}

function ItineraryItem({ item }: { item: TripItinerary }) {
    return (
        <div className="flex gap-4 px-5 py-4">
            <div className="flex flex-col items-center pt-0.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-900/40">
                    <Clock className="h-3.5 w-3.5 text-teal-600" />
                </div>
                <div className="mt-1 w-px flex-1 bg-slate-100 dark:bg-slate-700" />
            </div>

            <div className="flex-1 pb-4">
                <p className="font-medium text-slate-800 dark:text-slate-100">{item.title}</p>
                <p className="mt-0.5 text-xs text-slate-400">
                    {item.scheduled_for
                        ? new Date(item.scheduled_for).toLocaleString()
                        : 'No time set'}
                    {' · '}by {item.created_by_name ?? 'Unknown'}
                </p>
                {item.notes && <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">{item.notes}</p>}
            </div>
        </div>
    );
}

function ExpenseRow({
    expense,
    defaultCurrency,
    canEdit,
    onEdit,
}: {
    expense: TripExpense;
    defaultCurrency: string;
    canEdit: boolean;
    onEdit: () => void;
}) {
    return (
        <tr className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
            <td className="px-5 py-3.5">
                <p className="font-medium text-slate-800 dark:text-slate-100">{expense.title}</p>
                {expense.notes && <p className="text-xs text-slate-400">{expense.notes}</p>}
                {expense.split_member_names.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                        {expense.split_member_names.map((name) => (
                            <Badge
                                key={name}
                                variant="secondary"
                                className="h-4 rounded-full px-1.5 text-[10px]"
                            >
                                {name}
                            </Badge>
                        ))}
                    </div>
                )}
            </td>
            <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-600 dark:text-slate-300">
                {expense.paid_by_name ?? 'Unknown'}
            </td>
            <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-400">
                {expense.incurred_on ?? '—'}
            </td>
            <td className="whitespace-nowrap px-4 py-3.5 text-right text-sm font-semibold text-slate-700 dark:text-slate-200">
                {formatCurrency(expense.amount_in_default_currency, defaultCurrency)}
            </td>
            <td className="whitespace-nowrap px-4 py-3.5 text-right">
                <div className="inline-flex items-center gap-1">
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        {formatCurrency(expense.amount, expense.currency)}
                    </span>
                    {canEdit && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 opacity-0 group-hover:opacity-100"
                                >
                                    <EllipsisVertical className="h-4 w-4" />
                                    <span className="sr-only">Expense actions</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </td>
        </tr>
    );
}

type Settlement = { from: string; to: string; amount: number };

function computeSettlements(members: TripMember[]): Settlement[] {
    const debtors: { name: string; amount: number }[] = [];
    const creditors: { name: string; amount: number }[] = [];

    for (const member of members) {
        if (member.net_balance < -0.005) {
            debtors.push({ name: member.name, amount: -member.net_balance });
        } else if (member.net_balance > 0.005) {
            creditors.push({ name: member.name, amount: member.net_balance });
        }
    }

    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const settlements: Settlement[] = [];
    let i = 0;
    let j = 0;

    while (i < debtors.length && j < creditors.length) {
        const pay = Math.min(debtors[i].amount, creditors[j].amount);
        settlements.push({ from: debtors[i].name, to: creditors[j].name, amount: pay });
        debtors[i].amount -= pay;
        creditors[j].amount -= pay;

        if (debtors[i].amount < 0.005) {
            i++;
        }

        if (creditors[j].amount < 0.005) {
            j++;
        }
    }

    return settlements;
}

function SettlementSection({ members, currency }: { members: TripMember[]; currency: string }) {
    const settlements = computeSettlements(members);

    return (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="border-b px-5 py-3.5 dark:border-slate-700">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Settlement plan</h3>
                <p className="mt-0.5 text-xs text-slate-400">
                    Minimum transfers to settle all balances
                </p>
            </div>
            {settlements.length === 0 ? (
                <div className="py-8 text-center">
                    <p className="text-sm font-medium text-emerald-600">✓ All settled up!</p>
                    <p className="mt-1 text-xs text-slate-400">No transfers needed.</p>
                </div>
            ) : (
                <div className="divide-y divide-slate-50 dark:divide-slate-800">
                    {settlements.map((s, idx) => (
                        <div key={idx} className="flex items-center gap-3 px-5 py-3.5">
                            <Avatar className="h-8 w-8 shrink-0">
                                <AvatarFallback className="bg-rose-100 text-xs font-semibold text-rose-600 dark:bg-rose-900/40 dark:text-rose-400">
                                    {s.from
                                        .split(' ')
                                        .map((p) => p[0])
                                        .join('')
                                        .slice(0, 2)
                                        .toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{s.from}</span>
                            <ArrowRight className="h-4 w-4 shrink-0 text-teal-500" />
                            <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{s.to}</span>
                            <Avatar className="h-8 w-8 shrink-0">
                                <AvatarFallback className="bg-emerald-100 text-xs font-semibold text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
                                    {s.to
                                        .split(' ')
                                        .map((p) => p[0])
                                        .join('')
                                        .slice(0, 2)
                                        .toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <span className="ml-auto text-sm font-bold text-teal-700 dark:text-teal-400">
                                {formatCurrency(s.amount, currency)}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function EmptyState() {
    return (
        <div className="flex h-full flex-col items-center justify-center p-8 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-linear-to-br from-teal-50 to-cyan-100 shadow-inner dark:from-teal-900/30 dark:to-cyan-900/30">
                <Globe className="h-9 w-9 text-teal-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Select a trip</h2>
            <p className="mt-2 max-w-xs text-sm text-slate-400">
                Choose a trip from the sidebar to manage members, itinerary, and shared expenses.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                <MapPin className="h-3.5 w-3.5 text-teal-500" />
                Or create a new trip using the "New Trip" button
            </div>
        </div>
    );
}

TripsPage.layout = {
    breadcrumbs: [
        {
            title: 'Trips',
            href: trips.index(),
        },
    ],
};
