/**
 * @summary     app.worker.js
 * @description Simplifies using web workers by creating inline workers via Blob objects and an easier API
 * @version     1.3
 	> 1.0 Initial version
	> 1.1 Added basic getters and setters (with optional callbacks) for passing data back and forth to the worker
	> 1.2 Added retrieve method to the worker so the worker can call variables from the client side
	> 1.3 Updated function string parser to pull in name contextually from original function
 * @file        app.worker.js
 * @author      Silas Garrison (http://silasgarrison.com/)
 *
 * This source file is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 *
 ** Examples:
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
*/

app.addFeature("worker",function(){
	"use strict";

	var create,
		workerEngine,
		fn2Str;

	function workerEngine(){
		// Run as a closure since we're creating it as a blob, it'll need to execute immediately
		var ctrl;
		(function(target){

			var controls = null,
				started = false,
				log;

			// Shortcut
			function log(msg){
				controls.sendMessage("log",msg);
			}

			// Helper function
			function rand(){
				return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
					var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
					return v.toString(16);
				});
			}

			return ctrl = controls = {
				// Attach the event listener
				init : function(){
					if(!started){
						target.addEventListener("message",controls.receiveMessage, false);
						started = true;
					}
				},
				// Handle when messages come in from the client
				receiveMessage : function(e) {
					var msgData = e.data;

					// Make sure the command is invalid
					if(msgData.cmd && controls[msgData.cmd]){
						// Pass in the args parameter as the main source of arguments
						// Then use the controls object as the execution context so we can easily control/access the worker
						controls[msgData.cmd].apply(controls,[msgData.args]);

						return;
					}

					// Otherwise reply with an error
					controls.log("Error: Invalid command received.");
				},
				// Sends the message back to the client
				sendMessage : function(a,m){
					target.postMessage({action:a,message:m});
				},
				// Attaches a method to the controller object on this worker to give greater functionality from the client
				attach : function(args){
					// Create a new method on the controls object
					// Pass in args (supplied by the client) and execute in the context of controls
					var name = args.name,
						content = args.content,
						fn = new Function(args.argName,content),
						hasCallBack = args.hasCallBack;

					this[name] = function(args){
						var results = fn.apply(this,[args]);
						if(hasCallBack){
							this.sendMessage(name,results || args);
						}

						return results;
					};
				},
				// Setter method to put data from the client on the worker
				set : function(args){
					this[args.name] = args.value;

					// Execute any callback that may have be created with this setter on the client
					if(args.hasCallBack){
						this.sendMessage("set" + args.name,args);
					}
				},
				// Concat method to piece together arrays from the client to the worker
				concat : function(args){
					if(!this[args.name]){
						this[args.name] = []
					}

					this[args.name] = this[args.name].concat(args.value);

					// Execute any callback that may have be created with this setter on the client
					if(args.hasCallBack){
						this.sendMessage("concat" + args.name,args);
					}
				},
				// Getter method to get/inspect objects on the worker side from the client
				get : function(name){
					// Execute the callback that was, presumably, created with this getter
					this.sendMessage("get" + name,this[name]);
				},
				// Retrieves values from the client
				// retrieval: the function ran on the client
				// callback: the function ran on the worker post retrieval
				// args: arguments to pass to both functions
				retrieve : function(retrieval,callback,args){
					var cb = rand();
					// Create a pointer to this callback
					this.__callbacks[cb] = callback;
					// Send message to client
					this.sendMessage(
						"retrieve"
						,{
							retrieval:retrieval.toString()
							,callback:cb
							,args:args || ""
						}
					);
				},
				// This is what the client will call which executes the callback passed (pointer) in the retrieve method
				receive : function(args){
					// Execute the callback created when the retrieve method was called
					if(args.callback && this.__callbacks[args.callback]){
						this.__callbacks[args.callback].apply(this,[args.results,args.args])
					}
				},
				// Imports scripts into worker
				getScripts : function(scrpt){
					importScripts(scrpt);
				},
				// Just a simple call back to write to the console
				log : function(msg){
					log(msg);
				},
				// Kill off the worker
				stop : function(){
					var key;

					log("Whewww, I'm done!");

					target.close();
				},
				// Callback stack the worker may post functions to
				__callbacks : {}
			};

		})(this).init();
	}

	// Helper method to parse functions as strings
	function fn2Str(fn){
		var content = typeof fn === "function"?fn.toString():fn,
			args = content.split("{")[0].split("(")[1].split(")")[0].trim() || "args",
			name = content.split("function")[1].split("(")[0].trim();

		// Parse out the body/content of the function to be compiled later
		content = content.split("{").slice(1).join("{");
		content = content.split("}");
		content = content.slice(0,content.length - 1).join("}");

		return {
			name : name,
			args : args,
			content : content
		};
	}

	function create(fnErr){
		var w,worker,blob,controls,url;

		// Parse out the function above to a string, add the helper method then convert to a blob object
		w = [fn2Str.toString(),"\n",fn2Str(workerEngine).content].join("");
		blob = new Blob([w]);
		url = window.URL.createObjectURL(blob);

		// Possibly: new Worker(["data:text/javascript;charset=US-ASCII,",encodeURIComponent(w)].join(""));
		worker = new Worker(url);
		worker.onmessage = function(e) {
			// Piece together info coming from worker
			var data = e.data || {},
				// Default to log as the action
				action = e.data.action || "log",
				// Default fail message
				msg = e.data.message || "No message data found from worker";

			if(action === "retrieve"){
				retrieve(msg);
			}
			else{
				controls[action]({msg:msg,fromWorker:true});
			}
		};
		worker.onerror = fnErr || function(event){
			throw new Error(event.message + " (" + event.filename + ":" + event.lineno + ")");
		};

		// This is a mthod to be called FROM the worker, not the client, so don't expose it to the API
		function retrieve(args){
			// Create a function locally from string version passed in from worker
			var fnStr = fn2Str(args.retrieval),
				fn = new Function(fnStr.args,fnStr.content),
				// Execute and pull back results
				results = fn.apply(controls,[args.args]);

			// Send back to the listener "receive" the results,
			// the callback originally instantiated on the worker side
			// and any arguments passed from the worker
			controls.send(
				"receive"
				,{
					results:results
					,callback:args.callback
					,args:args.args
				}
			);
		}

		return controls = {
			log : function(msg){
				console.log(msg.msg || msg);
			},
			send : function(cmd,args){
				// Allow the client to pass in either the cmd object as {cmd:cmd,args:args} or individual arguments
				var cmd = typeof cmd === "string"?{cmd:cmd,args:args}:cmd;
				// Post the message to the worker
				worker.postMessage(cmd);

				return controls;
			},
			stop : function(){
				controls.send("stop");

				return controls;
			},
			concat : function(name,value,callback,context){
				// Create a corresponding callback that the worker will call with the passed in function
				if(callback){
					controls["concat" + name] = function(args){
						callback.apply(context || controls,[args]);
					};
				}

				controls.send("concat",{name:name,value:value,hasCallBack:!!callback});

				return controls;
			},
			set : function(name,value,callback,context){
				// Create a corresponding callback that the worker will call with the passed in function
				if(callback){
					controls["set" + name] = function(args){
						callback.apply(context || controls,[args]);
					};
				}

				controls.send("set",{name:name,value:value,hasCallBack:!!callback});

				return controls;
			},
			get : function(name,callback,context){
				// Create a corresponding callback that the worker will call with the passed in function
				controls["get" + name] = function(args){
					callback.apply(context || controls,[args]);
				};

				controls.send("get",name);

				return controls;
			},
			attach : function(name,fnSend,callback,context){
				var fnString = fn2Str(fnSend),
					origCallback = callback;

				// Send the message to the worker to attach the above method
				controls.send("attach",{name:name,content:fnString.content,argName:fnString.args,hasCallBack:!!callback});
				// Attach a matching named object as the one on the worker - allow customCallback to change the callback at runtime
				controls[name] = function(args,customCallback){
					var _args = args && args.msg?args.msg:args;
					// If it's coming from the worker, see if the user passed in a function
					if(args && args.fromWorker === true){
						(callback || function(){}).apply(context || controls,[_args]);
						// Set back (if changed) the callback
						callback = origCallback;
					}
					else {
						callback = customCallback || origCallback;
						// Send the worker a message with this method name as the command and any supplied arguments
						return controls.send(name,_args || "");
					}
				};

				return controls;
			},
			importScripts : function(scrpt){
				// Call it "getScripts" on the worker since importScripts is a global method there
				// and we don't want to ever collide namespaces
				controls.send("getScripts",scrpt);

				return controls;
			}
		};
	}

	this.create = create;

	return this;

});
