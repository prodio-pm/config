var fs = require('fs');
var vm = require('vm');
var util = require('util');

if(fs.existsSync('./.env')){
  var lines = fs.readFileSync('./.env').toString().split(/(\r\n|\n\r|\n|\r)/);
  lines.forEach(function(line){
    if(line && !/^\s*\#/i.test(line)){
      var parts = line.split('='),
        key = parts.shift(),
        value = parts.join('=');
      if(key){
        process.env[key]=value;
      }
    }
  });
}

var linkEnvValues = function(obj){
  var res = {};
  if(typeof(obj)!=='object'){
    return obj;
  }
  if(obj instanceof Array){
    var arr = [];
    obj.forEach(function(entry){
      arr.push(linkEnvValues(entry));
    });
    return arr;
  }
  if(typeof(obj.$env)==='string'){
    return process.env[obj.$env]||obj.$def;
  }
  var keys = Object.keys(obj);
  keys.forEach(function(key){
    res[key] = linkEnvValues(obj[key]);
  });
  return res;
};

var Lib = module.exports = {};

var configReader = Lib.Reader = function(options){
  var self = this, tmp, val, name, names, reCmdLineStrip=/^(\-|\\|\/)*/i, config, i;
  options=options||{};
  try{
    self.values = {};
    if(typeof(options)=='string') options = {configFile: options};
    config = fs.readFileSync(options.configFile||'config.json').toString();
  }catch(e){
    config = '{}';
  }
  var sandbox = {};
  vm.runInNewContext('this.config = '+config, sandbox);
  if(sandbox.config){
    for(i in sandbox.config){
      self.values = deepcopy(sandbox.config);
    }
  }
  if(options.useEnv){
    self.values = extend(true, options.defaultConfig||{}, self.values.default, self.values[process.env.NODE_ENV||'development']||{});
  }

  self.values = linkEnvValues(self.values);

  var checkSpecial = options.checkSpecial||function(){return false;};
  for(i = 2; i < process.argv.length; i++){
    tmp = process.argv[i].replace(reCmdLineStrip, '').split('=');
    name = tmp.shift();
    if(!checkSpecial(self, name, i)){
      if(tmp.length>0){
        val = tmp.join('=');
      }else{
        val = true;
      }
      tmp = self.values;
      names = name.split('.');
      while(names.length>1){
        name = names.shift();
        tmp = tmp[name]=tmp[name]||{};
      }
      tmp[names.shift()]=val;
    }
  }

  self.applyto = function(target, options){
    options = options || {};
    if(typeof(options)=='string') options = {section: options};
    if(options.section){
      extend(true, target, options.defaults, self.values[options.section]);
    }else{
      extend(true, target, options.defaults||options, self.values);
    }
    return target;
  };

  var findSection = function(sectionName){
    var segments = sectionName.split('.'), section = self.values;
    while(section&&segments.length>0){
      section = section[segments.shift()];
    }
    return section;
  };

  self.section = function(section, defaults){
    var target;// = {};
    defaults = defaults||{};
    if(typeof(section)==='object'){
      defaults = section;
      section = false;
    }
    if(section){
      if(defaults instanceof Array){
        target = extend(true, [], defaults, findSection(section));//self.values[section]);
      }else{
        target = extend(true, {}, defaults, findSection(section));//self.values[section]);
      }
    }else{
      if(defaults instanceof Array){
        target = extend(true, [], defaults, self.values);
      }else{
        target = extend(true, {}, defaults, self.values);
      }
    }
    return target;
  };

  return self;
};

var isPlainObject = function(obj) {
  // Must be an Object.
  // Because of IE, we also have to check the presence of the constructor property.
  // Make sure that DOM nodes and window objects don't pass through, as well
  if (!obj || toString.call(obj) !== '[object Object]' || obj.nodeType || obj.setInterval){
    return false;
  }
  var has_own_constructor = hasOwnProperty.call(obj, 'constructor');
  var has_is_property_of_method = hasOwnProperty.call(obj.constructor.prototype, 'isPrototypeOf');
  // Not own constructor property must be Object
  if (obj.constructor && !has_own_constructor && !has_is_property_of_method){
    return false;
  }
  // Own properties are enumerated firstly, so to speed up,
  // if last one is own, then all properties are own.

  var last_key, key;
  for (key in obj){
    last_key = key;
  }
  return typeof last_key === 'undefined' || hasOwnProperty.call(obj, last_key);
};

var extend = function() {
  // copy reference to target object
  var target = arguments[0]||{}, i = 1, length = arguments.length, deep = false, options, name, src, copy;

  // Handle a deep copy situation
  if (typeof(target) === 'boolean') {
    deep = target;
    target = arguments[1]||{};
    // skip the boolean and the target
    i = 2;
  }
  // Handle case when target is a string or something (possible in deep copy)
  if ((typeof target !== 'object') && (typeof(target) !== 'function')){
    target = {};
  }
  for (; i < length; i++) {
    // Only deal with non-null/undefined values
    if ((options = arguments[i]) !== null) {
      // Extend the base object
      for (name in options) {
        src = target[name];
        copy = options[name];

        // Prevent never-ending loop
        if (target === copy)
            continue;

        // Recurse if we're merging object literal values or arrays
        if (deep && copy && (isPlainObject(copy) || Array.isArray(copy))) {
          var clone = src && (isPlainObject(src) || Array.isArray(src)) ? src : Array.isArray(copy) ? [] : {};

          // Never move original objects, clone them
          target[name] = extend(deep, clone, copy);

        // Don't bring in undefined values
        } else if (typeof copy !== 'undefined')
          target[name] = copy;
      }
    }
  }

  // Return the modified object
  return target;
};

var deepcopy = Lib.extend = function(){
  if(!arguments.length) return {};
  var args = Array.apply(null, arguments);
  if(typeof(args[0]) === 'boolean'){
    var deep = args.shift();
    args.unshift(deep, {});
  }else args.unshift(true, {});
  return extend.apply(null, args);
};
