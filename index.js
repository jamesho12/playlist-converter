const AUTH_URL = 'https://accounts.spotify.com/authorize';
const SPOTIFY_API_KEY = '5b438a66581e4737acfddeb0d2bd063b';

const YOUTUBE_URL = 'https://www.googleapis.com/youtube/v3/playlistItems';
const YOUTUBE_API_KEY = 'AIzaSyBgV3q8M71c-Hkqh3VmKzJSDlnoidrmuzM';

const CB_URL = 'https://192.168.1.207:8000';
const DP_URL = 'http://ohjamesho.com/playlist-converter'

let user_id = '';
let token = '';
let yt_playlist_id = '';
let playlist_len = 0;
let selected_songs = 0;
let global_i = 0;

let playlist_id = '';
let song_names = [];
let spotify_obj = [];


function reset() {
  $("#playlists li").remove();
  $("hr").remove();

  playlist_len = 0;
  song_names = [];
  spotify_obj = [];
  global_i = 0;

  $('#youtube-error').css('color', 'coral');
  $('#youtube-error').text('Loading...');
}

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
  console.debug(`The id is ${user_id}`);
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
    $('#login').attr('href', `https://accounts.spotify.com/authorize?client_id=${SPOTIFY_API_KEY}&response_type=token&redirect_uri=${encodeURIComponent(DP_URL)}&scope=${scopes}`);
    $('#intro-screen').css('display', 'flex');
  } else {
    token = _token;
    user_id = requestUserId(token);

    console.debug(`This token will expire in ${hash.expires_in} seconds`);
    console.debug(`The token is ${token}`);

    $('#login').text('Profile');
    $('#login').attr('href', 'https://www.spotify.com/us/account/overview/');
    $('#login').attr('target', '_blank');
    $('#logged-screen').css('display', 'flex');
    $('.bg-wrapper').css('height', '50vh');
    $('h2').css('display','none');
    $('.instructions').css('display','block');
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

    yt_playlist_id = getParameterByName('list');

    const query = {
      part: 'snippet,contentDetails',
      key: YOUTUBE_API_KEY,
      maxResults: 50,
      playlistId: yt_playlist_id
    }

    $.getJSON(YOUTUBE_URL, query, startYoutubeList)
      .fail(function(error) {
        switch(error.status) {
          case 403:
            console.debug('playlistItemsNotAccessible');
            $('#youtube-error').text('Playlist cannot be accessed (private or watch later playlist)');
            break;
          case 404:
            $('#youtube-error').text('Playlist not found');
            break;
        }
    });
  });
}

function startYoutubeList(data) {
  console.debug(data);

  if(data.prevPageToken == undefined) {
    reset();
  }

  let len = data.items.length;
  playlist_len += data.items.length;
  let pageToken = data.nextPageToken || "";

  console.debug(`The number of songs is ${playlist_len}`);
  $('#youtube-error').text('Loading...');
  $('#results-num').text(`${playlist_len} songs in playlist`);
  $('#logged-screen').css('height', 'auto');
  $('#youtube-list').addClass('show-list');
  $('#toggle-yt-list').addClass('show-toggle');

  if($('#results-num').text() !== '')
    $('#results-num').text(`${data.pageInfo.totalResults} songs in playlist`);

  for(let i=0; i<len; i++) {
    let title = data.items[i].snippet.title;
    let thumbnail_url = ""
    
    try {
      thumbnail_url = data.items[i].snippet.thumbnails.default.url
    } catch(error) {
      "https://www.freeiconspng.com/uploads/no-image-icon-21.png"
    }    

    $('#youtube-list').append(`
      <li>
        <div class="song-number">${playlist_len - data.items.length + i + 1}</div>
        <img class="thumbnail" src='${thumbnail_url}' alt="Youtube Thumbnail">
        <div class="song-name">${title}</div>
      </li>
    `);

    if(playlist_len - data.items.length + i < data.pageInfo.totalResults - 1)
      $('#youtube-list').append('<hr>');

    song_names.push(title);
  }

  if(pageToken != "") {
    const query = {
      part: 'snippet,contentDetails',
      key: YOUTUBE_API_KEY,
      maxResults: 50,
      playlistId: yt_playlist_id,
      pageToken: pageToken
    }

    $.getJSON(YOUTUBE_URL, query, startYoutubeList)
      .fail(function(error) {
        switch(error.status) {
          case 403:
            console.debug('playlistItemsNotAccessible');
            $('#youtube-error').text('Playlist cannot be accessed (private or watch later playlist)');
            break;
          case 404:
            $('#youtube-error').text('Playlist not found');
            break;
        }
    });
  } else {
    // console.debug(song_names);
    spotifySearch(song_names[global_i]);
  }
}

function spotifySearch(raw_song) {     
  let song = raw_song
    .replace(/([\(|\[]Official(.*))/g, '')
    .replace(/(\[(.*?)\]|\((.*?)\)|\|(.*?)\|)/g, '')    
    .replace('(Audio)', '')
    .replace(/(ft\.(.*))/g, '')
    .replace(/([\(|\[](.*))/g, '');
    //.replace(/(Prod By(.*))/g, '');
  // console.debug(song);
  
  console.debug(`Global index is ${global_i}, current song should be ${song_names[global_i]} but is ${song}.`);
  
  if (raw_song == `[Electro] - Puppet & The Eden Project - The Fire [Monstercat Release]`) 
    song = `Puppet & The Eden Project - The Fire`;
  else if (raw_song == `[Vietsub + Lyrics] I'm Not Her - Clara Mae`)
    song = `I'm Not Her - Clara Mae`
  else if (raw_song == `[DnB] - Feint - We Won't Be Alone (feat. Laura Brehm) [Monstercat Release]`)
    song = `Feint - We Won't Be Alone`

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
  // console.debug(data);

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
        <input data-index= ${global_i} type="checkbox" aria-label="Song (${spotify_obj[global_i].name}) checkbox" checked>
      </li>
    `);

    selected_songs++;
  } else {
    spotify_obj.push({
      valid: false,
    })

    $('#spotify-list').append(`
      <li class="invalid">
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
    $('#youtube-error').text('');
    $('#youtube-error').css('color', '');
    $('#spotify-list').css('display', 'block');
    $('#spotify-export').css('display', 'block');
    $('footer').removeClass('fixed-footer');

    validateExport();

    console.debug(spotify_obj);
  }

  global_i++;
  if(global_i < playlist_len) {
    spotifySearch(song_names[global_i]);
  }
}

function validateExport() {
  if(selected_songs == 0)
    $('#spotify-export input, #spotify-export button').prop('disabled', true).addClass('disabled');
  else
    $('#spotify-export input, #spotify-export button').prop('disabled', false).removeClass('disabled');
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
  console.debug(`Playlist successfully created`);
  console.debug(data);

  addSongs();
}

function getAllSongUri() {
  let uris = '';

  for(let i=0; i<playlist_len; i++) {
    if(spotify_obj[i].valid) {
      if(i > 0 && uris != '')
        uris += ',';
      uris += spotify_obj[i].uri;
    }
  }

  return uris;
}

function addSongs() {
  console.debug('Adding songs');

  let uris = getAllSongUri();
  console.debug(uris);

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
    if(uris === '')
      console.debug('Empty playlist');
    console.log(error);
  });
}

function completeConversion(data) {
  $('#spotify-success').text('Successfully exported');
  console.debug(`Songs successfully added`);
}

function checkboxListener() {
  $('ul').on('click', 'input', function(event) {
    let index = parseInt($(this).attr('data-index'));

    if(spotify_obj[index].valid) {
      selected_songs--;
    } else {
      selected_songs++;
    }

    validateExport();

    spotify_obj[index].valid = !spotify_obj[index].valid;
    $(this).closest('li').find('div').first().toggleClass('invalid-overlay');
  });
}

function youtubePlaylistToggle() {
  $('#toggle-yt-list').on('click', function(event) {
    if( $('#youtube-list').css('display') === "none")
      $('#youtube-list').css('display','block');
    else
      $('#youtube-list').css('display', 'none');
  });
}

function youtubeFocusListener() {
  $('#youtube-url').on('focus', function(event) {
    if($('#youtube-error').text() != 'Loading...')
      $('#youtube-error').text('');
  });
}

function spotifyFocusListener() {
  $('#playlist-name').on('focus', function(event) {
    $('#spotify-success').text('');
  });
}

function functionHandler() {
  // This function handles what content is displayed based on if a user has
  // debugged in or not
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


  // This function creates an event listener that handles toggling the
  // youtube list for smaller devices
  youtubePlaylistToggle();

  // This function creates an event listener that handles clearing the
  // error message for youtube search
  youtubeFocusListener();

  // This function creates an event listener that handles clearing the
  // success message for spotify export
  spotifyFocusListener();
}

$(functionHandler);
