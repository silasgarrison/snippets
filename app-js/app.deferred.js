/**
 * @summary     app.deferred.js
 * @description A library to easily handle asyncronization execution and messy callbacks
 * @version     1.0
 * @file        app.worker.js
 * @author      Silas Garrison (http://silasgarrison.com/)
 *
 * This source file is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 *
 ** Examples:
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
	 )
*/

app.addFeature(
	"deferred",
	function(){
		"use strict";

		function finished(num){

			var tasks = num || 0,
				passed = 0,
				failed = 0,
				onFail = [],
				onPass = [],
				onComplete = [],
				checkBackIn = 50,
				returnSets = 0,
				toReturn = null,
				registrar = [];

			function check(){
				// We're done with all tasks
				if((passed + failed) >= tasks){
					// Copy these arrays so we can kill off the global versions in case check gets called from one of the child methods
					var lclPass = app.utils.clone(onPass),
						lclFail = app.utils.clone(onFail),
						lclComp = app.utils.clone(onComplete);

					// Clear global queues
					onPass = [];
					onFail = [];
					onComplete = [];

					// Successful methods
					if(failed === 0){
						lclPass.forEach(
							function(obj){
								try {
									obj.fn.apply(obj.ctx,addArgs(obj.args));
								}
								catch(e){
									console.log("ERROR onComplete: " + e.message + "\nStack: " + (e.stack || ""));
								}
							}
						);
					}
					// Failed methods
					else {
						lclFail.forEach(
							function(obj){
								try {
										obj.fn.apply(obj.ctx,addArgs(obj.args));
								}
								catch(e){
									console.log("ERROR onComplete: " + e.message + "\nStack: " + (e.stack || ""));
								}
							}
						);
					}
					// General completion methods
					lclComp.forEach(
						function(obj){
							try {
									obj.fn.apply(obj.ctx,addArgs(obj.args));
							}
							catch(e){
								console.log("ERROR onComplete: " + e.message + "\nStack: " + (e.stack || ""));
							}
						}
					);
				}
				else {
					check.After(checkBackIn);
				}
			}

			function addArgs(arr){
				// Add result sets that have been added to this deferred object
				arr.push(toReturn);
				// Add passed and failed counts as arguments
				arr.push(passed);
				arr.push(failed);

				return arr;
			}

			function nextStep(args){
				if(registrar.length > 0){
					var evt = registrar[0];
					// Remove it from the registrar
					registrar.splice(0,1);
					// Execute step
					evt.fn.apply(evt.ctx || this || {},args);
				}
			}

			// Post results to pass back to deferred method
			this.results = function(res){
				// If the return object hasn't had any values assigned, set it to what's passed in
				if(toReturn === null){
					toReturn = res;
				}
				// If multiple methods are passing back results, create an array to store each portion (first time)
				else if(returnSets === 1){
					var newReturn = [toReturn];
					newReturn.push(res);
				}
				// Subsequent calls just append the results
				else {
					toReturn.push(res);
				}

				++returnSets;

				return this;
			};

			// Register a step-by-step method and up the task count
			this.step = function(fn,ctx){
				++tasks;
				registrar.push({fn:fn,ctx:ctx});
				return this;
			};

			// Start the first step
			this.begin = function(){
				nextStep(Array.fromArguments(arguments));
				++passed;

				return this;
			};

			this.open = function(){
				++tasks;
				return this;
			};

			this.next = function(){
				nextStep(Array.fromArguments(arguments));

				++passed;
				return this;
			};

			this.pass = function(){
				nextStep(Array.fromArguments(arguments));

				++passed;
				return this;
			};

			this.fail = function(){
				nextStep(Array.fromArguments(arguments));

				++failed;
				return this;
			};

			// Immediately just pass all tasks and go to any completion/succesful methods
			this.end = function(){
				passed = tasks;
				check();
				return this;
			};

			// Immediately just fail all tasks and go to any completion/failed methods
			this.kill = function(){
				failed = tasks;
				check();
				return this;
			};

			this.finished = function(fn,ctx,args){
				onComplete.push({
					fn:fn,
					ctx:ctx || {},
					args:args || []
				});

				check();

				return this;
			};

			this.passed = function(fn,ctx,args){
				onPass.push({
					fn:fn,
					ctx:ctx || {},
					args:args || []
				});

				check();

				return this;
			};

			this.failed = function(fn,ctx,args){
				onFail.push({
					fn:fn,
					ctx:ctx || {},
					args:args || []
				});

				check();

				return this;
			};

			this;
		}

		return (function(n){
			return new finished(n);
		});
	}
);
