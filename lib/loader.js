var path = require('path');
var fs = require('fs');
var configFound = false;

var Loader = function(opts){
  var self = this;
  var options = opts || {};
  var logger = options.logger||{
    info: function(){},
    error: function(){}
  };
  var config=self.config={};
  var configOptions = {
      useEnv: true,
      defaultConfig: options.default||options.defaults||{}
    };

  var configFile = options.configFile||options.fileName||'config.json';
  try{
    var checkSetConfig = function(dir){
      dir = path.resolve('./'+(dir||'.'))+'/';
      if(fs.existsSync(dir+configFile)){
        configFile = dir+configFile;
        configFound=true;
        return true;
      }
      return false;
    };
    if(checkSetConfig()){
    }else if(checkSetConfig('bin')){
    }else if(checkSetConfig('../bin')){
    }else{
      var l = 5, d='../';
      while((l>0)&&(!configFound)){
        if(!checkSetConfig(d)){
          d+='../';
        }
        l--;
      }
    }
    if(configFound){
      logger.info('Loading config from:', path.resolve(configFile));
      configOptions.configFile = configFile;
      return require('./config').Reader(configOptions);
    }else{
      logger.info('No config found, using defaults.');
      return require('./config').Reader(configOptions);
    }
  }catch(e){
    logger.error(e);
    return require('./config').Reader(configOptions);
  }
};

module.exports = {
  Loader: Loader
};
