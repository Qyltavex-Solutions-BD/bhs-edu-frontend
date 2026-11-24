'use client';

/// <reference types="@types/google.maps" />
import React, { useCallback, useEffect, useState } from 'react';
import {
  APIProvider,
  APILoadingStatus,
  AdvancedMarker,
  InfoWindow,
  Map as GoogleMap,
  Pin,
  useAdvancedMarkerRef,
  useApiLoadingStatus,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import { Crosshair, ExternalLink, Layers, MapPin, Navigation } from 'lucide-react';
import { useI18n } from '@/src/lib/i18n';
import { cn } from '@/src/lib/utils/cn';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

interface LatLngPoint {
  lat: number;
  lng: number;
}

// Neutral country-level initial canvas before Places API (New) resolves the exact school location
const BANGLADESH_OVERVIEW_CENTER: LatLngPoint = {
  lat: 23.685,
  lng: 90.3563,
};

interface ResolvedCampusPlace {
  id?: string;
  displayName: string;
  formattedAddress: string;
  location: LatLngPoint;
  googleMapsURI?: string | null;
}

interface SchoolCampusMapProps {
  schoolName?: string;
  address?: string;
  phone?: string | null;
  fallbackMapUrl?: string | null;
  heightClassName?: string;
  className?: string;
}

function isQuotaError(err: unknown): boolean {
  const text = err instanceof Error ? err.message : String(err ?? '');
  return (
    text.includes('RESOURCE_EXHAUSTED') ||
    text.includes('OVER_QUERY_LIMIT') ||
    text.includes('QuotaExceeded') ||
    text.includes('429')
  );
}

function SchoolCampusMapInner({
  schoolName,
  address,
  phone,
  fallbackMapUrl,
}: Omit<SchoolCampusMapProps, 'heightClassName' | 'className'>) {
  const { locale, pick } = useI18n();
  const map = useMap();
  const placesLib = useMapsLibrary('places');
  const apiStatus = useApiLoadingStatus();
  const [markerRef, marker] = useAdvancedMarkerRef();

  const [resolvedPlace, setResolvedPlace] = useState<ResolvedCampusPlace | null>(null);
  const [infoOpen, setInfoOpen] = useState(true);
  const [mapTypeId, setMapTypeId] = useState<'roadmap' | 'hybrid'>('roadmap');
  const [resolving, setResolving] = useState(false);

  // Dynamically resolve Bhojeshwar High School via Places API (New) — zero hardcoded place coordinates
  useEffect(() => {
    if (!placesLib || !map) return;

    let cancelled = false;
    setResolving(true);

    const resolveSchoolLocation = async () => {
      const queries = [
        'Bhojeshwar High School, Naria, Shariatpur, Bangladesh',
        'Bhojeshwar, Naria, Shariatpur, Bangladesh',
      ];

      for (const textQuery of queries) {
        try {
          const response = await placesLib.Place.searchByText({
            textQuery,
            fields: ['id', 'displayName', 'formattedAddress', 'location', 'googleMapsURI'],
            maxResultCount: 1,
            region: 'BD',
            language: locale === 'bn' ? 'bn' : 'en',
          });

          const match = response?.places?.[0];
          if (match?.location && !cancelled) {
            const latLng: LatLngPoint = {
              lat:
                typeof match.location.lat === 'function'
                  ? match.location.lat()
                  : Number(match.location.lat),
              lng:
                typeof match.location.lng === 'function'
                  ? match.location.lng()
                  : Number(match.location.lng),
            };

            setResolvedPlace({
              id: match.id,
              displayName:
                match.displayName ||
                schoolName ||
                pick('ভোজেশ্বর উচ্চ বিদ্যালয়', 'Bhojeshwar High School'),
              formattedAddress: match.formattedAddress || address || '',
              location: latLng,
              googleMapsURI: match.googleMapsURI,
            });
            map.panTo(latLng);
            map.setZoom(16);
            setResolving(false);
            return;
          }
        } catch (err) {
          if (isQuotaError(err)) {
            window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
            break;
          }
        }
      }

      if (!cancelled) {
        setResolving(false);
      }
    };

    void resolveSchoolLocation();
    return () => {
      cancelled = true;
    };
  }, [placesLib, map, locale, schoolName, address, pick]);

  const handleRecenter = useCallback(() => {
    if (!map) return;
    if (resolvedPlace?.location) {
      map.panTo(resolvedPlace.location);
      map.setZoom(16);
      setInfoOpen(true);
    } else {
      map.panTo(BANGLADESH_OVERVIEW_CENTER);
      map.setZoom(7);
    }
  }, [map, resolvedPlace]);

  const directionsHref =
    resolvedPlace?.googleMapsURI ||
    (resolvedPlace?.location
      ? `https://www.google.com/maps/dir/?api=1&destination=${resolvedPlace.location.lat},${resolvedPlace.location.lng}`
      : fallbackMapUrl ||
        'https://www.google.com/maps/search/?api=1&query=Bhojeshwar+High+School+Naria+Shariatpur+Bangladesh');

  if (apiStatus === APILoadingStatus.FAILED || apiStatus === APILoadingStatus.AUTH_FAILURE) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-surface-muted/70 space-y-3">
        <div className="h-11 w-11 rounded-full bg-primary/10 text-primary flex items-center justify-center">
          <MapPin className="w-5 h-5" />
        </div>
        <div className="space-y-1 max-w-sm">
          <p className="text-base font-semibold text-foreground">
            {schoolName || pick('ভোজেশ্বর উচ্চ বিদ্যালয়', 'Bhojeshwar High School')}
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {address ||
              pick(
                'ভোজেশ্বর, নড়িয়া, শরীয়তপুর — মানচিত্র লোড হতে সমস্যা হয়েছে। সরাসরি গুগল ম্যাপে অবস্থান দেখুন।',
                'Bhojeshwar, Naria, Shariatpur — Unable to load live map right now. Open location directly in Google Maps.'
              )}
          </p>
        </div>
        <a
          href={directionsHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-92 transition-opacity"
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>{pick('গুগল ম্যাপে অবস্থান দেখুন', 'Open in Google Maps')}</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <GoogleMap
        mapId="DEMO_MAP_ID"
        defaultCenter={BANGLADESH_OVERVIEW_CENTER}
        defaultZoom={7}
        mapTypeId={mapTypeId}
        gestureHandling="cooperative"
        mapTypeControl={false}
        streetViewControl={false}
        fullscreenControl={true}
        zoomControl={true}
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        className="w-full h-full"
      >
        {resolvedPlace?.location && (
          <>
            <AdvancedMarker
              ref={markerRef}
              position={resolvedPlace.location}
              title={resolvedPlace.displayName}
              onClick={() => setInfoOpen((prev) => !prev)}
            >
              <Pin
                background="#0B6E31"
                borderColor="#06451E"
                glyphColor="#FFFFFF"
                scale={1.15}
              />
            </AdvancedMarker>

            {infoOpen && marker && (
              <InfoWindow
                anchor={marker}
                maxWidth={260}
                onCloseClick={() => setInfoOpen(false)}
              >
                <div className="p-1.5 space-y-1.5 text-slate-900">
                  <p className="text-sm font-bold leading-snug text-[#093B1F]">
                    {pick('ভোজেশ্বর উচ্চ বিদ্যালয়', resolvedPlace.displayName)}
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {resolvedPlace.formattedAddress || address}
                  </p>
                  {phone && (
                    <p className="text-xs text-slate-700 font-medium tabular-nums">
                      {phone}
                    </p>
                  )}
                  <a
                    href={directionsHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 pt-1 text-xs font-semibold text-[#0B6E31] hover:underline"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>{pick('দিকনির্দেশনা দেখুন', 'Get Directions')}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </InfoWindow>
            )}
          </>
        )}
      </GoogleMap>

      {/* Top-Left Compact Map Layer & Recenter Controls */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
        <div className="inline-flex items-center rounded-lg bg-surface/95 backdrop-blur-md border border-border shadow-sm p-0.5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setMapTypeId('roadmap')}
            className={cn(
              'px-2.5 py-1 rounded-md transition-colors cursor-pointer',
              mapTypeId === 'roadmap'
                ? 'bg-primary text-primary-foreground'
                : 'text-foreground/80 hover:text-foreground'
            )}
          >
            {pick('ম্যাপ', 'Map')}
          </button>
          <button
            type="button"
            onClick={() => setMapTypeId('hybrid')}
            className={cn(
              'px-2.5 py-1 rounded-md inline-flex items-center gap-1 transition-colors cursor-pointer',
              mapTypeId === 'hybrid'
                ? 'bg-primary text-primary-foreground'
                : 'text-foreground/80 hover:text-foreground'
            )}
          >
            <Layers className="w-3 h-3" />
            <span>{pick('স্যাটেলাইট', 'Satellite')}</span>
          </button>
        </div>

        <button
          type="button"
          onClick={handleRecenter}
          title={pick('বিদ্যালয়ের অবস্থানে ফিরুন', 'Recenter on campus')}
          aria-label={pick('বিদ্যালয়ের অবস্থানে ফিরুন', 'Recenter on campus')}
          className="h-7 w-7 rounded-lg bg-surface/95 backdrop-blur-md border border-border shadow-sm inline-flex items-center justify-center text-foreground/80 hover:text-primary transition-colors cursor-pointer"
        >
          <Crosshair className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Bottom-Left Quick Directions Link */}
      <div className="absolute bottom-3 left-3 z-10">
        <a
          href={directionsHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface/95 backdrop-blur-md border border-border shadow-sm text-xs font-semibold text-foreground hover:text-primary hover:border-primary/45 transition-colors"
        >
          <Navigation className="w-3.5 h-3.5 text-primary" />
          <span>
            {resolving
              ? pick('অবস্থান খুঁজছে...', 'Locating campus...')
              : pick('গুগল ম্যাপে দিকনির্দেশনা', 'Directions on Google Maps')}
          </span>
          <ExternalLink className="w-3 h-3 text-muted-foreground" />
        </a>
      </div>
    </div>
  );
}

export function SchoolCampusMap({
  schoolName,
  address,
  phone,
  fallbackMapUrl,
  heightClassName = 'h-[320px] sm:h-[360px]',
  className,
}: SchoolCampusMapProps) {
  const { locale, pick } = useI18n();

  const externalFallbackUrl =
    fallbackMapUrl ||
    'https://www.google.com/maps/search/?api=1&query=Bhojeshwar+High+School+Naria+Shariatpur+Bangladesh';

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-xl border border-border bg-surface-muted/40',
        heightClassName,
        className
      )}
    >
      {GOOGLE_MAPS_API_KEY ? (
        <APIProvider
          apiKey={GOOGLE_MAPS_API_KEY}
          libraries={['places', 'marker']}
          language={locale === 'bn' ? 'bn' : 'en'}
          region="BD"
        >
          <SchoolCampusMapInner
            schoolName={schoolName}
            address={address}
            phone={phone}
            fallbackMapUrl={externalFallbackUrl}
          />
        </APIProvider>
      ) : (
        <div className="relative w-full h-full min-h-[340px] bg-surface-muted/30">
          <iframe
            title={schoolName || 'ভোজেশ্বর উচ্চ বিদ্যালয় অবস্থান'}
            src="https://maps.google.com/maps?q=Bhojeshwar%20High%20School,%20Naria,%20Shariatpur,%20Bangladesh&t=&z=15&ie=UTF8&iwloc=&output=embed"
            className="w-full h-full border-0 absolute inset-0"
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
          />

          {/* Floating Action Button: Open in Native Google Maps */}
          <div className="absolute bottom-3 right-3 z-10 pointer-events-auto">
            <a
              href={externalFallbackUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface/95 backdrop-blur-md border border-border shadow-md text-xs font-semibold text-foreground hover:text-primary hover:border-primary/45 transition-colors"
            >
              <Navigation className="w-3.5 h-3.5 text-primary" />
              <span>{pick('বড় ম্যাপে দেখুন', 'Open in Google Maps')}</span>
              <ExternalLink className="w-3 h-3 text-muted-foreground" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
