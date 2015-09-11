/**
 * @summary     app
 * @description Wrapper for creating objects and functions under a generic name space for web apps
 * @version     1.1
 * @file        app.js
 * @author      Silas Garrison (http://silasgarrison.com/)
 *
 * This source file is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 *
 ** Examples:
 	app.addParam("info",{
		version : "1.0",
		releaseDate : "07/27/2014",
		name : "Some Web App",
		company : "ACME",
		year : new Date().getFullYear()
	});
	// Access via: app.info[.version,.name,etc]

	app.addFeature("someFeature",function(){
		"use strict";

		var control,
			name;

		function sayHello(){
			alert(name?"Unknown person":("Hello " + name + "!"));
			return this;
		}
		function setName(n){
			name = n;
			return this;
		}

		// Make sure the methods are available on the new feature
		this.sayHello = sayHello;
		this.setName = setName;

		return this;
	});
	// Access via: app.someFeature.setName("Silas"); app.someFeature.sayHello();
*/

var app = (function(){
	"use strict";

	var _app,
		register,
		addFeature,
		addParam,
		inst,
		accessors,
		copy,
		clone,
		toInit = [];

	function _app(){
		return this;
	}

	function register(obj,key,val){
		obj[key] = val;
		return obj;
	}

	function addFeature(name,engine){
		var eng;
		engine.contructor = this;
		engine.prototype = accessors;
		eng = new engine();
		// Check to see if this has to be initialized
		if(typeof eng.init === "function"){
			toInit.push(name);
		}
		return register(this,name,eng);
	}

	function init(){
		if(app.deferred !== undefined){
			var def = app.deferred(toInit.length);

			toInit.forEach(function(module){
				var initObj = inst[module].init() || {};

				// If this init object has a deferred mechanism involved, use it.  Otherwise, just mark this instance as done
				if(initObj.finished){
					initObj.finished(function(){
						def.next();
					});
				}
				else {
					def.next();
				}
			});

			return def;
		}
	}

	function removeFeature(name){
		delete this[name];
		return this;
	}

	function addParam(name,param){
		this[name] = param;
		return this;
	}

	function addParams(params){
		copy(params,this);
		return this;
	}

	function copy(src,target,overwrite,doClone){
		var overwrite = typeof overwrite === "boolean"?overwrite:false,
			key,
			src = doClone === true || doClone === undefined?clone(src):src;

		for(key in src){
			if(typeof target[key] === "undefined" || overwrite){
				target[key] = src[key];
			}
		}

		return target;
	}

	function clone(obj){
		var newObj,
			fn = function(){return this;};

		fn.prototype = obj;
		newObj = new fn();
		newObj.constructor = obj;

		return newObj;
	}

	accessors = {
		addFeature : addFeature,
		removeFeature : removeFeature,
		addParam : addParam,
		addParams : addParams
	};

	// Instantiate this object with the typical accessors or features
	_app.prototype = accessors;
	inst = new _app();

	// Utilities helpful to the app
	inst.addParam("utils",{
		copy : copy,
		clone : clone
	});

	// Add default init method which allows for features to initialize themselves later
	// Features added to the app must have an exposed method called "init" to be added to this
	inst.addParam("init",init);

	return inst;
})();
