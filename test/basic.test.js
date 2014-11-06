var assert = require('assert');
var Loader = require('../').Loader;

describe('Loader', function(){
  it('Should load defaults if no config found', function(done){
    var config = new Loader({
      fileName: 'test/no.config.json',
      defaults: {
        api: {
          route: '/api/v1/'
        }
      }
    });
    assert(config.values.api, 'No API config value found');
    done();
  });
  it('Should load user defaults if no config found', function(done){
    var config = new Loader({fileName: 'test/no.config.json', default: {foo: 'bar'}});
    assert(config.values.foo === 'bar', 'Wrong value for config.values.foo');
    done();
  });
  it('Should merge defaults if they are not found in the config', function(done){
    var config = new Loader({fileName: 'test/test.config.json', default: {foo: 'bar'}});
    assert(config.values.foo === 'bar', 'Wrong value for config.values.foo');
    assert(config.values.testValue === 'value', 'Wrong value for config.values.testValue');
    done();
  });
  it('Should log an error when a logger is present and the config is bad', function(done){
    try{
      var config = new Loader({
        fileName: 'test/test.bad.config.json',
        logger: {
          info: function(){
            //assert(false, 'This should never happen');
          },
          error: function(err){
            done();
          }
        }
      });
    }catch(e){
    }
  });
  it('Should throw an error when the config is bad', function(done){
    try{
      var config = new Loader({
        fileName: 'test/test.bad.config.json',
      });
      assert(false, 'No config should have been returned, an error should have happened');
    }catch(e){
      done();
    }
  });
  it('Should throw an error and log when a logger is provided and the config is bad', function(done){
    var checksExpected = 2;
    var check = function(){
      checksExpected--;
      if(checksExpected === 0){
        done();
      }
    };
    try{
      var config = new Loader({
        fileName: 'test/test.bad.config.json',
        logger: {
          info: function(){
            //assert(false, 'This should never happen');
          },
          error: function(err){
            check();
          }
        }
      });
      assert(false, 'No config should have been returned, an error should have happened');
    }catch(e){
      check();
    }
  });
  it('Should take values from process.env.NODE_ENV', function(done){
    var env = process.env.NODE_ENV;
    process.env.NODE_ENV='test';
    var config = new Loader({
      fileName: 'test/test.config.json'
    });
    process.env.NODE_ENV=env;
    assert(config.values.anotherValue==='value', 'Wrong value for config.values.anotherValue');
    assert(config.values.testValue==='value', 'Wrong value for config.values.testValue');
    done();
  });
  it('Should allow you to retrieve config sections by name', function(done){
    var config = new Loader({
      fileName: 'test/test.config.json',
      defaults: {
        api: {
          route: '/api/v1/'
        }
      }
    });
    assert(config.section('api', {route: false}).route==='/api/v1/', 'Invalid value route in section api');
    done();
  });
  it('Should defaults when provided to section', function(done){
    var config = new Loader({
      fileName: 'test/test.config.json'
    });
    assert(config.section('nope', {test: 'value'}).test==='value', 'Invalid value test in section nope');
    done();
  });
  it('Should merge defaults when provided to section', function(done){
    var config = new Loader({
      fileName: 'test/test.config.json',
      defaults: {
        api: {
          route: '/api/v1/'
        }
      }
    });
    var sec = config.section('api', {test: 'value'});
    assert(sec.test==='value', 'Invalid value test in section api');
    assert(sec.route==='/api/v1/', 'Invalid value route in section api');
    done();
  });
});
