import React, { useEffect, useRef } from 'react';

interface MapRouteProps {
  active: boolean;
  matchScore?: number;
  fromCoords?: [number, number];
  toCoords?: [number, number];
}

declare global {
  interface Window {
    L: any;
  }
}

export const MapRoute: React.FC<MapRouteProps> = ({ active, matchScore, fromCoords, toCoords }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layerGroupRef = useRef<any>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || !window.L) return;

    if (!mapInstanceRef.current) {
      // Create Map
      mapInstanceRef.current = window.L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
        dragging: true,
        scrollWheelZoom: false,
      }).setView([37.5, -122.2], 10); // Bay Area Center

      layerGroupRef.current = window.L.layerGroup().addTo(mapInstanceRef.current);
    }

    // Handle Theme Changes (Light vs Dark Tiles)
    const updateTiles = () => {
      const isDark = document.documentElement.classList.contains('dark');
      const tileUrl = isDark 
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
      
      mapInstanceRef.current.eachLayer((layer: any) => {
        if (layer instanceof window.L.TileLayer) {
          mapInstanceRef.current.removeLayer(layer);
        }
      });

      window.L.tileLayer(tileUrl, {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(mapInstanceRef.current);
    };

    updateTiles();

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') updateTiles();
      });
    });
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();

  }, []);

  // Update Route Markers and Lines
  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupRef.current || !window.L) return;

    layerGroupRef.current.clearLayers();

    if (active && fromCoords && toCoords) {
      const L = window.L;

      // Start Marker (Green Pin)
      const startIcon = L.divIcon({
        className: 'bg-transparent',
        html: `<div class="relative">
                <div class="w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-lg z-10 relative"></div>
                <div class="absolute -inset-1 bg-green-500/30 rounded-full animate-ping"></div>
               </div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });

      // End Marker (Blue/Red Target)
      const endIcon = L.divIcon({
        className: 'bg-transparent',
        html: `<div class="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-lg"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });

      L.marker(fromCoords, { icon: startIcon }).addTo(layerGroupRef.current);
      L.marker(toCoords, { icon: endIcon }).addTo(layerGroupRef.current);

      // Route Line
      const latlngs = [fromCoords, toCoords];
      const polyline = L.polyline(latlngs, {
        color: '#10b981', // Green-500
        weight: 5,
        opacity: 0.8,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(layerGroupRef.current);

      // Fit bounds
      mapInstanceRef.current.fitBounds(polyline.getBounds(), { 
        padding: [50, 50],
        maxZoom: 13,
        animate: true,
        duration: 1
      });

      // Driver Route Simulation (Offset)
      if (matchScore) {
        const offsetFrom = [fromCoords[0] + 0.005, fromCoords[1] + 0.005];
        const offsetTo = [toCoords[0] + 0.005, toCoords[1] + 0.005];
        
        L.polyline([offsetFrom, offsetTo], {
          color: '#3b82f6', // Blue-500
          weight: 4,
          opacity: 0.4,
          dashArray: '10, 10'
        }).addTo(layerGroupRef.current);
      }
    }
  }, [active, fromCoords, toCoords, matchScore]);

  return (
    <div className="relative w-full h-48 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden shadow-inner border border-slate-200 dark:border-slate-700 z-0">
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />
      {matchScore && (
        <div className="absolute bottom-2 right-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur px-3 py-1 rounded-full shadow-lg border border-green-100 dark:border-green-900 z-[400]">
           <span className="text-xs font-bold text-green-700 dark:text-green-400">Route Overlap: {matchScore}%</span>
        </div>
      )}
    </div>
  );
};