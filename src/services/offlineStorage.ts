/**
 * Serviço de Armazenamento Local e Sincronização Offline CONQUITECH-MA
 * Utiliza IndexedDB com fallback automático para localStorage.
 * Garante que os monitores registrem presenças mesmo sem internet,
 * enfileirando as ações e sincronizando automaticamente assim que a conexão retornar.
 */

import { Presenca, Monitor, AcaoLog } from '../rules';

const DB_NAME = 'CONQUITECH_OFFLINE_DB';
const DB_VERSION = 1;

export interface ItemFilaSincronizacao {
  id: string;
  tipo: 'MARCAR_PRESENCA' | 'DESMARCAR_PRESENCA' | 'RETROATIVO';
  payload: {
    presenca?: Presenca;
    monitorId?: string;
    dia?: number;
    turno?: string;
    justificativa?: string;
  };
  criadoEm: number;
  descricao: string;
}

// Inicializar IndexedDB
function abrirBanco(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB não suportado'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('presencas')) {
        db.createObjectStore('presencas', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('monitores')) {
        db.createObjectStore('monitores', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('fila_sync')) {
        db.createObjectStore('fila_sync', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('logs')) {
        db.createObjectStore('logs', { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const offlineStorage = {
  // 1. PRESENÇAS
  async salvarPresencas(presencas: Presenca[]): Promise<void> {
    try {
      localStorage.setItem('conquitech_presencas', JSON.stringify(presencas));
    } catch {}

    try {
      const db = await abrirBanco();
      const tx = db.transaction('presencas', 'readwrite');
      const store = tx.objectStore('presencas');
      store.clear();
      for (const p of presencas) {
        store.put(p);
      }
    } catch {}
  },

  async carregarPresencas(): Promise<Presenca[]> {
    // 1º Tenta IndexedDB
    try {
      const db = await abrirBanco();
      const tx = db.transaction('presencas', 'readonly');
      const store = tx.objectStore('presencas');
      const req = store.getAll();
      const items = await new Promise<Presenca[]>((res, rej) => {
        req.onsuccess = () => res(req.result || []);
        req.onerror = () => rej(req.error);
      });
      if (items && items.length > 0) return items;
    } catch {}

    // Fallback para localStorage
    try {
      const salvo = localStorage.getItem('conquitech_presencas');
      if (salvo) return JSON.parse(salvo);
    } catch {}

    return [];
  },

  // 2. FILA DE SINCRONIZAÇÃO OFFLINE
  async adicionarItemFila(item: ItemFilaSincronizacao): Promise<void> {
    const filaAtual = await this.obterFilaSincronizacao();
    const novaFila = [...filaAtual.filter((f) => f.id !== item.id), item];

    try {
      localStorage.setItem('conquitech_fila_sync', JSON.stringify(novaFila));
    } catch {}

    try {
      const db = await abrirBanco();
      const tx = db.transaction('fila_sync', 'readwrite');
      tx.objectStore('fila_sync').put(item);
    } catch {}
  },

  async removerItemFila(itemId: string): Promise<void> {
    const filaAtual = await this.obterFilaSincronizacao();
    const novaFila = filaAtual.filter((f) => f.id !== itemId);

    try {
      localStorage.setItem('conquitech_fila_sync', JSON.stringify(novaFila));
    } catch {}

    try {
      const db = await abrirBanco();
      const tx = db.transaction('fila_sync', 'readwrite');
      tx.objectStore('fila_sync').delete(itemId);
    } catch {}
  },

  async limparFilaSincronizacao(): Promise<void> {
    try {
      localStorage.removeItem('conquitech_fila_sync');
    } catch {}

    try {
      const db = await abrirBanco();
      const tx = db.transaction('fila_sync', 'readwrite');
      tx.objectStore('fila_sync').clear();
    } catch {}
  },

  async obterFilaSincronizacao(): Promise<ItemFilaSincronizacao[]> {
    try {
      const db = await abrirBanco();
      const tx = db.transaction('fila_sync', 'readonly');
      const store = tx.objectStore('fila_sync');
      const req = store.getAll();
      const items = await new Promise<ItemFilaSincronizacao[]>((res, rej) => {
        req.onsuccess = () => res(req.result || []);
        req.onerror = () => rej(req.error);
      });
      if (items && items.length > 0) return items;
    } catch {}

    try {
      const salvo = localStorage.getItem('conquitech_fila_sync');
      if (salvo) return JSON.parse(salvo);
    } catch {}

    return [];
  },

  // 3. MONITORES
  async salvarMonitores(monitores: Monitor[]): Promise<void> {
    try {
      localStorage.setItem('conquitech_monitores', JSON.stringify(monitores));
    } catch {}

    try {
      const db = await abrirBanco();
      const tx = db.transaction('monitores', 'readwrite');
      const store = tx.objectStore('monitores');
      store.clear();
      for (const m of monitores) {
        store.put(m);
      }
    } catch {}
  },

  async carregarMonitores(): Promise<Monitor[]> {
    try {
      const db = await abrirBanco();
      const tx = db.transaction('monitores', 'readonly');
      const req = tx.objectStore('monitores').getAll();
      const items = await new Promise<Monitor[]>((res, rej) => {
        req.onsuccess = () => res(req.result || []);
        req.onerror = () => rej(req.error);
      });
      if (items && items.length > 0) return items;
    } catch {}

    try {
      const salvo = localStorage.getItem('conquitech_monitores');
      if (salvo) return JSON.parse(salvo);
    } catch {}

    return [];
  },
};
