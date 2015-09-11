# README #

Generic namespace wrapper for modularizing features of JavaScript based applications.

### How's it used? ###

**Adding properties/parameters to the app**

```
#!javascript

app.addParam(
	"config",
	{
		name : "Silas",
		country : "USA"
	}
);

alert(app.config.name);

```

**Adding features to the app**

1. Adding features to the app is done by passing a string name and an anonymous function into the app.
1. Functions are executed immediately and have their own execution context using the "this" keyword which is the same as app.FeatureName.
1. Returning "this" is not required though a best practice to follow.
1. Any variable added to "this" scope is exposed as: app.FeatureName.exposedVariable


```
#!javascript

// Features are functions that get executed as
app.addFeature(
	"someFeature",
	function(){
		"use strict";


		// Privileged variable not accessible to the outside world
		var name,
			today;

		function sayHello(){
			alert(name?"Unknown person":("Hello " + name + "!"));
			return this;
		}
		function setName(n){
			name = n;
			return this;
		}
		function sayToday(){
			alert(today);
		}
		/*
			NOTE:
				Exposing this on the API (aka, this.init = init) will queue it to be fired on app.init()
				Conversely, you can explicitly call it as app.someFeature.init()
		*/
		function init(){
			today = new Date().getDay();
		}

		// Make sure the methods are available on the new feature
		this.sayHello = sayHello;
		this.setName = setName;
		this.sayToday = sayToday;
		this.init = init;

		return this;
	}
);

app.someFeature.setName("Silas"); // Returns app.someFeature
app.someFeature.sayHello(); // alerts "Silas"

```

**Built-in methods on app**

```
#!javascript

/*
	TODO: Some of this needs to be rethought
*/

// Copies one object into another
app.utils.copy Object target (
	Object source [required]: The source object we're wanting to get properties from,
	Object target [required]: The target object we're wanting to add properties to,
	Boolean overwrite [default false]: If true, will overwrite existing properties that are in the target object with ones from the source,
	Boolean doClone [default true]: If true, will clone the source object before copying properties in to the target.  Do this in case you want to preserve immutable the original source's values for object pointers.
);

// Clones an object creating a non-pointer replica of the original
app.utils.clone Object new (
	Object obj [required]: The object we're wanting to clone
);

/*
	Initializes the app by executing all init functions associated with each feature (see above)
*/
app.init app.deferred instance (
	[none]
);

```

## Available app features ##


### deferred ###

A simple feature to easily handle asyncronization execution and messy callbacks

```
#!javascript

function async(){
	// Pass in "1" or an "n" times the process has to be deferred
	var def = app.deferred(1);
	// start some process
	function bigRequest(){
		// Add results to deferred handler so we can access them
		def.results(bigRequestResults);
		// After this finishes running uptick the completion count
		def.next();
	}

	return def;
}

async.finished(
	function(results,successful,failed){
		console.log(failed === 0?"No failed!":"Boo, some failed");
		console.log(successful + " were successful!");
		console.log("We received " + results + " from our process!");
	}
);

// You can also just create sequential steps
function stepByStep(){
	// Don't pass any arguments this time
	var def = app.deferred();

	def.step(
		function(){
			console.log("I am step one!");
			def.next("hello step two");
		}
	);

	def.step(
		function(){
			console.log("I am step one!");
			def.fail("hello step two");
		}
	);

	// don't forget to start the steps (either begin() or next() would work)
	return def.begin();
}

stepByStep().finished(
	function(){

	}
);

```


### pastFix ###

Fixes an issue in iOS that doesn't allow for pasting of links from Safari due to metadata being insufficiently
passed off in iOS when using the share link in Safari we have to scrape it out from the text/uri-list parameter.


### worker ###

This feature simplifies using web workers by creating inline workers via Blob objects and an easier API.

```
#!javascript

var myWorker = app.worker.create();
// Create a method on the worker called "takeLong"
myWorker.attach("takeLong",
	// The method will just run for 3s then return a string message
	// args and controls are the standard names that need to be used, in this order
	// args are passed in by the user, controls is the object that is on the web worker side
	function(args){
		var dts = new Date().getTime() + ((args.time || 1) * 1000);
		while(new Date().getTime() < dts){
			// do nothing
		};

		// Now that I'm on the worker side, I decide I want something from the client
		// Note: "this" is the controls variable on the worker
		this.retrieve(
			// This will run on the client
			function(msg){
				console.log("The worker says: " + msg);
				return document.body.outerHTML;
			},
			// This will run on the worker once the above function returns
			function(results,args){
				// "this.log" calls back to the client and writes to the console (that way we can actually see messages)
				this.log("So nice of you to share your HTML but I'm a worker, I don't understand DOM :'(.  Here's your first 100:\n" + results.substr(0,100));
			},
			// arguments to pass to both functions - can be of any type
			"Hey document"
		);

		// Respond with a done message
		return "Done processing!";
	},
	// When the worker finishes, do this - args is whatever is returned by the user's method above
	function(msg){
		alert("Guess what? " + msg);
	}
);
// Execute the worker
myWorker.takeLong({time:3});

```
