import { FieldPolicy, FieldReadFunction } from '@apollo/client';

export default function discoveriesCache(): FieldPolicy<any> | FieldReadFunction<any> {
  return ({
    keyArgs: [],
    read(existing, { args }) {
      const offset = args?.offset || 0;
      const limit = args?.limit || 0;

      return existing && {
        discoveries: existing.discoveries.slice(offset, offset + limit),
        numDiscoveries: existing.numDiscoveries,
      };
    },
    merge(existing, incoming, { args }) {
      const offset = args?.offset || 0;

      // Slicing is necessary because the existing data is
      // immutable, and frozen in development.
      const merged = existing ? existing.discoveries.slice(0) : [];
      for (let i = 0; i < incoming.discoveries.length; i += 1) {
        merged[offset + i] = incoming.discoveries[i];
      }

      return {
        discoveries: merged,
        numDiscoveries: incoming.numDiscoveries,
      };
    },
  });
}
