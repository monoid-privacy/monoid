import { FieldPolicy, FieldReadFunction } from '@apollo/client';

export default function discoveriesCache(): FieldPolicy<any> | FieldReadFunction<any> {
  return ({
    keyArgs: ['query', 'statuses'],
    read(existing, { args }) {
      const offset = args?.offset || 0;
      const limit = args?.limit || 0;

      const res = existing && {
        ...existing,
        discoveries: existing.discoveries?.slice(offset, offset + limit),
      };

      return res;
    },
    merge(existing, incoming, { args }) {
      if (!incoming) {
        return existing;
      }

      const offset = args?.offset || 0;

      // Slicing is necessary because the existing data is
      // immutable, and frozen in development.
      const merged = (existing && existing.discoveries) ? existing.discoveries.slice(0) : [];

      if (incoming && incoming.discoveries) {
        for (let i = 0; i < incoming.discoveries.length; i += 1) {
          merged[offset + i] = incoming.discoveries[i];
        }
      }

      const r = {
        ...incoming,
        numDiscoveries: incoming?.numDiscoveries || existing?.numDiscoveries,
        discoveries: merged,
      };

      return r;
    },
  });
}
