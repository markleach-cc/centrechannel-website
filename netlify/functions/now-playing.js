// netlify/functions/now-playing.js
// 
// Fetches currently playing or recently played track from Last.fm
// 
// Environment variable needed in Netlify:
// LASTFM_API_KEY = 56aedea14f1654f1ef07d29b8a78c3a6
// LASTFM_USERNAME = themarkleach

const LASTFM_API_KEY = process.env.LASTFM_API_KEY;
const LASTFM_USERNAME = process.env.LASTFM_USERNAME;

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=30' // Cache for 30 seconds
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const url = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${LASTFM_USERNAME}&api_key=${LASTFM_API_KEY}&format=json&limit=1`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: data.message })
      };
    }

    const track = data.recenttracks?.track?.[0];
    
    if (!track) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          isPlaying: false,
          track: null 
        })
      };
    }

    // Check if currently playing (has @attr.nowplaying)
    const isPlaying = track['@attr']?.nowplaying === 'true';

    const result = {
      isPlaying,
      track: {
        name: track.name,
        artist: track.artist['#text'],
        album: track.album['#text'],
        image: track.image?.find(img => img.size === 'extralarge')?.['#text'] || 
               track.image?.find(img => img.size === 'large')?.['#text'] ||
               null,
        url: track.url
      }
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('Last.fm API error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to fetch track data' })
    };
  }
};
