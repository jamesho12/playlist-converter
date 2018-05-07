const AUTH_URL = 'https://accounts.spotify.com/authorize';
const SPOTIFY_API_KEY = '5b438a66581e4737acfddeb0d2bd063b';

const YOUTUBE_URL = 'https://www.googleapis.com/youtube/v3/playlistItems';
const YOUTUBE_API_KEY = 'AIzaSyBgV3q8M71c-Hkqh3VmKzJSDlnoidrmuzM';

const CB_URL = 'http%3A%2F%2F192.168.1.207%3A8000';

let user_id = '';
let token = '';
let playlist_id = '';
let song_names = [];
let spotify_obj = [];
let playlist_len = 0;
let global_i = 0;

function requestUserId(auth_token) {
  $.ajax({
  	url: `https://api.spotify.com/v1/me`,
  	dataType: 'json',
  	beforeSend: function(xhr){
  		xhr.setRequestHeader('Accept', 'application/json');
  		xhr.setRequestHeader('Content-Type', 'application/json');
  		xhr.setRequestHeader('Authorization', `Bearer ${token}`);
  	},
  	success: getUserId
  }).fail(function(error) {
    // handle failed api requests
    console.log(error);
  });
}

function getUserId(data) {
  user_id = data.id;
  console.log(`The id is ${user_id}`);
}

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

  if(!_token) {
    let scopes = encodeURIComponent('playlist-modify-public playlist-modify-private');

    $('#login').text('Log In');
    $('#login').attr('href', `https://accounts.spotify.com/authorize?client_id=${SPOTIFY_API_KEY}&response_type=token&redirect_uri=${CB_URL}&scope=${scopes}`);
    $('#intro-screen').css('display', 'flex');
  } else {
    token = _token;
    user_id = requestUserId(token);

    console.log(`This token will expire in ${hash.expires_in} seconds`);
    console.log(`The token is ${token}`);

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
  spotify_obj = [];
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
    .replace('(Audio)', '')
    .replace(/(ft\.(.*))/g, '');
    //.replace(/(Prod By(.*))/g, '');
  // console.log(song);

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
  // console.log(data);

  let result = data.tracks.items[0];
  let title = "";
  let thumbnail_url = "";

  if(result) {
    title = result.name;
    thumbnail_url = result.album.images[1].url;

    spotify_obj.push({
      name: result.name,
      artist: result.artists[0].name,
      thumbnail_url: result.album.images[1].url,
      uri: result.uri,
      valid: true,
      selected: true
    });

    $('#spotify-list').append(`
      <li>
        <div></div>
        <div class="song-number">${global_i+1}</div>
        <img class="thumbnail" src='${spotify_obj[global_i].thumbnail_url}' alt="Spotify Album Thumbnail">
        <div class="song-name">${spotify_obj[global_i].name}</div>
        <input data-index= ${global_i} type="checkbox" checked>
      </li>
    `);
  } else {
    spotify_obj.push({
      valid: false,
    })

    $('#spotify-list').append(`
      <li>
        <div class="invalid-overlay"></div>
        <div class="song-number">${global_i+1}</div>
        <img class="thumbnail" src='images/no_image.jpg' alt="Invalid Album Cover">
        <div class="song-name">Invalid Song</div>
      </li>
    `);
  }

  if(global_i < playlist_len-1) {
    $('#spotify-list').append('<hr>');
  } else {
    $('#youtube-list').css('display', 'block');
    $('#spotify-list').css('display', 'block');
    $('#spotify-export').css('display', 'block');
    $('footer').removeClass('fixed-footer');

    console.log(spotify_obj);
  }

  global_i++;
  if(global_i < playlist_len)
    spotifySearch(song_names[global_i]);
}

function createPlaylist() {
  $('#spotify-export').submit(function(event) {
    event.preventDefault();

    $.ajax({
      url: `https://api.spotify.com/v1/users/${user_id}/playlists`,
      data: JSON.stringify({
        "name": $('#playlist-name').val(),
        "description": "Playlist created through Playlist Converter",
        "public": false
      }),
      dataType: 'json',
      beforeSend: function(xhr){
        xhr.setRequestHeader('Accept', 'application/json');
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      },
      success: getPlaylistId,
      type: 'POST'
    }).fail(function(error) {
      // handle failed api requests
      console.log(error);
    });
  });
}

function getPlaylistId(data) {
  playlist_id = data.id;
  console.log(`Playlist successfully created`);
  console.log(data);

  addSongs();
}

function getAllSongUri() {
  let uris = '';

  for(let i=0; i<playlist_len; i++) {
    console.log(spotify_obj[i].valid);

    if(spotify_obj[i].valid) {
      if(i > 0 && uris != '')
        uris += ',';
      uris += spotify_obj[i].uri;
    }
  }

  return uris;
}

function addSongs() {
  console.log('Adding songs');

  let uris = getAllSongUri();
  console.log(uris);

  $.ajax({
    url: `https://api.spotify.com/v1/users/${user_id}/playlists/${playlist_id}/tracks?uris=${uris}`,
    dataType: 'json',
    beforeSend: function(xhr){
      xhr.setRequestHeader('Accept', 'application/json');
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    },
    success: completeConversion,
    type: 'POST'
  }).fail(function(error) {
    // handle failed api requests
    console.log(error);
  });
}

function completeConversion(data) {
  console.log(`Songs successfully added`);
}

function checkboxListener() {
  $('ul').on('click', 'input', function(event) {
    console.log($(this).attr('data-index'));
    let index = parseInt($(this).attr('data-index'));
    spotify_obj[index].valid = !spotify_obj[index].valid;
    console.log(spotify_obj);    $(this).closest('li').find('div').first().toggleClass('invalid-overlay');
  });
}

function functionHandler() {
  // This function handles what content is displayed based on if a user has
  // logged in or not
  initHTML();

  // This function creates an event listener that handles an API call to get
  // the contents of a youtube playlist
  youtubeSearch();

  // This function creates an event listener that handles an API call to
  // create a spotify playlist and the export process
  createPlaylist();

  // This function creates an event listener that handles selecting or
  // deselecting a song from the playlist to be exported
  checkboxListener();
}

$(functionHandler);
