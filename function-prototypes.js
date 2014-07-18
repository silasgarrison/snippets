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

Function.prototype.After = function(tm,args,sc){
	var fn = this;
	var _fn = function(){
		return fn.apply(sc || window,args || []);
	};
	
	var _tmo = setTimeout(_fn,tm);
	
	return {
		cancel : function(){
			clearTimeout(this.getInstance());
			return this;
		},
		setArgs : function(a){
			args = a;
			return this;
		},
		getArgs : function(){
			return args;
		},
		setScope : function(s){
			sc = s;
			return this;
		},
		getScope : function(){
			return sc;
		},
		getInstance : function(){
			return _tmo;
		},
		setDelay : function(t){
			this.cancel();
			tm = t;
			_tmo = setTimeout(_fn,tm);
			return this;
		},
		exec : function(){
			return _fn();
		}
	};
};

Function.prototype.Every = function(tm,args,sc,maxCnt){
	var fn = this;
	var args = args || [];
	var _cnt = 0;
	var _paused = false;
	var _fn = function(frc){
		if(!_paused || frc){
			++_cnt;
			var _args = args.slice(0);
				_args.push({_int:_int,_cnt:_cnt});
			var _res = fn.apply(sc || window,_args);
			
			if(maxCnt && _cnt >= maxCnt){
				clearInterval(_int);
			}
			
			return _res;
		}
		
		return "Execution Paused";
	};
	
	var _int = setInterval(_fn,tm);
	
	return {
		cancel : function(){
			clearInterval(this.getInstance());
			return this;
		},
		setArgs : function(a){
			args = a;
			return this;
		},
		getArgs : function(){
			return args;
		},
		setScope : function(s){
			sc = s;
			return this;
		},
		getScope : function(){
			return sc;
		},
		setMaxCount : function(cnt){
			maxCnt = cnt;
			return this;
		},
		getMaxCount : function(){
			return maxCnt;
		},
		getInstance : function(){
			return _int;
		},
		pause : function(){
			_paused = true;
			return this;
		},
		play : function(){
			_paused = false;
			return this;
		},
		setDelay : function(t){
			this.cancel();
			tm = t;
			_int = setInerval(_fn,tm);
			return this;
		},
		exec : function(){
			return _fn(true);
		}
	};
};
