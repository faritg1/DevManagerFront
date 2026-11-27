import { useState } from 'react';

/**
 * Latest-wins guard for requests that depend on something the user can change (a filter, a tab, the open record).
 * Wrap each request of one stream: `latest(service.list(filter))`. Only the newest wrapped request settles;
 * a superseded one never does, so its `then`/`finally` cannot overwrite the newer answer.
 * Use one guard per independent stream, and never wrap a request a handler awaits to release a busy flag.
 */
export const useLatest = () => useState(() => {
    let seq = 0;
    return <T,>(request: Promise<T>): Promise<T> => {
        const id = ++seq;
        return new Promise<T>((resolve, reject) => request.then(
            (value) => { if (id === seq) resolve(value); },
            (error) => { if (id === seq) reject(error); },
        ));
    };
})[0];
