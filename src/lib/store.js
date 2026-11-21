// 資料層：本機快取 + Supabase 同步。
// - 未設定 Supabase 或網址沒有 ?t= 旅程 ID：本機模式（存在這台裝置）
// - 有旅程 ID：讀取雲端，寫入需 PIN，透過 Realtime broadcast 即時通知其他裝置
import { useSyncExternalStore } from 'react';
import { createClient } from '@supabase/supabase-js';
import { seedItems } from '../data/seed';

const SB_URL = import.meta.env.VITE_SUPABASE_URL;
const SB_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = SB_URL && SB_KEY ? createClient(SB_URL, SB_KEY, { auth: { persistSession: false } }) : null;

const LS = {
  get(k, fallback) {
    try {
      const v = localStorage.getItem(k);
      return v == null ? fallback : JSON.parse(v);
    } catch {
      return fallback;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch {
      /* 私密模式等情況忽略 */
    }
  },
  del(k) {
    try {
      localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  }
};

const toMap = (list) => Object.fromEntries(list.map((i) => [i.id, i]));

let state = {
  items: {},
  sync: { mode: 'local', status: 'idle', tripId: null, canEdit: true, error: null, configured: !!supabase },
  settings: LS.get('settings', { navApp: 'google' })
};
const listeners = new Set();
let needPinHandler = () => {};
let channel = null;
let pending = { upserts: {}, deletes: [] };
let flushTimer = null;

function emit(patch) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}
function setSync(patch) {
  emit({ sync: { ...state.sync, ...patch } });
}

const cacheKey = () => (state.sync.tripId ? `trip:${state.sync.tripId}:items` : 'trip:local:items');
const pinKey = (id) => `trip:${id}:pin`;
const pendingKey = () => `trip:${state.sync.tripId}:pending`;

function persist() {
  LS.set(cacheKey(), Object.values(state.items));
}

export const store = {
  getState: () => state,
  subscribe(l) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  onNeedPin(fn) {
    needPinHandler = fn;
  },

  async init() {
    const tripId = new URLSearchParams(location.search).get('t');
    if (!tripId || !supabase) {
      const local = LS.get('trip:local:items', null);
      emit({ items: toMap(local || seedItems) });
      setSync({ mode: 'local', tripId: null, canEdit: true, status: 'idle' });
      if (!local) persist();
      return;
    }
    const pin = LS.get(pinKey(tripId), null);
    setSync({ mode: 'remote', tripId, canEdit: !!pin, status: 'loading' });
    const cached = LS.get(`trip:${tripId}:items`, null);
    if (cached) emit({ items: toMap(cached) });
    pending = LS.get(`trip:${tripId}:pending`, { upserts: {}, deletes: [] });
    await this.refresh();
    this.subscribeRealtime();
    window.addEventListener('online', () => this.flush());
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') this.refresh();
    });
    if (Object.keys(pending.upserts).length || pending.deletes.length) this.flush();
  },

  async refresh() {
    if (state.sync.mode !== 'remote') return;
    const { data, error } = await supabase.rpc('trip_get', { p_trip: state.sync.tripId });
    if (error) {
      setSync({ status: navigator.onLine ? 'error' : 'offline', error: error.message });
      return;
    }
    if (data == null) {
      setSync({ status: 'error', error: '找不到這個旅程，請確認連結。' });
      return;
    }
    // 保留尚未上傳的本機修改
    const map = toMap(data);
    Object.values(pending.upserts).forEach((i) => (map[i.id] = i));
    pending.deletes.forEach((id) => delete map[id]);
    emit({ items: map });
    persist();
    setSync({ status: 'idle', error: null });
  },

  subscribeRealtime() {
    if (channel) supabase.removeChannel(channel);
    channel = supabase
      .channel(`trip-${state.sync.tripId}`, { config: { broadcast: { self: false } } })
      .on('broadcast', { event: 'change' }, ({ payload }) => {
        const items = { ...state.items };
        (payload.upserts || []).forEach((i) => (items[i.id] = i));
        (payload.deletes || []).forEach((id) => delete items[id]);
        emit({ items });
        persist();
      })
      .subscribe();
  },

  ensureEditable() {
    if (state.sync.canEdit) return true;
    needPinHandler();
    return false;
  },

  upsert(input) {
    if (!this.ensureEditable()) return false;
    const list = Array.isArray(input) ? input : [input];
    const items = { ...state.items };
    list.forEach((i) => (items[i.id] = { ...i }));
    emit({ items });
    persist();
    if (state.sync.mode === 'remote') {
      list.forEach((i) => (pending.upserts[i.id] = items[i.id]));
      pending.deletes = pending.deletes.filter((id) => !list.some((i) => i.id === id));
      this.scheduleFlush();
    }
    return true;
  },

  patch(id, fields) {
    const cur = state.items[id];
    if (!cur) return false;
    return this.upsert({ ...cur, ...fields });
  },

  remove(ids) {
    if (!this.ensureEditable()) return false;
    const list = Array.isArray(ids) ? ids : [ids];
    const items = { ...state.items };
    list.forEach((id) => delete items[id]);
    emit({ items });
    persist();
    if (state.sync.mode === 'remote') {
      list.forEach((id) => delete pending.upserts[id]);
      pending.deletes = [...new Set([...pending.deletes, ...list])];
      this.scheduleFlush();
    }
    return true;
  },

  scheduleFlush() {
    LS.set(pendingKey(), pending);
    setSync({ status: 'saving' });
    clearTimeout(flushTimer);
    flushTimer = setTimeout(() => this.flush(), 500);
  },

  async flush() {
    if (state.sync.mode !== 'remote') return;
    const pin = LS.get(pinKey(state.sync.tripId), null);
    const upserts = Object.values(pending.upserts);
    const deletes = [...pending.deletes];
    if (!upserts.length && !deletes.length) return;
    if (!navigator.onLine) {
      setSync({ status: 'offline' });
      return;
    }
    setSync({ status: 'saving' });
    try {
      if (upserts.length) {
        const { error } = await supabase.rpc('trip_upsert_items', { p_trip: state.sync.tripId, p_pin: pin, p_items: upserts });
        if (error) throw error;
      }
      if (deletes.length) {
        const { error } = await supabase.rpc('trip_delete_items', { p_trip: state.sync.tripId, p_pin: pin, p_ids: deletes });
        if (error) throw error;
      }
      upserts.forEach((i) => {
        if (pending.upserts[i.id] === i) delete pending.upserts[i.id];
      });
      pending.deletes = pending.deletes.filter((id) => !deletes.includes(id));
      LS.set(pendingKey(), pending);
      channel?.send({ type: 'broadcast', event: 'change', payload: { upserts, deletes } });
      setSync({ status: 'idle', error: null });
    } catch (e) {
      const msg = e?.message || String(e);
      if (msg.includes('PIN')) {
        LS.del(pinKey(state.sync.tripId));
        setSync({ status: 'error', canEdit: false, error: 'PIN 已失效，請重新輸入。' });
        needPinHandler();
      } else {
        setSync({ status: navigator.onLine ? 'error' : 'offline', error: msg });
        clearTimeout(flushTimer);
        flushTimer = setTimeout(() => this.flush(), 8000);
      }
    }
  },

  async enterPin(pin) {
    const { data, error } = await supabase.rpc('trip_check_pin', { p_trip: state.sync.tripId, p_pin: pin });
    if (error) throw new Error(error.message);
    if (!data) return false;
    LS.set(pinKey(state.sync.tripId), pin);
    setSync({ canEdit: true, error: null });
    this.flush();
    return true;
  },

  /** 把目前資料上傳成新的共享旅程，回傳分享連結 */
  async createShared(pin) {
    if (!supabase) throw new Error('尚未設定 Supabase');
    const { data, error } = await supabase.rpc('trip_create', { p_pin: pin, p_items: Object.values(state.items) });
    if (error) throw new Error(error.message);
    LS.set(pinKey(data), pin);
    LS.set(`trip:${data}:items`, Object.values(state.items));
    const url = `${location.origin}${location.pathname}?t=${data}`;
    history.replaceState(null, '', url);
    setSync({ mode: 'remote', tripId: data, canEdit: true, status: 'idle' });
    pending = { upserts: {}, deletes: [] };
    this.subscribeRealtime();
    return url;
  },

  resetLocal() {
    if (state.sync.mode !== 'local') return;
    emit({ items: toMap(seedItems) });
    persist();
  },

  setSetting(key, value) {
    const settings = { ...state.settings, [key]: value };
    LS.set('settings', settings);
    emit({ settings });
  }
};

export function useStore(selector) {
  return useSyncExternalStore(store.subscribe, () => selector(state));
}

// 常用查詢
export function selectByKind(items, kind) {
  return Object.values(items).filter((i) => i.kind === kind);
}

export function useKind(kind) {
  const items = useStore((s) => s.items);
  return selectByKind(items, kind);
}
