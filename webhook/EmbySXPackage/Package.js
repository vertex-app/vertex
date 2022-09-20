/* eslint-disable prefer-const */
/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */

let VERTEX_OPENAPI_URL;

// eslint-disable-next-line camelcase
function _package_init () {
  ScripterX.Log.Info('Vertex Push Service Package Initialised.');
  VERTEX_OPENAPI_URL = ScripterX.Config.Get('VERTEX_OPENAPI_URL').StringValue();
  ScripterX.Log.Info('Vertex Push Service: VERTEX OPENAPI URL = ' + VERTEX_OPENAPI_URL);
};

function _onPlaybackStart (context) {
  ScripterX.Log.Info('VERTEX PUSH SERVICE START PUSH JOB');
  const playbackInfo = {
    event: 'media.play'
  };
  let keys = [
    '%playback.position.ticks%', '%playback.item.total.ticks%', '%playback.position.percentage%',
    '%item.id%', '%item.name%', '%item.path%', '%item.originaltitle%',
    '%item.tagline%', '%item.overview%', '%item.type%',
    '%item.productionyear%', '%item.isvirtual%', '%item.meta.tmdb%',
    '%item.library.type%', '%item.library.name%', '%user.id%',
    '%username%', '%device.id%', '%device.name%', '%server.id%', '%server.name%'
  ];
  const seriesKeys = [
    '%season.id%', '%season.name%', '%season.number%', '%series.id%',
    '%series.name%', '%series.meta.tmdb%', '%episode.number%'
  ];
  if (context.Token('%item.type%').value === 'Episode') {
    keys = keys.concat(seriesKeys);
  }
  try {
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      ScripterX.Log.Info('VERTEX PUSH SERVICE ADD MATA KEY: ' + k);
      const kk = k.replace(/%/g, '').replace(/\./g, '_');
      playbackInfo[kk] = context.Token(k).value;
    }
  } catch (e) {
    ScripterX.Log.Info('VERTEX PUSH SERVICE ERROR');
  }
  ScripterX.Log.Info('VERTEX PUSH SERVICE JSON:' + JSON.stringify(playbackInfo, null, 2));
  ScripterX.Web.Post(VERTEX_OPENAPI_URL, JSON.stringify(playbackInfo));
}

function _onPlaybackStopped (context) {
  ScripterX.Log.Info('VERTEX PUSH SERVICE START PUSH JOB');
  const playbackInfo = {
    event: 'media.stop'
  };
  let keys = [
    '%item.id%', '%item.name%', '%item.path%', '%item.originaltitle%',
    '%item.tagline%', '%item.overview%', '%item.type%',
    '%item.productionyear%', '%item.isvirtual%', '%item.meta.tmdb%',
    '%item.library.type%', '%item.library.name%', '%user.id%',
    '%username%', '%device.id%', '%device.name%', '%server.id%', '%server.name%'
  ];
  const seriesKeys = [
    '%season.id%', '%season.name%', '%season.number%', '%series.id%',
    '%series.name%', '%series.meta.tmdb%', '%episode.number%'
  ];
  if (context.Token('%item.type%').value === 'Episode') {
    keys = keys.concat(seriesKeys);
  }
  try {
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      ScripterX.Log.Info('VERTEX PUSH SERVICE ADD MATA KEY: ' + k);
      const kk = k.replace(/%/g, '').replace(/\./g, '_');
      playbackInfo[kk] = context.Token(k).value;
    }
  } catch (e) {
    ScripterX.Log.Info('VERTEX PUSH SERVICE ERROR');
  }
  ScripterX.Log.Info('VERTEX PUSH SERVICE JSON:' + JSON.stringify(playbackInfo, null, 2));
  ScripterX.Web.Post(VERTEX_OPENAPI_URL, JSON.stringify(playbackInfo));
}

function _onMediaItemAdded (context) {
  ScripterX.Log.Info('VERTEX PUSH SERVICE START PUSH JOB');
  const playbackInfo = {
    event: 'media.new'
  };
  let keys = [
    '%item.id%', '%item.name%', '%item.path%', '%item.originaltitle%', '%item.tagline%',
    '%item.overview%', '%item.type%', '%item.productionyear%', '%item.meta.tmdb%',
    '%item.isvirtual%', '%item.library.type%', '%item.library.name%', '%server.name%'
  ];
  const seriesKeys = [
    '%season.id%', '%season.name%', '%season.number%', '%series.id%',
    '%series.name%', '%series.meta.tmdb%', '%episode.number%'
  ];
  if (context.Token('%item.type%').value === 'Episode') {
    keys = keys.concat(seriesKeys);
  }
  try {
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      ScripterX.Log.Info('VERTEX PUSH SERVICE ADD MATA KEY: ' + k);
      const kk = k.replace(/%/g, '').replace(/\./g, '_');
      playbackInfo[kk] = context.Token(k).value;
    }
  } catch (e) {
    ScripterX.Log.Info('VERTEX PUSH SERVICE ERROR');
  }
  ScripterX.Log.Info('VERTEX PUSH SERVICE JSON' + JSON.stringify(playbackInfo, null, 2));
  ScripterX.Web.Post(VERTEX_OPENAPI_URL, JSON.stringify(playbackInfo));
}
