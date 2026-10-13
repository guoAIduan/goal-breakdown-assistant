// EXPORTS: useBreakdownStore, useMyTemplatesStore
import { useSyncExternalStore } from 'react';
import type { IBreakdownRecord, IUserTemplate } from '@/data/breakdown';
import { createEmitter, onStorageChange, readJSON, writeJSON } from '@/lib/storage';

const HISTORY_KEY = 'breakdown_history';
const TEMPLATES_KEY = 'my_templates';

interface AppState {
  records: IBreakdownRecord[];
  templates: IUserTemplate[];
}

const emitter = createEmitter();

/**
 * 模块级单例 store：首页、拆解页、我的页面共享同一份数据。
 * 之前每个页面各持一份 useState 副本，同时挂载时会互相覆盖写入，这里统一收口。
 */
let state: AppState = {
  records: readJSON<IBreakdownRecord[]>(HISTORY_KEY, []),
  templates: readJSON<IUserTemplate[]>(TEMPLATES_KEY, []),
};

function subscribe(listener: () => void) {
  return emitter.subscribe(listener);
}

function getRecords(): IBreakdownRecord[] {
  return state.records;
}

function getTemplates(): IUserTemplate[] {
  return state.templates;
}

function setRecords(records: IBreakdownRecord[]) {
  state = { ...state, records };
  writeJSON(HISTORY_KEY, records);
  emitter.emit();
}

function setTemplates(templates: IUserTemplate[]) {
  state = { ...state, templates };
  writeJSON(TEMPLATES_KEY, templates);
  emitter.emit();
}

function reloadFromStorage() {
  state = {
    records: readJSON<IBreakdownRecord[]>(HISTORY_KEY, []),
    templates: readJSON<IUserTemplate[]>(TEMPLATES_KEY, []),
  };
  emitter.emit();
}

if (typeof window !== 'undefined') {
  onStorageChange(HISTORY_KEY, reloadFromStorage);
  onStorageChange(TEMPLATES_KEY, reloadFromStorage);
}

export function addRecord(record: IBreakdownRecord) {
  setRecords([record, ...state.records]);
}

export function updateRecord(id: string, updater: (record: IBreakdownRecord) => IBreakdownRecord) {
  setRecords(
    state.records.map((record) =>
      record.id === id ? { ...updater(record), updatedAt: Date.now() } : record,
    ),
  );
}

export function deleteRecord(id: string) {
  setRecords(state.records.filter((record) => record.id !== id));
}

export function findRecord(id: string) {
  return state.records.find((record) => record.id === id);
}

export function addTemplate(template: IUserTemplate) {
  setTemplates([template, ...state.templates]);
}

export function updateTemplate(id: string, template: IUserTemplate) {
  setTemplates(
    state.templates.map((item) => (item.id === id ? { ...template, updatedAt: Date.now() } : item)),
  );
}

export function deleteTemplate(id: string) {
  setTemplates(state.templates.filter((template) => template.id !== id));
}

export function findTemplate(id: string) {
  return state.templates.find((template) => template.id === id);
}

export function useBreakdownStore() {
  const records = useSyncExternalStore(subscribe, getRecords);
  return { records, addRecord, updateRecord, deleteRecord, getRecord: findRecord };
}

export function useMyTemplatesStore() {
  const templates = useSyncExternalStore(subscribe, getTemplates);
  return { templates, addTemplate, updateTemplate, deleteTemplate, getTemplate: findTemplate };
}
