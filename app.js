/**
 * @summary     app
 * @description Wrapper for creating objects and functions under a generic name space for web apps
 * @version     1.0
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
		clone;
	
	function _app(){
		return this;
	};
	
	function register(obj,key,val){
		obj[key] = val;
		return obj;
	};
	
	function addFeature(name,engine){
		engine.contructor = this;
		engine.prototype = accessors;
		return register(this,name,new engine());
	};
	
	function removeFeature(name){
		delete this[name];
		return this;
	};
	
	function addParam(name,param){
		this[name] = param;
		return this;
	};
	
	function addParams(params){
		copy(params,this);
		return this;
	};
	
	function copy(src,target,overwrite){
		var overwrite = typeof overwrite === "boolean"?overwrite:true,
			key,
			src = clone(src);
	
		for(key in src){
			if(typeof target[key] === "undefined" || overwrite){
				target[key] = src[key];
			}
		}
	
		return target;
	};
	
	function clone(obj){
		var newObj,
			fn = function(){return this;};
	
		fn.prototype = obj;
		newObj = new fn();
		newObj.constructor = obj;
	
		return newObj;
	};
	
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
	
	return inst;
})();
