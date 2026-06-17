export interface MusicTrack {
  name: string;
  url: string;
}

export function getMusicTracks(): MusicTrack[] {
  // Vite macro to gather all files in the directory at build time
  // This produces an object mapping file path to module (the URL if using ?url)
  const tracks = import.meta.glob('/public/music/*.{mp3,wav,ogg,m4a,flac}', { eager: true, query: '?url', import: 'default' });

  return Object.entries(tracks).map(([path, url]) => {
    // path looks like: /public/music/relaxing-145038.mp3
    // Extract the filename without extension for display
    const filename = path.split('/').pop() || '';
    const name = filename.replace(/\.[^/.]+$/, '');

    return {
      name,
      url: url as string,
    };
  });
}
