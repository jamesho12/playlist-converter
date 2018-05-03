const AUTH_URL = 'https://accounts.spotify.com/authorize';
const SPOTIFY_API_KEY = '5b438a66581e4737acfddeb0d2bd063b';

const YOUTUBE_URL = 'https://www.googleapis.com/youtube/v3/playlistItems';
const YOUTUBE_API_KEY = 'AIzaSyBgV3q8M71c-Hkqh3VmKzJSDlnoidrmuzM';

const CB_URL = 'http%3A%2F%2F192.168.1.207%3A8000';

let token = '';
let song_names = [];
let playlist_len = 0;
let global_i = 0;

function initHTML() {
  const hash = window.location.hash
  .substring(1)
  .split('&')
  .reduce(function (initial, item) {
    if (item) {
      var parts = item.split('=');
      initial[parts[0]] = decodeURIComponent(parts[1]);
    }
    return initial;
  }, {});
  window.location.hash = '';
  let _token = hash.access_token;
  console.log(hash.expires_in);

  if(!_token) {
    $('#login').text('Log In');
    $('#login').attr('href', `https://accounts.spotify.com/authorize?client_id=${SPOTIFY_API_KEY}&response_type=token&redirect_uri=${CB_URL}`);
    $('#intro-screen').css('display', 'flex');
  } else {
    token = _token;
    console.log(`The token is ${_token}.`);

    $('#login').text('Profile');
    $('#login').attr('href', 'https://www.spotify.com/us/account/overview/');
    $('#login').attr('target', '_blank');
    $('#logged-screen').css('display', 'flex');
  }
}

function getParameterByName(name) {
    url = $('#youtube-url').val();
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function youtubeSearch() {
  $('#youtube-search').submit(function(event) {
    event.preventDefault();

    console.log(getParameterByName('list'));

    const query = {
      part: 'snippet,contentDetails',
      key: YOUTUBE_API_KEY,
      maxResults: 10,
      playlistId: getParameterByName('list')
    }

    $.getJSON(YOUTUBE_URL, query, showYoutubeList)
      .fail(function(error) {
          console.log(error);
    });
  });
}

function showYoutubeList(data) {
  console.log(data);

  $("li").remove();
  $("hr").remove();

  global_i = 0;
  song_names = [];
  playlist_len = data.items.length;
  console.log(`The number of songs is ${playlist_len}`);

  for(let i=0; i<playlist_len; i++) {
    let title = data.items[i].snippet.title;
    let thumbnail_url = data.items[i].snippet.thumbnails.default.url;

    $('#youtube-list').append(`
      <li>
        <div class="song-number">${i+1}</div>
        <img class="thumbnail" src='${thumbnail_url}' alt="Youtube Thumbnail">
        <div class="song-name">${title}</div>
        <input type="checkbox">
      </li>
    `);

    if(i < playlist_len-1)
      $('#youtube-list').append('<hr>');

    song_names.push(title);
  }

  spotifySearch(song_names[global_i]);
}

function spotifySearch(raw_song) {
  let song = raw_song
    .replace(/([\(|\[]Official(.*))/g, '')
    .replace(/([\(|\[](.*))/g, '')
    .replace('(Audio)', '');
  console.log(song);

  $.ajax({
  	url: `https://api.spotify.com/v1/search?q=${encodeURIComponent(song)}&type=track&limit=1&offset=0`,
  	dataType: 'json',
  	beforeSend: function(xhr){
  		xhr.setRequestHeader('Accept', 'application/json');
  		xhr.setRequestHeader('Content-Type', 'application/json');
  		xhr.setRequestHeader('Authorization', `Bearer ${token}`);
  	},
  	success: appendSpotifyList
  }).fail(function(error) {
    // handle failed api requests
    console.log(error);
  });
}

function appendSpotifyList(data) {
  let json = JSON.stringify(data, null, '\t');
  console.log(data);

  let result = data.tracks.items[0];
  let title = "";
  let thumbnail_url = "";

  if(result) {
    title = data.tracks.items[0].name;
    thumbnail_url = data.tracks.items[0].album.images[1].url;
  }

  $('#spotify-list').append(`
    <li>
      <div class="song-number">${global_i+1}</div>
      <img class="thumbnail" src='${thumbnail_url}' alt="Spotify Thumbnail">
      <div class="song-name">${title}</div>
      <input type="checkbox">
    </li>
  `);

  if(global_i < playlist_len-1) {
    $('#spotify-list').append('<hr>');
  } else {
    $('#youtube-list').css('display', 'block');
    $('#spotify-list').css('display', 'block');
    $('footer').removeClass('fixed-footer');
  }

  global_i++;
  if(global_i < playlist_len)
    spotifySearch(song_names[global_i]);
}

function functionHandler() {
  initHTML();
  youtubeSearch();
}

$(functionHandler);
