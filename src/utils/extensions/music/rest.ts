import types from '@kyflx-dev/lavalink-types';
import fetch from 'node-fetch';
import { SpotifyParser, LavalinkTrack } from 'spotilink';

const spotilink = new SpotifyParser({ 
    host: process.env.HOST, 
    password: process.env.PASSWORD, 
    port: process.env.PORT 
  }, 
  process.env.SPOTIFY_ID, 
  process.env.SPOTIFY_SECRET
);

interface TrackInfo {
    flags?: number;
    source: string;
    identifier: string;
    author: string;
    length: bigint;
    isStream: boolean;
    position: bigint;
    title: string;
    uri: string | null;
    version?: number;
    probeInfo?: { raw: string, name: string, parameters: string | null };
}

let token: spotifyToken;

export default class rest {
    public static async search(track: string) {
        if (/(?:https?:\/\/|)?(?:www\.)?open\.spotify\.com\/track\/([a-z0-9\d-_]+)/gi.test(track)) {
            const arr = track.split(/https?:\/\/(www\.)?open\.spotify\.com\/track\//gi);
            const result = arr[arr.length - 1].match(/([a-z0-9\d-_]+)/gi)[0];
            if (!result) return { loadType: "NO_MATCHES" };

            let song: LavalinkTrack;
            let loadType: string = "TRACK_LOADED";

            try {
              song = await spotilink.getTrack(result, true) as LavalinkTrack;
            } catch (e) {
              song = undefined;
              loadType = "LOAD_FAILED";
            }

            if (!song) return { loadType: "NO_MATCHES" };


            if (["NO_MATCHES", "LOAD_FAILED"].includes(loadType)) return { loadType: "NO_MATCHES" };
            else return { loadType: "TRACK_LOADED", tracks: [song] };
        } else if (/(?:https?:\/\/|)?(?:www\.)?open\.spotify\.com\/playlist\/([a-z0-9\d-_]+)/gi.test(track)) {
          const arr = track.split(/https?:\/\/(www\.)?open\.spotify\.com\/playlist\//gi);
          const result = arr[arr.length - 1].match(/([a-z0-9\d-_]+)/gi)[0];
          if (!result) return { loadType: "NO_MATCHES" };

          let songs: LavalinkTrack[];
          let loadType: string = "PLAYLIST_LOADED";
          let playlist: any;
          try {
            const token = await this.getSpotifyToken();
            playlist = await (
              await fetch(`https://api.spotify.com/v1/playlists/${result}`, {
                headers: {
                  authorization: `${token.tokenType} ${token.accessToken}`,
                  "User-Agent": "StereoMusicBot",
                  "Content-Type": "application/json",
                },
              })
            ).json();
            songs = await spotilink.getPlaylistTracks(result, true) as LavalinkTrack[];
          } catch (e) {
            songs = undefined;
            loadType = "LOAD_FAILED";
          }

          if (!songs) return { loadType: "NO_MATCHES" };

          if (["NO_MATCHES", "LOAD_FAILED"].includes(loadType)) return { loadType: "NO_MATCHES" };
          else return { loadType: "PLAYLIST_LOADED", tracks: songs, playlistInfo: { name: playlist.name } };
        }
      
        try {
            return await (
                await fetch(`http://${process.env.HOST}:${process.env.PORT}/loadtracks?identifier=${track}`, {
                    headers: {
                        Authorization: process.env.PASSWORD,
                    },
                })
            ).json();
        } catch (e) {
            return { loadType: 'LOAD_FAILED', message: 'Because of an unkown error I am not able to load your song' };
        }
    };

    public static async decode(track: string): Promise<TrackInfo> {
        return await (
            await fetch(`http://${process.env.HOST}:${process.env.PORT}/decodetrack?track=${track}`, {
                headers: {
                    Authorization: process.env.PASSWORD,
                },
            })
        ).json();
    }

    public static async getSpotifyToken(): Promise<spotifyToken> {
      if (!token)  {
        await fetch(`https://accounts.spotify.com/api/token?grant_type=client_credentials`, {
          method: "POST",
          headers: {
            authorization: `Basic ${Buffer.from(
              `${process.env.SPOTIFY_ID}:${process.env.SPOTIFY_SECRET}`
            ).toString("base64")}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        })
        .then((r) => r.json())
        .then((data) => {
          const { access_token, expires_in, token_type } = data;
      
          token = {
            accessToken: access_token,
            expiresIn: expires_in,
            tokenType: token_type,
            expiresAt: new Date(new Date().getTime() + (expires_in - 2000) * 1000),
          };
          setTimeout(() => token = null, token.expiresIn);
        });
    }

    return token;
  };
};

interface spotifyToken {
    accessToken: string,
    expiresIn: number,
    tokenType: string,
    expiresAt: Date
}