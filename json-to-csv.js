/**
 * @summary     JSON.csv
 * @description	Converts a JSON object into CSV format with options for column headers and custom delimiter.
 				Initial version expects the object to be an array of simple objects with key/value pairs
 * @version     1.0
 * @file        json-to-csv.js
 * @author      Silas Garrison (http://silasgarrison.com/)
 *
 * This source file is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 *
 ** Examples:
 	var fooData = [{value1:"foo baz",someOption:"config",nums:1056,useIt:false,lastCol:"final"},
					{value1:"foo baz",someOption:"config",nums:1056,useIt:false,lastCol:"final"}];
	JSON.csv(fooData,{columnHeaders:true,delimiter:"\t"});
	>> "value1,someOption,nums,useIt,lastCol
		foo baz	config	1056	false	final
		foo baz	config	1056	false	final"
*/

JSON.csv = function(o,args){
	"use strict";
	
	var headers = [],
		// Stringify the object then replace array literals
		strData = this.stringify(o).replace(/^\[|\]$/g,""),
		args = args?args:{},
		options = {
			columnHeaders : typeof args.columnHeaders !== "undefined"?args.columnHeaders:false,
			delimiter : args.delimiter || ","
			
		};
	
	// Wrap primitive values (boolean/numbers) with quotes so the rest of the RegEx will work
	strData = strData.replace(/":([0-9]{0,}|true|false),"/ig,function(str){
		return ["\":\"",str.split("\":")[1].split(",")[0],"\",\""].join("");
	});
	// Same as above, only for end of line values
	strData = strData.replace(/":[A-Z0-9]+\}/ig,function(str){
		return ["\":\"",str.split("\":")[1].split("}")[0],"\"}"].join("");
	});
	// Delimiter for each line
	strData = strData.replace(/"\},\{"/g,"\n").replace(/^\{/,"").replace(/\}$/,"");
	// Delimiter for each column
	strData = strData.replace(/","/g,options.delimiter);
	// Setup column headers
	if(options.columnHeaders){
		strData.split("\n")[0].replace(/["|"A-Z|0-9|_"]+:"/ig,function(header){
			headers.push(header.replace(/^"/,"").replace(/":"$/,""));
		});
	}
	// Strip key names
	strData = strData.replace(/["|"A-Z|0-9|_"]+:"/ig,"");
	// Strip extraneous quotes
	strData = strData.replace(/"$/,"");
	// Piece it together
	strData = [headers.join(","),options.columnHeaders?"\n":"",strData].join("");

	return strData;
};