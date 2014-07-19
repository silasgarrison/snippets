// Lazy
function $(i){
	return document.getElementById(i);
};

function swipeEvent(obj,fn){
	var swipes = {};
	obj.addEventListener("touchstart",function(e){
		e.preventDefault();
		swipes = {
			obj : this.id,
			x : e.touches.item(0).pageX,
			y : e.touches.item(0).pageY
		};
	});
	obj.addEventListener("touchend",function(e){
		e.preventDefault();
		if(!snake.isGoing()){
			snake.start();
		}
		if(swipes.obj === this.id){
			var _itm = e.changedTouches.item(0);
			if(_itm.pageY > window.swipes.y && Math.abs(_itm.pageY - window.swipes.y) > Math.abs(_itm.pageX - window.swipes.x)){
				fn("d");
			}
			else if(_itm.pageY < window.swipes.y && Math.abs(_itm.pageY - window.swipes.y) > Math.abs(_itm.pageX - window.swipes.x)){
				fn("u");
			}
			else if(_itm.pageX > window.swipes.x && Math.abs(_itm.pageX - window.swipes.x) > Math.abs(_itm.pageY - window.swipes.y)){
				fn("r");
			}
			else if(_itm.pageX < window.swipes.x && Math.abs(_itm.pageX - window.swipes.x) > Math.abs(_itm.pageY - window.swipes.y)){
				fn("l");
			}
		}
	});
}

snake = (function(cfg){
	var _controls,_game={},_board,_pallet,_points,_config,_DOWN=40,_RIGHT=39,_UP=38,_LEFT=37;
	
	return _controls = {
		init : function(cfg){
			_config = cfg || {
				id : "gameBoard",
				speed : 15,
				growth : 20
			};
			_board = $(_config.id);
			_pallet = _board.getContext("2d");
			_pallet.font = "25px Calibri";
			_pallet.fillStyle = "#999";
			_pallet.textAlign = "center";
			_pallet.fillText("Tap or click to begin!",_board.width / 2, _board.height / 2);
			if(typeof $("gameBoard").ontouchstart !== "undefined"){
				swipeEvent($("gameBoard"),function(d){
					if(_game.control && !_game.control.isPaused()){
						_controls.doMove(d);
					}
				});
			}
			else{
				document.addEventListener("keyup",function(e){
					if(_game.control && !_game.control.isPaused()){
						var d = e.keyCode === _DOWN?"d":"";
							d = e.keyCode === _RIGHT?"r":d;
							d = e.keyCode === _UP?"u":d;
							d = e.keyCode === _LEFT?"l":d;
							
						_controls.doMove(d);
					}
				});
			}
			return this;
		},
		start : function(){
			this.clear();
			_points = [{x:101,y:100,s:100,d:"r"}];
			_game = {
				control : this.move.Every(_config.speed,[],this),
				score : 0,
				size : 100
			};
			this.generateFood();
			return this;
		},
		end : function(){
			_game.control.cancel();
			_points = [];
			_pallet.font = "35px Calibri";
			_pallet.fillStyle = "#900";
			_pallet.textAlign = "center";
			_pallet.fillText("Game Over!",_board.width / 2, _board.height / 2);
			_pallet.font = "italic 15px Calibri";
			_pallet.fillStyle = "#090";
			_pallet.textAlign = "center";
			_pallet.fillText("Final score: " + _game.score,_board.width / 2,(_board.height / 2) + 15);
			_pallet.font = "13px Calibri";
			_pallet.fillStyle = "#999";
			_pallet.textAlign = "center";
			_pallet.fillText("Tap or click to play again",_board.width / 2,(_board.height / 2) + 30);
			_game = {};
			return this;
		},
		isGoing : function(){
			return _game.control?true:false;
		},
		pause : function(){
			_game.control.pause();
			return this;
		},
		resume : function(){
			_game.control.play();
			return this;
		},
		clear : function(){
			_board.height = _board.height;
			return this;
		},
		generateFood : function(){
			_game.food = [Math.floor(Math.random() * (_board.width - 5)) + 1,Math.floor(Math.random() * (_board.height - 5)) + 1];
			return this;
		},
		placeFood : function(){
			_pallet.beginPath();
			_pallet.arc(_game.food[0] + 2,_game.food[1] + 2,5,0,5 * Math.PI,false);
			_pallet.fillStyle = "#99C";
			_pallet.fill();
			return this;
		},
		move : function(){
			var i=0,j=0,_p,_x,_y,_newPoints=[],_bounds=[];
			this.clear();
			// Write score
			_pallet.font = "12px Calibri";
			_pallet.fillStyle = "#999";
			_pallet.textAlign = "right";
			_pallet.fillText("Score: " + _game.score,_board.width - 5,15);
			// Draw food
			this.placeFood();
			while(i < _points.length){
				_p = _points[i];
				_x=_p.x + ((_p.d === "r")?_p.s:0) - ((_p.d === "l")?_p.s:0);
				_y=_p.y + ((_p.d === "d")?_p.s:0) - ((_p.d === "u")?_p.s:0);
				
				_pallet.beginPath();
				_pallet.moveTo(_p.x,_p.y);
				_pallet.lineTo(_x,_y);
				_pallet.strokeStyle = "#000000";
				_pallet.lineWidth = 1;
				_pallet.lineCap = "round";
				_pallet.stroke();
				
				if(i+1 === _points.length){
					if(_x.isBetween(_game.food[0] - 3,_game.food[0] + 6) && _y.isBetween(_game.food[1] - 3,_game.food[1] + 6)){
						this.generateFood();
						_points[_points.length - 1].s += _config.growth;
						_game.size += _config.growth;
						_game.score += 5;
					}
				}
				
				if(i+1 === _points.length && _points.length > 1){
					while(j < _bounds.length){
						if(_x.isBetween(_bounds[j].x0,_bounds[j].x1) && _y.isBetween(_bounds[j].y0,_bounds[j].y1) && _p.s > 0){
							this.end();
							break;
						}
						++j;
					};
				}
				else{
					_bounds.push({x0:Math.min(_p.x,_x),y0:Math.min(_p.y,_y),x1:Math.max(_p.x,_x),y1:Math.max(_p.y,_y)});
				}
				
				// If the point is done don't add it back to the stack
				if(this.setPoint(_p,i,_points.length)){
					_newPoints.push(_p);
				}
				++i;
			}
			_points = _newPoints;
			return this;
		},
		doMove : function(dir){
			var _p = _points[_points.length - 1];
			if(dir === "d" && "ud".indexOf(_p.d) === -1){
				_points.push({x:_p.x + (_p.s * (_p.d==="l"?-1:1)),y:_p.y,s:0,d:"d"});
			}
			else if(dir === "r" && "lr".indexOf(_p.d) === -1){
				_points.push({x:_p.x,y:_p.y + (_p.s * (_p.d==="u"?-1:1)),s:0,d:"r"});
			}
			else if(dir === "u" && "ud".indexOf(_p.d) === -1){
				_points.push({x:_p.x + (_p.s * (_p.d==="l"?-1:1)),y:_p.y,s:0,d:"u"});
			}
			else if(dir === "l" && "lr".indexOf(_p.d) === -1){
				_points.push({x:_p.x,y:_p.y + (_p.s * (_p.d==="u"?-1:1)),s:0,d:"l"});
			}
			
			return this;
		},
		setPoint : function(p,i,l){
			if(p.x + p.s === _board.width && p.d === "r" && i+1===l){
				_points.push({x:1,y:p.y,s:0,d:"r"});
			}
			else if(p.y + p.s === _board.height && p.d === "d" && i+1===l){
				_points.push({x:p.x,y:1,s:0,d:"d"});
			}
			else if(p.x - p.s === 0 && p.d === "l" && i+1===l){
				_points.push({x:_board.width,y:p.y,s:0,d:"l"});
			}
			else if(p.y - p.s === 0 && p.d === "u" && i+1===l){
				_points.push({x:p.x,y:_board.height,s:0,d:"u"});
			}
			else {
				if(l > 1){
					p.s += i+1===l?((p.s < _game.size)?1:0):i===0?-1:0;
				}
				if(i===0 && (p.d === "r" || p.d === "d")){
					++p[p.d === "r"?"x":"y"];
				}
				else if(i===0 && (p.d === "l" || p.d === "u")){
					--p[p.d === "l"?"x":"y"];
				}
			}
			
			if(p.s <= 0){
				return false;
			}
			
			return true;
		}
	};
})();
