/// <reference types="vite/client" />

// GeoJSON raw import
declare module '*.geojson?raw' {
    const content: string;
    export default content;
}

// GeoJSON JSON import (if needed in the future)
declare module '*.geojson' {
    const content: any;
    export default content;
}
