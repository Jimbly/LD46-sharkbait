// Portions Copyright 2019 Jimb Esser (https://github.com/Jimbly/)
// Released under MIT License: https://opensource.org/licenses/MIT

const cmd_parse_mod = require('../../common/cmd_parse.js');
const local_storage = require('./local_storage.js');
export let cmd_parse = cmd_parse_mod.create({ storage: local_storage });

const engine = require('./engine.js');
const textures = require('./textures.js');
const { PI, round } = Math;

window.cmd = function (str) {
  cmd_parse.handle(null, str, cmd_parse_mod.defaultHandler);
};

cmd_parse.registerValue('fov', {
  type: cmd_parse.TYPE_FLOAT,
  label: 'FOV',
  range: [1,179],
  get: () => round(engine.fov_min * 180 / PI),
  set: (v) => engine.setFOV(v * PI / 180),
  store: true,
});

function byteFormat(bytes) {
  if (bytes > 850000) {
    return `${(bytes/(1024*1024)).toFixed(2)}MB`;
  }
  if (bytes > 850) {
    return `${(bytes/1024).toFixed(2)}KB`;
  }
  return `${bytes}B`;
}

cmd_parse.register({
  cmd: 'texmem',
  help: 'Displays texture memory usage',
  func: function (str, resp_func) {
    let keys = Object.keys(textures.textures);
    keys = keys.filter((a) => textures.textures[a].gpu_mem > 1024);
    keys.sort((a, b) => textures.textures[a].gpu_mem - textures.textures[b].gpu_mem);
    resp_func(null, keys.map((a) => `${byteFormat(textures.textures[a].gpu_mem)} ${a}`).join('\n'));
  }
});

cmd_parse.register({
  cmd: 'gpumem',
  help: 'Displays GPU memory usage summary',
  func: function (str, resp_func) {
    let { gpu_mem } = engine.perf_state;
    resp_func(null, `${byteFormat(gpu_mem.geom)} Geo\n${byteFormat(gpu_mem.tex)} Tex\n${
      byteFormat(gpu_mem.geom + gpu_mem.tex)} Total`);
  }
});

cmd_parse.register({
  cmd: 'd',
  help: 'Toggles a debug define',
  func: function (str, resp_func) {
    str = str.toUpperCase();
    engine.defines[str] = !engine.defines[str];
    resp_func(null, `D=${str} now ${engine.defines[str]?'SET':'unset'}`);
  }
});

cmd_parse.register({
  cmd: 'renderer',
  help: 'Displays current renderer',
  func: function (str, resp_func) {
    resp_func(null, `Renderer=WebGL${engine.webgl2?2:1}`);
  }
});

function cmdDesc(cmd_data) {
  return `/${cmd_data.cmd} - ${cmd_data.help}`;
}

cmd_parse.register({
  cmd: 'help',
  help: 'Searches commands',
  func: function (str, resp_func) {
    let list = cmd_parse.autoComplete('', this && this.access);
    if (str) {
      let str_cname = cmd_parse.canonical(str);
      let str_lc = str.toLowerCase();
      list = list.filter((cmd_data) => cmd_data.cname.indexOf(str_cname) !== -1 ||
          cmd_data.help.toLowerCase().indexOf(str_lc) !== -1);
    }
    if (!list.length) {
      return void resp_func(null, `No commands found matching "${str}"`);
    }
    resp_func(null, list.map(cmdDesc).join('\n'));
  }
});

export let safearea = [-1,-1,-1,-1];
cmd_parse.registerValue('safe_area', {
  label: 'Safe Area',
  type: cmd_parse.TYPE_STRING,
  usage: 'Safe Area value: Use -1 for auto based on browser environment,\n' +
    'or 0-25 for percentage of screen size\n' +
    '  Usage: /safe_area [value]\n' +
    '  Usage: /safe_area horizontal,vertical\n' +
    '  Usage: /safe_area left,right,top,bottom',
  default_value: '-1',
  get: () => (safearea[0] === -1 ? '-1 (auto)' : safearea.join(',')),
  set: (v) => {
    v = String(v);
    let keys = v.split(',');
    if (v && keys.length === 1) {
      safearea[0] = safearea[1] = safearea[2] = safearea[3] = Number(v);
    } else if (keys.length === 2) {
      safearea[0] = safearea[1] = Number(keys[0]);
      safearea[2] = safearea[3] = Number(keys[1]);
    } else if (keys.length === 4) {
      for (let ii = 0; ii < 4; ++ii) {
        safearea[ii] = Number(keys[ii]);
      }
    } else {
      // error, ignore?
    }
  },
  store: true,
});

cmd_parse.register({
  cmd: 'webgl2_auto',
  help: 'Resets WebGL2 auto-detection',
  func: function (str, resp_func) {
    let disable_data = local_storage.getJSON('webgl2_disable');
    if (!disable_data) {
      return resp_func(null, 'WebGL2 is already being auto-detected');
    }
    local_storage.setJSON('webgl2_disable', undefined);
    return resp_func(null, 'WebGL2 was disabled, will attempt to use it again on the next load');
  },
});
