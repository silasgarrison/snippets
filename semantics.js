/**
 * @summary     semantics
 * @description Simple string compiler for creating semantic templates
 * @version     1.2
 	> x-1.0 Basic array iteration and simple truthy/falsy statements
 	> 1.1 Added support for diverse conditional statements that go beyond simple truthy/falsy statements
		- Added private variable ".__i" inside a loop's context for getting the current iteration's index
	> 1.2 Added support for traversing up the object tree via the ".__parent" property when in a loop
		- Fix for nested loops to not always point to the top level object but to each loops context is the item's object
		- Added support for modulus and division in if statements
		- Added support for helper methods to format or extend variables
 * @file        semantic.js
 * @author      Silas Garrison (http://silasgarrison.com/)
 *
 * This source file is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 *
 ** Examples:
 	// Some object
 	var obj = {
		id:"Global",
		name:"Something",
		foo:[
			{id:"1",name:"Desert"},
			{id:"2",name:"Oasis"},
			{id:"3",name:"",address:"Middle of nowhere"},
			{id:"4",name:""}
		],
		prez:[
			{id:"8",name:"Las Vegas"},
			{id:"9",name:"Nevada"}
		],
		baz:[
			{prop:"Helper",space:""},
			{prop:"Invoice",space:"Zero"},
			{prop:"Shopper",space:"Free"}
		]
	};
	
	// Uncompiled source string
	var str = ["<div id=\"{id}\">"];
		str.push("\n");
		str.push("{if:name}{name}{else}No name{/if}, Welcome!");
		str.push("{[prez]}");
		str.push("Below is the {id} record for {name} you:");
		str.push("\n");
		str.push("{[__parent.baz]}\n{prop} is not a {if:space}<strong>{space}</strong>{else}___{/if}<br />{[/__parent.baz]}");
		str.push("{[/prez]}");
		str.push("<ul>");
		str.push("{[foo]}");
		str.push("\n<li id=\"{id}\">");
		str.push("{if:name}");
		str.push("\n<strong>Hi {name} child of {__parent.name} {if:__parent.id == Global}who's a global guy{else}not a global guy{/if}! {if:address}You live at {address}{else}You have no address{/if}</strong>");
		str.push("{else}");
		str.push("\nNo name {if:address}you live at {address}{else}you have no address{/if}");
		str.push("{/if}");
		str.push("\nThis instance has {if:id}an ID of {id}{else}no ID{/if}.");
		str.push("\n</li>");
		str.push("{[/foo]}");
		str.push("</ul>");
		str.push("</div>");
	
	// Compiled string
	var compiled = str.join("").compile(obj);
	
	console.log(compiled);
*/

// Helper method
if(!JSON.clone){
	JSON.clone = function(a){
		return JSON.parse(JSON.stringify(a));
	};
}

// Builds a compiled template off a source string and object - uses the assign method to populate strings but has built-in support for array iteration and simple if block conditionals
String.prototype.compile = function(o){
	"use strict";
	
	var str,
		doLoops,
		doIf,
		i,
		len,
		o=o,
		rgx={
			startLoop : /\{\[/,
			closeLoop : /\]\}/,
			loopName : /\{\[[A-Z0-9|_|\-|\.| |:]+\]\}/i,
			startIf : /\{if\:[A-Z0-9|_|\-|\.| |%]+[==|\!=|\!==|<|>|<=|>=]{0,}[A-Z0-9|_|\-| ]+\}|\{if\:[A-Z0-9|_|\-|\.| ]+\}/ig,
			closeIf : /\{\/if\}/
		},
		helpers = o.helpers || {};
	
	str = this;
	
	doLoops = function(str,obj){
		var rep = [];
		// Replacement callback
		var doReplace = function(key,plc,origStr){
			var arrName,arrCond,i,len,arr,itm,itr,thisItr,newStr,start=0,end=Infinity,key;
			// Get the key name
			arrName = key.replace(rgx.startLoop,"").replace(rgx.closeLoop,"");
			// Check if a limitation has been placed
			if(arrName.indexOf(":") !== -1){
				arrCond = arrName.split(":")[1].trim();
				start = arrCond.split("-").length > 1?arrCond.split("-")[0].val():start;
				end = arrCond.split("-").length > 1?arrCond.split("-")[1].val():arrCond.split("-")[0].val();
				arrName = arrName.split(":")[0].trim();
			}
			// Get the appropriate array in the object chain
			arr = obj;
			arrName.split(".").forEach(function(itm,idx){
				arr = arr[itm];
			});
			// See if there's a valid array from the named object chain above
			// Then see if there's a helper method matching the array name (call from top level object "o")
			// Default to an empty set
			arr = arr || (o.helpers[arrName] && o.helpers[arrName](obj)) || [];
			// Get the contents of the loop
			itr = origStr.substr(plc).split(key)[1].split("{[/" + arrName + "]}")[0];
			newStr = [];
			// Compile each iteration - can be an actual array or named array (hash map)
			if(!Array.isArray(arr)){
				i = 0;
				for(key in arr){
					if(arr.hasOwnProperty(key)){
						itm = typeof arr[key] === "object"?arr[key]:{item:arr[key]};
						thisItr = itr;

						// Put private pointer to loop iteration sequence
						if(!itm.__parent){
							var itm = JSON.clone(itm);
							itm.__key = key;
							itm.__i = i;
							itm.__parent = obj;
						}
						// If this iteration (contents of the loop) contains another loop, compile it now
						if(thisItr.indexOf("{[") !== -1 && thisItr.indexOf("]}") > thisItr.indexOf("{[")){
							thisItr = doLoops(thisItr,itm);
						}

						// Parse Ifs and output content for this string
						newStr.push(doIf(thisItr,itm).assign(itm,helpers));
						++i;
					}
				}
			}
			else{
				for(i=start,len=Math.min(arr.length,end); i < len;i++){
					itm = typeof arr[i] === "object"?arr[i]:{item:arr[i]};
					thisItr = itr;

					// Put private pointer to loop iteration sequence
					if(!itm.__parent){
						var itm = JSON.clone(itm);
						itm.__i = i;
						itm.__parent = obj;
					}
					// If this iteration (contents of the loop) contains another loop, compile it now
					if(thisItr.indexOf("{[") !== -1 && thisItr.indexOf("]}") > thisItr.indexOf("{[")){
						thisItr = doLoops(thisItr,itm);
					}

					// Parse Ifs and output content for this string
					newStr.push(doIf(thisItr,itm).assign(itm,helpers));
				}
			}
			// Add a key/value pair for each source string and it's compiled replacement
			rep.push({thisStr:key + itr + "{[/" + arrName + "]}",thatStr:newStr.join("")});
			// Simply return the value the regex found - actual string rebuilding is done below
			return key;
		};
	
		str.replace(rgx.loopName,doReplace);
		
		// If the replacement array contains values, iterate over it and call the regex again until it's empty
		while(rep.length > 0){
			rep.forEach(function(itm,idx){
				// Build a regex safe string of the source template/HTML and replace it with the compiled version
				str = str.replace(new RegExp(itm.thisStr.rsafe()),itm.thatStr);
			});
			// Clear out the replacements
			rep = [];
			str = str.replace(rgx.loopName,doReplace);
		}
		return str;
	};
	
	// Logical if computation
	doIf = function(str,obj){
		var finalStr = str;
		var fnParseIf = function(str){
			var opts = ["===","==","!==","!=","<=",">=","<",">"],
				results = null,
				prop = null,
				val = null,
				cmds = {
				exec : function(cmd){
					// Handle if statements with modulus or division
					var opr = ["%","/"],
						oprExc = {
							"%" : function(a,b){
								return a % b;
							},
							"/" : function(a,b){
								return a / b;
							}
						},
						expr = str.split(cmd)[0];
					// Loop through each possible operator allowed and parse the property if found
					opr.forEach(function(itm,idx){
						if(expr.indexOf(itm) !== -1){
							prop = oprExc[itm](["{",expr.split(itm)[0],"}"].join("").assign(obj,helpers),expr.split(itm)[1]);
						}
					});
					// If the property wasn't rendered above (no operators) parse it now
					prop = prop === null?["{",expr,"}"].join("").assign(obj,helpers):prop,
					val = str.split(cmd)[1].trim();
					return this[cmd]();
				},
				"===" : function(){
					return prop === val;
				},
				"==" : function(){
					return prop == val;
				},
				"!==" : function(){
					return prop !== val;
				},
				"!=" : function(){
					return prop != val;
				},
				"<=" : function(){
					return prop <= val;
				},
				"=>" : function(){
					return prop >= val;
				},
				"<" : function(){
					return prop < val;
				},
				">" : function(){
					return prop > val;
				}
			};
			
			opts.forEach(function(itm,idx){
				if(str.indexOf(itm) !== -1){
					results = cmds.exec(itm);
				}
			});
			
			return results === null?!!obj[str]:results;
		};
		var lastIndex = str.indexOf("{if:");
		
		if(lastIndex !== -1){
			// Find all instances of {if:condition}
			str = str.replace(rgx.startIf,function(key,plc,str){
				var stm,res,itr,optA,optB,i,arr,open,closed,exCnt=0;
				
				// The key is the condition (i.e. {if:name} would be name)
				stm = key.split(":")[1].split("}")[0];
				// Validate whether this condition is truthy/falsy
				res = fnParseIf(stm);
				// Get the parts of this if block
				arr = str.substr(plc).split(key)[1].split("{/if}");
				// These counters keep track of which if statement is open/closed and iteration counter
				i=0;
				open=1;
				closed=0;
				itr = "";
				
				while(i < arr.length){
					closed += 1;
					// If the number of open and closed tags match, add the string to the if body
					if(open === closed){
						itr += arr[i] + ((i+1 < arr.length)?"{/if}":"");
					}
					open += arr[i].split("{if:").length - 1;
					
					++i;
				}
				// Now determine else statements
				arr = itr.split("{else}");
				// If there's more than one else (meaning other if statements are in the body of this if)
				if(arr.length > 2){
					open=0;
					closed=0;
					optA = "";
					optB = "";
					
					i=0;
					// Loop through body parts and determine if the string goes to optA (true part of statement) or optB (false/else part of statement)
					while(i < arr.length){
						// If all the other if bodies are closed put this else under optB
						if((open === closed && open+closed > 0) || optB !== ""){
							optB += arr[i] + "{else}";
						}
						else{
							optA += arr[i] + "{else}";
						}
						
						open += arr[i].split("{if:").length - 1;
						closed += arr[i].split("{/if}").length - 1;
						
						++i;
					}
					// Cleanup strings
					optA = optA.substr(0,optA.length - 6);
					optB = optB.substr(0,optB.length - 6);
				}
				else {
					// If there's only one else in the body of the if (its own)
					optA = arr[0] || "";
					optB = arr[1] || "";
				}
				
				// Now replace the conditional statement with the result (i.e. {if:name}Hello, {name}{else}No name found{/if} >> No name found)
				finalStr = finalStr.replace(new RegExp(key + itr.rsafe()),(res?optA:optB));
				
				// Parse any other if blocks - make sure the last if block isn't this one (aka, bad syntax)
				while(finalStr.indexOf("{if:") !== -1 && finalStr.indexOf("{if:") !== lastIndex){
					lastIndex = finalStr.indexOf("{if:");
					finalStr = doIf(finalStr,obj);
				}
				
				return key;
			});
		}
		
		// Strip any extraneous if block closers
		return finalStr.replace(rgx.closeIf,"");
	};
	
	// Parse any if blocks on the main string and parse output
	return doIf(doLoops(str,o),o).assign(o,helpers);
};

// Escape all special characters (i.e. <div>{name}</div> >> rsafe() >> <div>\{name\}<\/div>)
String.prototype.rsafe = function(){
	"use strict";
	
	var str,cha,i,len;
	
	str = this;
	cha = ["\\","[","]","+","*","^","/","(",")"];
	
	cha.forEach(function(itm,idx){
		str = str.replace(new RegExp("\\" + itm,"g"),"\\" + itm);
	});
	
	str = str.replace(/\{/ig,"\\{");
	str = str.replace(/\}/ig,"\\}");
	
	return str;
};

// Simple assignment function for outputting object variables in a string (i.e. Hello, {name} >> assign({name:"Silas"}) >> Hello, Silas)
String.prototype.assign = function (o,helpers){
	"use strict";
	
	var str = this;
		str = str.replace(/\{[A-Za-z0-9|_|\.| ]+\}/ig,function(a){
			var value = a.replace(/\{/,"").replace(/\}/,"").split("."),retVal=o;
				value.forEach(function(itm,idx){
					// Allow "helper" functions to be used
					retVal = itm === "helpers" && helpers?helpers:(retVal || {})[itm.trim()];
					// If the returnVal is a function, execute now
					if(typeof retVal === "function"){
						retVal = retVal(o);
					}
				});
			return typeof retVal === "undefined"?"":retVal;
		});
	return str;
};

