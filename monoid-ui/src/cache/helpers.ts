import { FieldMergeFunction, FieldReadFunction } from '@apollo/client';

export const paginationRead: (fieldName: string) => FieldReadFunction = (
  (fieldName) => (existing, { args }) => {
    const offset = args?.offset || 0;
    const limit = args?.limit || 0;

    const res = existing && {
      ...existing,
      [fieldName]: existing[fieldName]?.slice(offset, offset + limit),
    };

    return res;
  }
);

export const paginationMerge: (fieldName: string, countName: string) => FieldMergeFunction = (
  (fieldName, countName) => (existing, incoming, { args }) => {
    if (!incoming) {
      return existing;
    }

    const offset = args?.offset || 0;
    const limit = args?.limit || 0;
    let merged = (existing && existing[fieldName]) ? existing[fieldName].slice(0) : undefined;

    if (incoming[fieldName]) {
      if (!merged) {
        merged = [];
      }

      for (let i = 0; i < incoming[fieldName].length; i += 1) {
        merged[offset + i] = incoming[fieldName][i];
      }

      if (incoming[fieldName].length < limit) {
        merged = merged.slice(0, offset + incoming[fieldName].length);
      }
    }

    const r = {
      ...incoming,
      [countName]: incoming[countName] || (existing && existing[countName]),
      [fieldName]: merged,
    };

    return r;
  }
);
