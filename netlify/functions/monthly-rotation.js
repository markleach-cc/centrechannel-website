// netlify/functions/monthly-rotation.js
// 
// Fetches top tracks from the last month from Last.fm
// 
// Environment variables needed (same as now-playing):
// LASTFM_API_KEY
// LASTFM_USERNAME

const LASTFM_API_KEY = process.env.LASTFM_API_KEY;
const LASTFM_USERNAME = process.env.LASTFM_USERNAME;

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const url = `https://ws.audioscrobbler.com/2.0/?method=user.gettoptracks&user=${LASTFM_USERNAME}&api_key=${LASTFM_API_KEY}&format=json&period=1month&limit=5`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: data.message })
      };
    }

    const tracks = data.toptracks?.track || [];
    
    if (!tracks.length) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          tracks: [],
          period: '1month'
        })
      };
    }

    const result = {
      period: '1month',
      tracks: tracks.map((track, index) => ({
        rank: index + 1,
        name: track.name,
        artist: track.artist?.name || track.artist,
        playcount: parseInt(track.playcount, 10),
        image: track.image?.find(img => img.size === 'large')?.['#text'] || 
               track.image?.find(img => img.size === 'medium')?.['#text'] ||
               null,
        url: track.url
      }))
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
      body: JSON.stringify({ error: 'Failed to fetch top tracks' })
    };
  }
};
