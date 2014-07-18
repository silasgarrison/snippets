/* String.prototype */

String.prototype.val = function(){
	if(isNaN(this) || this.trim()==""){
		return 0;
	}
	return parseFloat(this);
}
String.prototype.isBetween = function(l,h){
	return this.val().isBetween(l,h);
}
if(!String.prototype.left){
	String.prototype.left = function(cnt){
		return this.substr(0,cnt);
	};
}

if(!String.prototype.right){
	String.prototype.right = function(cnt){
		return this.substr(this.length - cnt,this.length);
	};
}

String.prototype.repeat = function(n){
	var str = "";
	
	while(n > 0){
		str += this;
		--n;
	}
	
	return str;
}
	
String.prototype.append = function(str){
	return [this.toString(),str].join("");
};

String.prototype.prepend = function(str){
	return [str,this.toString()].join("");
};

/* Number.prototype */

Number.prototype.val = function(){
	return this.valueOf();
}

Number.prototype.isBetween = function(l,h){
	return (this >= l.val() && this <= h.val());
}

Number.prototype.toRad = function() {
	return this * Math.PI / 180;
}

Number.prototype.repeat = function(n){
	return this.toString().repeat(n);
}

Number.prototype.padZeros = function(n){
	return this.toString().padZeros(n);
};

