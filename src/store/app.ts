import { persistentAtom } from '@nanostores/persistent';
import { AppPreferences } from '@/types/app';

const defaultPreferences: AppPreferences = {
    theme: 'light',
    sidebarState: 'expanded',
    viewMode: 'grid',
};

export const appPreferencesStore = persistentAtom<AppPreferences>('appPreferences', defaultPreferences, {
    encode: JSON.stringify,
    decode: JSON.parse,
});