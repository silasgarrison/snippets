/**
 * @summary     serializeFields
 * @description jQuery plugin to serialize form fields even if not found inside a form
 * @version     1.1.5
 * @file        jquery.serializeFields.js
 * @author      Silas Garrison (http://silasgarrison.com/)
 *
 * This source file is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 *
 ** Examples:
 	// Basic syntax: $(selector).serializeFields() - returns an encoded query string (i.e. a=b&c=d%20e)
	$("#dialog-entry").serializeFields();
	
	// Advanced syntax: $(selector).serializeFields(oOptions)
	// [object] oOptions - is an object that can contain:
	// [string] type - Defines the returned format.  Either JSON or URL (default URL)
	// [boolean] encode - Indicates whether or not each form field value is encoded (default true)
	// [boolean] checked - If true, it will only include an element and the value assigned if the element is checked (default false)
	// [string] uniKey - Unique string to append to form field names if field names in a modal conflict with containing page.  This key will get stripped upon serialization (default blank)
	$("#dialog-entry").serializeFields({type:"JSON",checked:true});
*/

(function($){
	$.fn.serializeFields = function(opt){
		var opt = (opt)?opt:{},
			// Serialize object to store values
			srlz = {},
			_strSrlz = "",
			// Allow keys to be uniquely named on input but stripped on output
			uniKey = opt.uniKey?opt.uniKey:"",
			// Since adding a value takes multiple lines, create function once
			_doSerialize = function(v,o){
				// Encode if opted as true or excluded
				var v = (opt.encode || typeof(opt.encode) == "undefined")?encodeURIComponent(v):v;
				// Place id in var and strip unique key
				var _id = (o.name != "")?o.name:o.id;
					_id = (uniKey != "")?_id.replace(new RegExp(uniKey),""):_id;
				// Serialize as JSON then conver to URL later if specified - for checkboxes/radios check to see if a previous value is saved
				srlz[_id] = (srlz[_id]?srlz[_id]:"") + ((v != "" && srlz[_id])?",":"") + v;
			};
		// Serialize drop downs
		$(this).find("select").each(function(){
			var _val = "";
			
			// Loop over all options in case it's multi-select
			for(var i=0,len=this.options.length;i < len;i++){
				if(this.options[i].selected){
					_val += ((_val != "")?",":"") + this.options[i].value;
				}
			}
			
			_doSerialize(_val,this);
		});
		// Serialize input tags
		$(this).find("input").each(function(){
			// Allow options to exclude those not checked
			if((opt.checked && (this.type == "checkbox" || this.type == "radio") && this.checked) || (this.type != "checkbox" && this.type != "radio") || !opt.checked){
				_doSerialize(this.value,this);
			}
			else{
				_doSerialize("",this);
			}
		});
		// Serialize textarea tags
		$(this).find("textarea").each(function(){
			_doSerialize(this.value,this);
		});
		
		if(opt.type != "JSON"){
			for(var key in srlz){
				if(srlz.hasOwnProperty(key)){
					_strSrlz += ((_strSrlz != "")?"&":"") + key + "=" + srlz[key];
				}
			}
			// Re-assign return value
			srlz = _strSrlz;
		}
		
		return srlz;
	};
})(jQuery);
