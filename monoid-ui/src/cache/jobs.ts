import { FieldPolicy, FieldReadFunction } from '@apollo/client';

export default function jobsQueryCache(): FieldPolicy<any> | FieldReadFunction<any> {
  return ({
    keyArgs: ['resourceId', 'jobType', 'status', 'query'],
    read(existing, { args }) {
      const offset = args?.offset || 0;
      const limit = args?.limit || 0;

      return existing && {
        jobs: existing.jobs.slice(offset, offset + limit),
        numJobs: existing.numJobs,
      };
    },
    merge(existing, incoming, { args }) {
      const offset = args?.offset || 0;
      const limit = args?.limit || 0;

      // Slicing is necessary because the existing data is
      // immutable, and frozen in development.
      let merged = existing ? existing.jobs.slice(0) : [];

      if (incoming.jobs) {
        for (let i = 0; i < incoming.jobs.length || 0; i += 1) {
          merged[offset + i] = incoming.jobs[i];
        }

        if (incoming.jobs.length < limit) {
          merged = merged.slice(0, offset + incoming.jobs.length);
        }
      }

      return {
        ...incoming,
        jobs: merged,
        numJobs: incoming.numJobs || existing?.numJobs,
      };
    },
  });
}
