export const SPORT_LABEL: Record<string, string> = {
    FOOTBALL: "Fútbol",
    TENNIS: "Tenis",
    PADDLE: "Padel",
    BASKET: "Basquet",
    VOLLEY: "Voley",
  };
  
  export const SURFACE_LABEL: Record<string, string> = {
    CLAY: "Polvo de ladrillo",
    HARD: "Cemento / Hard",
    GRASS: "Césped",
    SYNTHETIC_TURF: "Sintético",
    PARQUET: "Parquet",
    SAND: "Arena",
    OTHER: "Otra",
  };
  
  export const SURFACES_BY_SPORT: Record<string, Array<keyof typeof SURFACE_LABEL>> = {
    TENNIS: ["CLAY", "HARD", "GRASS", "OTHER"],
    PADEL: ["SYNTHETIC_TURF", "HARD", "OTHER"],
    FOOTBALL: ["SYNTHETIC_TURF", "GRASS", "OTHER"],
    BASKET: ["PARQUET", "HARD", "OTHER"],
    VOLLEY: ["SAND", "HARD", "OTHER"],
  };
  
  export const DEFAULT_COURT_NUMBERS = Array.from({ length: 20 }, (_, i) => String(i + 1));
  export const DOW = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
  