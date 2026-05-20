import localforage from 'localforage';

export const audioStore = localforage.createInstance({
  name: 'AI_StudyFlow',
  storeName: 'audio_scapes',
  description: 'Offline storage for focus soundscapes',
});

export const saveAudioFile = async (key: string, file: Blob): Promise<void> => {
  try {
    await audioStore.setItem(key, file);
  } catch (error) {
    console.error(`Failed to save audio file ${key}:`, error);
  }
};

export const getAudioFile = async (key: string): Promise<Blob | null> => {
  try {
    return await audioStore.getItem<Blob>(key);
  } catch (error) {
    console.error(`Failed to get audio file ${key}:`, error);
    return null;
  }
};

export const removeAudioFile = async (key: string): Promise<void> => {
  try {
    await audioStore.removeItem(key);
  } catch (error) {
    console.error(`Failed to remove audio file ${key}:`, error);
  }
};
