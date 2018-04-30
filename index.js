const AUTH_URL = 'https://accounts.spotify.com/authorize';
const SPOTIFY_API_KEY = '5b438a66581e4737acfddeb0d2bd063b';

const YOUTUBE_URL = 'https://www.googleapis.com/youtube/v3/playlistItems';
const YOUTUBE_API_KEY = 'AIzaSyBgV3q8M71c-Hkqh3VmKzJSDlnoidrmuzM';

const CB_URL = 'http%3A%2F%2F192.168.1.207%3A8000';

let token = '';

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
  console.log(data.items.length);

  for(let i=0; i<data.items.length; i++) {
    $('#youtube-list').append(`
      <li>
        <div class="video-label">${i+1}</div>
        <img src='${data.items[i].snippet.thumbnails.default.url}' alt="Youtube Thumbnail">
        <div class="video-label">${data.items[i].snippet.title}</div>
      </li>
    `);
    if(i < data.items.length-1)
      $('#youtube-list').append('<hr>');
  }

  $('#youtube-list').css('display', 'block');
  $('footer').removeClass('fixed-footer');
}

function search() {
  $('#spotify-search').submit(function(event) {
      event.preventDefault();

      console.log($.ajax({
      	url: `https://api.spotify.com/v1/search?q=${encodeURIComponent($('#search-input').val())}&type=track&limit=1`,
      	dataType: 'json',
      	beforeSend: function(xhr){
      		xhr.setRequestHeader('Accept', 'application/json');
      		xhr.setRequestHeader('Content-Type', 'application/json');
      		xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      	},
      	success: searchResults
      }).fail(function(error) {
        // handle failed api requests
        console.log(error);
      }));
  });
}

function searchResults(data) {
  let url = data.tracks.items[0];
  let json = JSON.stringify(data, null, '\t');
  console.log(data);

  if(url)
    $('#song-link').attr('href', data.tracks.items[0].external_urls.spotify);

  $('#song-link').text('Link to song');

  $('#json-results').text(json);
  console.log(json);

  $('#search-input').val('');
}

function functionHandler() {
  initHTML();
  youtubeSearch();
}

$(functionHandler);
