/**
 ** Examples:
 	function foo(word){
 		alert(word);
 	}
 	function fooTwo(){
 		alert(this.word);
 	}
 	obj = {
 		word : "JavaScript"
 	};
 	obj2 = {
 		word : "Browser"
 	}
 	
 	var test0 = foo.After(1000); // alerts "undefined" after 1s
 	var test1 = foo.After(500,["jEdit"]); // alerts "jEdit" after .5s
 	var test2 = fooTwo.After(3000,[]); // alerts "undefined" after 3s
 	var test3 = fooTwo.After(3000,[],obj); // alerts "JavaScript" after 3s
 	var test4 = foo.Every(5000,["Interval"]); // alerts "Interval" every 5s
 	var test5 = fooTwo.Every(10000,[],obj2,5); // alerts "Browser" every 5s - stops executing after 5 runs
 	
 	test3.exec(); // Immediately alerts "JavaScript"
 	test5.cancel(); // Stops this instance from running
 	test4.pause(); // Pauses this instance so the function doesn't execute upon the interval
 	(function(){
 		test4.play();
 	}).After(5000); // Resumes this instance after 5s
*/

Function.prototype.After = function(ms,args,sc){
	var fn,_tmo,_controls,_fn;

	fn = this;
	_fn = function(){
		return fn.apply(_controls.getScope(),_controls.getArgs());
	};
	// Extended methods for controlling the execution
	return _controls = ({
		start : function(){
			_tmo = setTimeout(_fn,ms);
			return this;
		},
		cancel : function(){
			clearTimeout(this.getInstance());
			return this;
		},
		setArgs : function(a){
			args = a;
			return this;
		},
		getArgs : function(){
			return args || [];
		},
		getInstance : function(){
			return _tmo;
		},
		getScope : function(){
			return sc || window;
		},
		setScope : function(s){
			sc = s || window;
			return this;
		},
		exec : function(){
			return _fn();
		},
		setDelay : function(t){
			// Set timing
			ms = t;
			// Kill off current timeout and restart it within new timing
			return this.cancel().start();
		}
	}).start();
};

Function.prototype.Every = function(ms,args,sc,maxCnt){
	var fn,_int,_cnt,_paused,_running,_controls,_fn;
	fn = this;
	_cnt = 0;
	_paused = false;
	_running = false;
	_fn = function(frc){
		// Make sure it's not paused or force it
		if(!_controls.isPaused() || frc){
			// Increment the execution count
			++_cnt;
			// Add an argument containing info on this execution - use slice() to clone
			var _args = _controls.getArgs().slice(0);
				_args.push({_int:_controls.getInstance(),_cnt:_controls.getCount()});
			// Execute
			var _res = fn.apply(_controls.getScope(),_args);
			// Determine if it should stop
			(_controls.getMaxCount() && _controls.getCount() >= _controls.getMaxCount()) && _controls.cancel();
			
			return _res;
		}
		
		return "Execution paused";
	};
	// Extended methods for controlling the execution
	return _controls = ({
		start : function(){
			if(!this.isRunning()){
				_running = true;
				_int = setInterval(_fn,ms);
			}
			return this;
		},
		cancel : function(){
			_running = false;
			clearInterval(this.getInstance());
			return this;
		},
		pause : function(){
			_paused = true;
			return this;
		},
		play : function(){
			_paused = false;
			return this;
		},
		restart : function(){
			// Reset execution count
			_cnt = 0;
			// Start new interval (do this in case the max was already reached and it's not currently running)
			return this.cancel().start();
		},
		isRunning : function(){
			return _running;
		},
		isPaused : function(){
			return _paused;
		},
		setArgs : function(a){
			args = a;
			return this;
		},
		getArgs : function(){
			return args || [];
		},
		getInstance : function(){
			return _int;
		},
		getCount : function(){
			return _cnt;
		},
		getMaxCount : function(){
			return maxCnt;
		},
		setMaxCount : function(cnt){
			maxCnt = cnt;
			return this;
		},
		getScope : function(){
			return sc || window;
		},
		setScope : function(s){
			sc = s || window;
			return this;
		},
		exec : function(){
			return _fn(true);
		},
		setDelay : function(t){
			// Set timing
			ms = t;
			// Kill off current interval and restart it within new timing
			return this.cancel().start();
		}
	}).start();
};
