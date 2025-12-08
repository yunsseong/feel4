/**
 * Handwriting Data Storage
 * Manages saving and loading handwriting strokes using IndexedDB
 */

interface Point {
  x: number;
  y: number;
  pressure: number;
}

interface Stroke {
  id: string;
  points: Point[];
  color: string;
  size: number;
}

export interface HandwritingData {
  id: string;
  workTitle: string;
  pageNumber: number;
  strokes: Stroke[];
  createdAt: Date;
  updatedAt: Date;
}

const DB_NAME = 'feel4-handwriting';
const DB_VERSION = 1;
const STORE_NAME = 'drawings';

/**
 * Initialize IndexedDB
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        objectStore.createIndex('workTitle', 'workTitle', { unique: false });
        objectStore.createIndex('pageNumber', 'pageNumber', { unique: false });
        objectStore.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
  });
}

/**
 * Save handwriting data
 */
export async function saveHandwriting(data: HandwritingData): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const updatedData = {
      ...data,
      updatedAt: new Date(),
    };

    const request = store.put(updatedData);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Load handwriting data by ID
 */
export async function loadHandwriting(id: string): Promise<HandwritingData | null> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => {
      const result = request.result;
      if (result) {
        // Convert date strings back to Date objects
        result.createdAt = new Date(result.createdAt);
        result.updatedAt = new Date(result.updatedAt);
      }
      resolve(result || null);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Load all handwriting data for a specific work and page
 */
export async function loadHandwritingByWorkPage(
  workTitle: string,
  pageNumber: number
): Promise<HandwritingData | null> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.openCursor();

    let found: HandwritingData | null = null;

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        const data = cursor.value as HandwritingData;
        if (data.workTitle === workTitle && data.pageNumber === pageNumber) {
          data.createdAt = new Date(data.createdAt);
          data.updatedAt = new Date(data.updatedAt);
          found = data;
          resolve(found);
          return;
        }
        cursor.continue();
      } else {
        resolve(found);
      }
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * List all handwriting data
 */
export async function listAllHandwriting(): Promise<HandwritingData[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const results = request.result.map((item: HandwritingData) => ({
        ...item,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
      }));
      resolve(results);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Delete handwriting data
 */
export async function deleteHandwriting(id: string): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Export handwriting data as JSON
 */
export function exportHandwritingJSON(data: HandwritingData): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Import handwriting data from JSON
 */
export function importHandwritingJSON(json: string): HandwritingData {
  const data = JSON.parse(json);
  return {
    ...data,
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
  };
}

/**
 * Export handwriting data as SVG
 */
export function exportHandwritingSVG(
  data: HandwritingData,
  width: number,
  height: number
): string {
  const svgPaths = data.strokes
    .map((stroke) => {
      if (stroke.points.length < 2) return '';

      const pathData = stroke.points
        .map((point, i) => {
          const command = i === 0 ? 'M' : 'L';
          return `${command} ${point.x},${point.y}`;
        })
        .join(' ');

      return `<path d="${pathData}" stroke="${stroke.color}" stroke-width="${stroke.size}" fill="none" stroke-linecap="round" stroke-linejoin="round" />`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  ${svgPaths}
</svg>`;
}

/**
 * Clear all handwriting data (use with caution)
 */
export async function clearAllHandwriting(): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
