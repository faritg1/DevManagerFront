import { useEffect, useState } from 'react';
import { organizationsService } from '../api';
import type { ActivitiesSettings } from '../api/types';
import { STORAGE_KEYS } from '../config/constants';

export const DEFAULT_ACTIVITIES_SETTINGS: ActivitiesSettings = {
    showOnProjectDetail: true, showMyWorkOnDashboard: true, sprintsEnabled: false, timeTrackingEnabled: false, dependenciesEnabled: false,
};

/** One request per signed-in session: keyed by the token, so another login reads its own organization. */
let cache: { token: string | null; settings: Promise<ActivitiesSettings> } | null = null;

const load = (): Promise<ActivitiesSettings> => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (cache?.token !== token) {
        cache = {
            token,
            settings: organizationsService.getCurrent()
                .then((r) => ({ ...DEFAULT_ACTIVITIES_SETTINGS, ...r.data?.activitiesSettings }))
                .catch(() => DEFAULT_ACTIVITIES_SETTINGS),
        };
    }
    return cache.settings;
};

/** Call after the organization settings are saved, with the saved value. */
export const setActivitiesSettings = (settings: ActivitiesSettings | undefined) => {
    cache = { token: localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN), settings: Promise.resolve({ ...DEFAULT_ACTIVITIES_SETTINGS, ...settings }) };
};

/** The organization's activities module settings; defaults (sprints, time tracking and dependencies off, the rest on) while loading or when they cannot be read. */
export const useActivitiesSettings = (): ActivitiesSettings => {
    const [settings, setSettings] = useState(DEFAULT_ACTIVITIES_SETTINGS);
    useEffect(() => {
        let live = true;
        load().then((s) => live && setSettings(s));
        return () => { live = false; };
    }, []);
    return settings;
};
