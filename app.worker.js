/**
 * @summary     app.worker.js
 * @description Simplifies using web workers by creating inline workers via Blob objects and an easier API
 * @version     1.0
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
		// The method will just run for 1.5s then return a string message
		// args and controls are the standard names that need to be used, in this order
		// args are passed in by the user, controls is the object that is on the web worker side
		function(args,controls){
			var dts = new Date().getTime() + 1500;
			while(new Date().getTime() < dts){
				// do nothing
			};
			// Respond with a done message
			return "Done processing!";
		},
		// When the worker finishes, do this - args is whatever is returned by the user's method above
		function(args){
			alert("Guess what? " + args);
		}
	);
	// Execute the worker
	myWorker.takeLong();
*/

app.addFeature("worker",function(){
	"use strict";

	var create,workerEngine;

	function workerEngine(){
		// Run as a closure since we're creating it as a blob, it'll need to execute immediately
		(function(target){
			
			var master = {ctrl:{}},
				controls = master.ctrl,
				data = {},
				map = {},
				started = false,
				log;
			
			// Shortcut
			function log(msg){
				controls.sendMessage("log",msg);
			}
			
			return controls = {
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
						// Then the controls object so we can access and control the worker from custom attached methods
						controls[msgData.cmd](msgData.args,controls);
			
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
					// Pass in args (supplied by the client) and the controls object as an argument
					var name = args.name,
						content = args.content,
						fn = new Function("args","controls",content);

					controls[name] = function(args,controls){
						var results = fn(args,controls);
						if(typeof results !== "undefined"){
							controls.sendMessage(name,results);
						}
					};
				},
				// Setter method to put data from the client on the worker
				set : function(args){
					controls[args.name] = args.value;
					
					// Execute any callback that may have be created with this setter on the client
					if(args.hasCallBack){
						controls.sendMessage("get" + name,controls[name]);
					}
				},
				// Getter method to get/inspect objects on the worker side from the client
				get : function(name){
					// Execute the callback that was, presumably, created with this getter
					controls.sendMessage("get" + name,controls[name]);
				},
				// Just a simple call back to write to the console
				log : function(msg){
					log(msg);
				},
				// Kill off the worker
				stop : function(){
					var key;
					
					log("I'm done");
					
					// In case they've attached large objects, delete all references
					for(key in controls){
						delete controls[key];
					}
					
					target.close();
				}
			};
		
		})(this).init();
	};
		
	function create(fn){
		var w,worker,blob,controls;
		
		// Parse out the function above to a string then convert to a blob object
		w = workerEngine.toString().replace(/function workerEngine\(\)\{/,"");
		w = w.split("}");
		w = w.slice(0,w.length - 1).join("}");
		blob = new Blob([w]);

		worker = new Worker(window.URL.createObjectURL(blob));
		worker.onmessage = fn || function(e) {
			// Piece together info coming from worker
			var data = e.data || {},
				// Default to log as the action
				action = e.data.action || "log",
				// Default fail message
				msg = e.data.message || "No message data found from worker";

			controls[action](msg,true);
		};
			
		return controls = {
			log : function(msg){
				console.log(msg);
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
			set : function(name,value,callback){
				// Create a corresponding callback that the worker will call with the passed in function
				if(callback){
					controls["set" + name] = function(args){
						callback(args);
					};
				}
				
				controls.send("set",{name:name,value:value,hasCallBack:!!callback});
			
				return controls;
			},
			get : function(name,callback){
				// Create a corresponding callback that the worker will call with the passed in function
				controls["get" + name] = function(args){
					callback(args);
				};
				
				controls.send("get",name);
					
				return controls;
			},
			attach : function(name,fnSend,fnReceive){
				// Parse out the body/content of the function to be compiled on the worker side
				var content = fnSend.toString();
					content = content.split("{").slice(1).join("{");
					content = content.split("}");
					content = content.slice(0,content.length - 1).join("}");
				// Send the message to the worker to attach the above method
				controls.send("attach",{name:name,content:content});
				// Attach a matching named object as the one on the worker
				controls[name] = function(args,fromWorker){
					// If it's coming from the worker, see if the user passed in a function
					if(fromWorker){
						(fnReceive || function(){})(args);
					}
					else {
						// Send the worker a message with this method name as the command and any supplied arguments
						return myWorker.send(name,args || "");
					}
				};
				
				return controls;
			}
		};
	};
	
	this.create = create;
	
	return this;

});