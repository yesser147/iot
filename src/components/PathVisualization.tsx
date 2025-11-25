import { useMemo, useState, useEffect } from 'react';
import { MapPin, Calendar, Navigation, Clock, ExternalLink, AlertCircle } from 'lucide-react';

interface PathPoint {
  latitude: number;
  longitude: number;
  created_at: string;
}

interface PathVisualizationProps {
  data: PathPoint[];
  onClose: () => void;
}

export default function PathVisualization({ data = [], onClose }: PathVisualizationProps) {
  // Sécurisation des données d'entrée
  const safeData = useMemo(() => Array.isArray(data) ? data : [], [data]);

  // 1. Grouper les données par jour (YYYY-MM-DD)
  const groupedData = useMemo(() => {
    const groups: Record<string, PathPoint[]> = {};
    
    safeData.forEach(d => {
      if (!d.created_at || typeof d.latitude !== 'number' || typeof d.longitude !== 'number') return;
      try {
        const dateObj = new Date(d.created_at);
        // Utilisation de ISO string split pour une clé de date constante (YYYY-MM-DD)
        const dateKey = dateObj.toISOString().split('T')[0];
        
        if (!groups[dateKey]) {
          groups[dateKey] = [];
        }
        groups[dateKey].push(d);
      } catch (e) {
        console.warn("Date invalide ignorée", d);
      }
    });

    return groups;
  }, [safeData]);

  // Liste des jours disponibles triés (du plus récent au plus ancien pour l'ergonomie)
  const sortedDays = useMemo(() => Object.keys(groupedData).sort().reverse(), [groupedData]);

  // État pour le jour sélectionné
  const [selectedDay, setSelectedDay] = useState<string>('');

  // Sélection automatique du jour le plus récent au chargement
  useEffect(() => {
    if (sortedDays.length > 0 && !selectedDay) {
      setSelectedDay(sortedDays[0]);
    }
  }, [sortedDays]);

  // Données à afficher pour le jour sélectionné
  const displayData = useMemo(() => {
    if (!selectedDay) return [];
    // Tri par ordre chronologique pour le tracé
    return (groupedData[selectedDay] || []).sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }, [selectedDay, groupedData]);

  // 2. Calculer le SVG (Aperçu schématique)
  const { points, viewBox, hasValidData } = useMemo(() => {
    if (displayData.length < 1) return { points: '', viewBox: '0 0 800 600', hasValidData: false };

    // Filtrer les points GPS invalides (0,0) qui écrasent l'échelle
    const validData = displayData.filter(d => 
      Math.abs(d.latitude) > 0.1 && Math.abs(d.longitude) > 0.1
    );

    if (validData.length === 0) return { points: '', viewBox: '0 0 800 600', hasValidData: false };

    const lats = validData.map(d => d.latitude);
    const longs = validData.map(d => d.longitude);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLong = Math.min(...longs);
    const maxLong = Math.max(...longs);

    // Calcul de l'échelle avec une marge de sécurité pour éviter la division par zéro
    const latRange = (maxLat - minLat) || 0.0002;
    const longRange = (maxLong - minLong) || 0.0002;

    const width = 800;
    const height = 600;
    const padding = 60; // Marge interne en pixels

    const svgPoints = validData.map(d => {
      // Projection simple linéaire (Mercator simplifiée pour l'affichage local)
      const normX = (d.longitude - minLong) / longRange;
      const normY = (d.latitude - minLat) / latRange;

      const x = padding + (normX * (width - 2 * padding));
      // Inversion de Y car la latitude augmente vers le Nord (haut), mais Y SVG descend
      const y = height - (padding + (normY * (height - 2 * padding)));

      return `${x},${y}`;
    }).join(' ');

    return { points: svgPoints, viewBox: `0 0 ${width} ${height}`, hasValidData: true };
  }, [displayData]);

  // Extraction des coordonnées pour les marqueurs SVG
  const pointList = points ? points.split(' ') : [];
  const getCoords = (str: string) => {
    if (!str) return null;
    const [x, y] = str.split(',').map(Number);
    return { x, y };
  };
  const startPoint = getCoords(pointList[0]);
  const endPoint = getCoords(pointList[pointList.length - 1]);

  // --- FONCTION CLÉ : Générer le lien Google Maps ---
  const openInGoogleMaps = () => {
    if (displayData.length < 1) return;

    // Filtrer les points invalides (0,0) pour Google Maps aussi
    const validGPSData = displayData.filter(d => Math.abs(d.latitude) > 0.1);
    
    if (validGPSData.length === 0) return;

    const origin = validGPSData[0];
    const dest = validGPSData[validGPSData.length - 1];

    // Sélectionner des points intermédiaires (waypoints) pour tracer la route
    // Google Maps URL accepte un nombre limité de points, on en prend ~8 répartis
    const step = Math.max(1, Math.floor(validGPSData.length / 10));
    const waypoints = validGPSData
      .filter((_, i) => i > 0 && i < validGPSData.length - 1 && i % step === 0)
      .map(p => `${p.latitude},${p.longitude}`)
      .join('|');

    // Construction de l'URL
    // travelmode=driving, walking, bicycling, etc.
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin.latitude},${origin.longitude}&destination=${dest.latitude},${dest.longitude}&waypoints=${waypoints}&travelmode=driving`;
    
    window.open(url, '_blank');
  };

  // Formatteur de date convivial
  const formatDateLabel = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col h-[85vh]">
        
        {/* En-tête */}
        <div className="p-4 bg-white border-b flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
              <Navigation className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Historique des Trajets</h2>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Données des 7 derniers jours
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
            title="Fermer"
          >
            ✕
          </button>
        </div>

        {/* Barre de sélection des jours (Scrollable) */}
        <div className="bg-gray-50 border-b p-3 flex gap-2 overflow-x-auto shrink-0" style={{ scrollbarWidth: 'thin' }}>
          {sortedDays.length > 0 ? (
            sortedDays.map(day => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${
                  selectedDay === day 
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                }`}
              >
                {formatDateLabel(day)}
                <span className={`ml-2 text-xs ${selectedDay === day ? 'text-indigo-200' : 'text-gray-400'}`}>
                  ({groupedData[day].length} pts)
                </span>
              </button>
            ))
          ) : (
            <span className="text-gray-400 text-sm italic p-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> Aucune donnée d'historique disponible.
            </span>
          )}
        </div>

        {/* Zone Principale */}
        <div className="flex-1 bg-slate-900 relative overflow-hidden flex flex-col min-h-0">
          
          {/* Canvas SVG (Aperçu de la forme du trajet) */}
          <div className="flex-1 relative w-full">
            {hasValidData ? (
              <>
                <svg viewBox={viewBox} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                  {/* Grille de fond */}
                  <defs>
                    <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                      <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
                    </pattern>
                    <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#818cf8" />
                      <stop offset="100%" stopColor="#c084fc" />
                    </linearGradient>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />

                  {/* Le Tracé */}
                  <polyline 
                    points={points} 
                    fill="none" 
                    stroke="url(#pathGradient)" 
                    strokeWidth="4" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className="drop-shadow-[0_0_10px_rgba(129,140,248,0.5)]"
                  />

                  {/* Marqueurs */}
                  {startPoint && (
                    <g transform={`translate(${startPoint.x}, ${startPoint.y})`}>
                      <circle r="6" fill="#4ade80" />
                      <circle r="12" fill="#4ade80" opacity="0.2" className="animate-ping" />
                    </g>
                  )}
                  {endPoint && (
                    <g transform={`translate(${endPoint.x}, ${endPoint.y})`}>
                      <circle r="6" fill="#f87171" />
                      <circle r="12" fill="#f87171" opacity="0.2" className="animate-ping" />
                    </g>
                  )}
                </svg>

                {/* Légende sur la carte */}
                <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md rounded-lg p-3 border border-white/10 text-xs text-white">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-green-400"></div> Départ
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-400"></div> Arrivée
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-3">
                <MapPin className="w-16 h-16 opacity-20" />
                <p>Trajet non disponible pour ce jour</p>
              </div>
            )}
          </div>

          {/* Barre d'action du bas */}
          <div className="bg-white p-4 border-t flex flex-wrap justify-between items-center gap-4 shrink-0">
            <div className="flex gap-6 text-sm text-gray-600 w-full sm:w-auto justify-around sm:justify-start">
              <div className="flex flex-col items-center sm:items-start">
                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Durée Est.</span>
                <span className="font-mono font-bold flex items-center gap-1 text-gray-800 text-lg">
                  <Clock className="w-4 h-4 text-indigo-500" />
                  {hasValidData ? Math.round((new Date(displayData[displayData.length-1].created_at).getTime() - new Date(displayData[0].created_at).getTime()) / 60000) + ' min' : '--'}
                </span>
              </div>
              <div className="flex flex-col items-center sm:items-start">
                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Points GPS</span>
                <span className="font-mono font-bold text-lg text-gray-800">{displayData.length}</span>
              </div>
            </div>

            {/* LE BOUTON MAGIQUE GOOGLE MAPS - Corrigé pour être toujours visible et cliquable */}
            <button 
              onClick={openInGoogleMaps}
              disabled={!hasValidData}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 z-10"
            >
              <MapPin className="w-5 h-5" />
              Voir sur Google Maps
              <ExternalLink className="w-4 h-4 ml-1 opacity-70" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}