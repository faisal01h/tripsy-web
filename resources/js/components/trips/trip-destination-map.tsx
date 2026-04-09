import { AlertTriangle, ExternalLink, LoaderCircle, MapPinned } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type MapProvider = 'google' | 'mapbox' | 'openstreetmap';

export type MapsConfig = {
    provider: string;
    google: {
        apiKey: string | null;
    };
    mapbox: {
        publicToken: string | null;
    };
};

type TripDestinationMapProps = {
    destination: string | null;
    maps: MapsConfig;
    className?: string;
};

type MapPresentation = {
    kind: 'iframe' | 'image';
    provider: MapProvider;
    providerLabel: string;
    src: string;
    title: string;
    externalUrl?: string;
};

type Coordinates = {
    latitude: number;
    longitude: number;
};

type MapProviderStrategy = {
    provider: MapProvider;
    providerLabel: string;
    isConfigured: (maps: MapsConfig) => boolean;
    resolve: (
        destination: string,
        maps: MapsConfig,
        signal: AbortSignal,
    ) => Promise<MapPresentation>;
};

const openStreetMapStrategy: MapProviderStrategy = {
    provider: 'openstreetmap',
    providerLabel: 'OpenStreetMap',
    isConfigured: () => true,
    async resolve(destination, _maps, signal) {
        const coordinates = await geocodeWithOpenStreetMap(destination, signal);

        return {
            kind: 'iframe',
            provider: 'openstreetmap',
            providerLabel: 'OpenStreetMap',
            src: buildOpenStreetMapEmbedUrl(coordinates),
            title: `${destination} on OpenStreetMap`,
            externalUrl: `https://www.openstreetmap.org/search?query=${encodeURIComponent(destination)}`,
        };
    },
};

const googleMapsStrategy: MapProviderStrategy = {
    provider: 'google',
    providerLabel: 'Google Maps',
    isConfigured: (maps) => Boolean(maps.google.apiKey),
    async resolve(destination, maps) {
        return {
            kind: 'iframe',
            provider: 'google',
            providerLabel: 'Google Maps',
            src: `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(maps.google.apiKey ?? '')}&q=${encodeURIComponent(destination)}`,
            title: `${destination} on Google Maps`,
            externalUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}`,
        };
    },
};

const mapboxStrategy: MapProviderStrategy = {
    provider: 'mapbox',
    providerLabel: 'Mapbox',
    isConfigured: (maps) => Boolean(maps.mapbox.publicToken),
    async resolve(destination, maps, signal) {
        const publicToken = maps.mapbox.publicToken ?? '';
        const coordinates = await geocodeWithMapbox(destination, publicToken, signal);

        return {
            kind: 'image',
            provider: 'mapbox',
            providerLabel: 'Mapbox',
            src: buildMapboxStaticMapUrl(coordinates, publicToken),
            title: `${destination} on Mapbox`,
        };
    },
};

const strategies: Record<MapProvider, MapProviderStrategy> = {
    google: googleMapsStrategy,
    mapbox: mapboxStrategy,
    openstreetmap: openStreetMapStrategy,
};

export default function TripDestinationMap({
    destination,
    maps,
    className,
}: TripDestinationMapProps) {
    const [presentation, setPresentation] = useState<MapPresentation | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const requestedProvider = normalizeProvider(maps.provider);
    const activeStrategy = strategies[requestedProvider].isConfigured(maps)
        ? strategies[requestedProvider]
        : openStreetMapStrategy;
    const isFallback = requestedProvider !== activeStrategy.provider;

    useEffect(() => {
        if (!destination) {
            setPresentation(null);
            setErrorMessage(null);

            return;
        }

        const abortController = new AbortController();

        setIsLoading(true);
        setErrorMessage(null);

        activeStrategy
            .resolve(destination, maps, abortController.signal)
            .then((nextPresentation) => {
                setPresentation(nextPresentation);
            })
            .catch((error: unknown) => {
                if (abortController.signal.aborted) {
                    return;
                }

                setPresentation(null);
                setErrorMessage(error instanceof Error ? error.message : 'Unable to load the destination map.');
            })
            .finally(() => {
                if (!abortController.signal.aborted) {
                    setIsLoading(false);
                }
            });

        return () => {
            abortController.abort();
        };
    }, [activeStrategy, destination, maps]);

    if (!destination) {
        return (
            <MapPanel className={className}>
                <EmptyMapState
                    title="No destination yet"
                    description="Add a destination to this trip to preview it on the configured map provider."
                />
            </MapPanel>
        );
    }

    return (
        <MapPanel className={className}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-700">
                <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Destination map</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{destination}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        {activeStrategy.providerLabel}
                    </Badge>
                    {isFallback && (
                        <Badge variant="outline" className="border-amber-200 text-amber-700 dark:border-amber-800 dark:text-amber-300">
                            Fallback from {formatProviderLabel(requestedProvider)}
                        </Badge>
                    )}
                </div>
            </div>

            <div className="p-5">
                {isLoading && (
                    <div className="flex h-[320px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/60">
                        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                            Loading map preview...
                        </div>
                    </div>
                )}

                {!isLoading && errorMessage && (
                    <EmptyMapState
                        title="Map unavailable"
                        description={errorMessage}
                        tone="warning"
                    />
                )}

                {!isLoading && !errorMessage && presentation && (
                    <>
                        {presentation.kind === 'iframe' ? (
                            <iframe
                                src={presentation.src}
                                title={presentation.title}
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                allowFullScreen
                                className="h-[320px] w-full rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-900"
                            />
                        ) : (
                            <img
                                src={presentation.src}
                                alt={presentation.title}
                                className="h-[320px] w-full rounded-2xl border border-slate-200 bg-slate-100 object-cover dark:border-slate-700 dark:bg-slate-900"
                            />
                        )}

                        <div className="mt-3 flex items-center justify-between gap-3">
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Provider: {presentation.providerLabel}
                            </p>
                            {presentation.externalUrl && (
                                <a
                                    href={presentation.externalUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-700 transition hover:text-teal-600 dark:text-teal-400 dark:hover:text-teal-300"
                                >
                                    Open full map
                                    <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                            )}
                        </div>
                    </>
                )}
            </div>
        </MapPanel>
    );
}

function MapPanel({ className, children }: { className?: string; children: ReactNode }) {
    return (
        <section className={cn('overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900', className)}>
            {children}
        </section>
    );
}

function EmptyMapState({
    title,
    description,
    tone = 'default',
}: {
    title: string;
    description: string;
    tone?: 'default' | 'warning';
}) {
    return (
        <div className="flex h-[320px] flex-col items-center justify-center gap-3 px-6 text-center">
            <div
                className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-2xl',
                    tone === 'warning'
                        ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300'
                        : 'bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-300',
                )}
            >
                {tone === 'warning' ? <AlertTriangle className="h-5 w-5" /> : <MapPinned className="h-5 w-5" />}
            </div>
            <div className="space-y-1.5">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</p>
                <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">{description}</p>
            </div>
        </div>
    );
}

function normalizeProvider(provider: string): MapProvider {
    switch (provider) {
        case 'google':
        case 'mapbox':
        case 'openstreetmap':
            return provider;
        default:
            return 'openstreetmap';
    }
}

function formatProviderLabel(provider: MapProvider): string {
    return strategies[provider].providerLabel;
}

async function geocodeWithOpenStreetMap(
    destination: string,
    signal: AbortSignal,
): Promise<Coordinates> {
    const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(destination)}`,
        {
            headers: {
                Accept: 'application/json',
            },
            signal,
        },
    );

    if (!response.ok) {
        throw new Error('OpenStreetMap could not resolve this destination.');
    }

    const results = (await response.json()) as Array<{
        lat: string;
        lon: string;
    }>;
    const firstMatch = results[0];

    if (!firstMatch) {
        throw new Error('No matching location was found for this destination.');
    }

    return {
        latitude: Number(firstMatch.lat),
        longitude: Number(firstMatch.lon),
    };
}

async function geocodeWithMapbox(
    destination: string,
    publicToken: string,
    signal: AbortSignal,
): Promise<Coordinates> {
    const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(destination)}.json?access_token=${encodeURIComponent(publicToken)}&limit=1`,
        {
            headers: {
                Accept: 'application/json',
            },
            signal,
        },
    );

    if (!response.ok) {
        throw new Error('Mapbox could not resolve this destination.');
    }

    const payload = (await response.json()) as {
        features?: Array<{
            center?: [number, number];
        }>;
    };
    const center = payload.features?.[0]?.center;

    if (!center) {
        throw new Error('No matching location was found for this destination.');
    }

    return {
        longitude: center[0],
        latitude: center[1],
    };
}

function buildOpenStreetMapEmbedUrl({ latitude, longitude }: Coordinates): string {
    const delta = 0.12;
    const left = longitude - delta;
    const right = longitude + delta;
    const top = latitude + delta;
    const bottom = latitude - delta;

    return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${latitude}%2C${longitude}`;
}

function buildMapboxStaticMapUrl(
    { latitude, longitude }: Coordinates,
    publicToken: string,
): string {
    return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-s+0f766e(${longitude},${latitude})/${longitude},${latitude},10/1200x640?access_token=${encodeURIComponent(publicToken)}`;
}