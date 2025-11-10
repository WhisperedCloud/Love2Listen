export interface Song {
  id: number;
  queueId?: string; // Unique identifier for a song instance in the queue
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  coverArt: string;
  url: string; // URL to a dummy mp3 file or blob URL
  lyrics?: string;
}

export interface Playlist {
  id: number;
  name: string;
  songs: Song[];
  coverArt: string;
}

export enum RepeatMode {
    NONE = 'none',
    PLAYLIST = 'playlist',
    SONG = 'song',
}
