import { Link, usePage } from '@inertiajs/react';
import { Clock3, ShieldCheck, Sparkles } from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const { name } = usePage().props;

    return (
        <div className="relative min-h-svh overflow-hidden bg-slate-950 text-white">
            <div className="pointer-events-none absolute -top-24 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-cyan-300/20 blur-3xl" />
            <div className="pointer-events-none absolute right-0 -bottom-20 h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl" />
            <div className="pointer-events-none absolute left-0 top-1/3 h-56 w-56 rounded-full bg-blue-400/15 blur-3xl" />

            <div className="mx-auto grid min-h-svh w-full max-w-6xl items-center px-6 py-10 md:px-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:py-14">
                <section className="hidden lg:block">
                    <Link
                        href={home()}
                        className="inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur-sm transition hover:bg-white/15"
                    >
                        <AppLogoIcon className="size-5 fill-current text-white" />
                        {name}
                    </Link>

                    <div className="mt-12 max-w-xl space-y-8">
                        <h2 className="text-4xl leading-tight font-semibold tracking-tight text-white">
                            Plan smarter trips with your people, not your
                            spreadsheets.
                        </h2>
                        <p className="text-base leading-relaxed text-slate-200/90">
                            Keep every destination, budget split, and shared
                            plan in one elegant workspace.
                        </p>

                        <div className="grid gap-4">
                            <div className="rounded-2xl border border-white/15 bg-white/8 p-4 backdrop-blur-sm">
                                <div className="flex items-start gap-3">
                                    <Sparkles className="mt-0.5 size-4 text-cyan-200" />
                                    <div>
                                        <p className="text-sm font-medium text-white">
                                            Smart planning
                                        </p>
                                        <p className="text-sm text-slate-200/90">
                                            Build itineraries and trip
                                            checklists in minutes.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="rounded-2xl border border-white/15 bg-white/8 p-4 backdrop-blur-sm">
                                <div className="flex items-start gap-3">
                                    <ShieldCheck className="mt-0.5 size-4 text-emerald-200" />
                                    <div>
                                        <p className="text-sm font-medium text-white">
                                            Secure by design
                                        </p>
                                        <p className="text-sm text-slate-200/90">
                                            Protected authentication and trusted
                                            account controls.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="rounded-2xl border border-white/15 bg-white/8 p-4 backdrop-blur-sm">
                                <div className="flex items-start gap-3">
                                    <Clock3 className="mt-0.5 size-4 text-blue-200" />
                                    <div>
                                        <p className="text-sm font-medium text-white">
                                            Always synchronized
                                        </p>
                                        <p className="text-sm text-slate-200/90">
                                            Share updates instantly with your
                                            travel group.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="relative mx-auto w-full max-w-md">
                    <div className="absolute inset-0 rounded-3xl bg-white/20 blur-2xl" />
                    <div className="relative rounded-3xl border border-white/20 bg-white px-6 py-7 text-slate-900 shadow-2xl shadow-black/40 sm:px-8 sm:py-9">
                        <div className="mb-8 flex flex-col items-center gap-4 text-center">
                            <Link
                                href={home()}
                                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 lg:hidden"
                            >
                                <AppLogoIcon className="size-4 fill-current text-slate-900" />
                                {name}
                            </Link>
                            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
                                {title}
                            </h1>
                            <p className="text-sm text-slate-600">
                                {description}
                            </p>
                        </div>

                        {children}
                    </div>
                </section>
            </div>
        </div>
    );
}
