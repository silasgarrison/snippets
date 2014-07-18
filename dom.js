/**
 * @summary     dom
 * @description DOM element creation library
 * @version     1.5
 * @file        dom.js
 * @author      Silas Garrison (http://silasgarrison.com/)
 *
 * This source file is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 *
 ** Examples:
 	// Basic syntax: new dom.tagname()
	var div = new dom.div();
	
	// Properties can be applied in chaining: new dom.tagname().property1(value).property2(value)
	var table = new dom.table().cellpadding("2").cellspacing("0");
	
	// Styles are a bit different as well as innerHTML
	var div2 = new dom.div().html("<strong>Hello World!</strong>").style({color:"red"});
	
	// When adding newly created elements to other DOM objects you reference the "el" property (this is the actual DOM element): $("#id").append(new dom.tagname().el)
	$("#id").append(div2.el);
	
	// Building multiple nested tags can be done through the use of the append method: new dom.tagname().append(new dom.tagname2().el)
	var table = new dom.table().cellpadding("2").append(new dom.tr().append(new dom.td().el).el);
	
	// Additionally, if you have to re-use a similar tag a lot (say in a for loop with several properties set) you can use the clone method: var tag = new dom.tagname(); ... new dom.tagname2().append(tag.clone())
	var td = new dom.td().style({"color":"#003366","backgroundColor":"#990000"}).align("center");
	var tr = new dom.tr();
	for(var i=0,len=someRows.length;i < len;i++){
		// NOTE: When using clone() you don't have to specify .el
		tr.append(td.html(someRows[i].value1).clone()).append(td.html(someRows[i].value2).clone());
	}
*/

var dom = {
    text: function (e) {
        this.el = document.createTextNode(e);
        return this
    },
    fragment: function () {
        this.el = document.createDocumentFragment();
        return this
    },
    _prototypes: {
        style: function (e) {
            if (e) {
                if (typeof e == "string") {
                    return this.el.style[e]
                } else {
                    for (var t in e) {
                        if (e.hasOwnProperty(t)) {
                            this.el.style[t] = e[t]
                        }
                    }
                    return this
                }
            } else {
                return this.el.style
            }
        },
        CSS: function () {
            for (var e = 0, t = arguments.length; e < t; e++) {
                if (typeof arguments[e] == "string") {
                    this.className(arguments[e])
                } else {
                    this.style(arguments[e])
                }
            }
            return this
        },
        html: function (e) {
            if (typeof e == "string") {
                this.el.innerHTML = e;
                return this
            } else {
                return this.el.innerHTML
            }
        },
        append: function () {
            var e = arguments;
            for (var t = 0, n = e.length; t < n; t++) {
                this.el.appendChild(e[t])
            }
            return this
        },
        clear: function (e) {
            var t = e ? e : this.el;
            if (t.hasChildNodes()) {
                while (t.childNodes.length >= 1) {
                    t.removeChild(t.firstChild)
                }
            }
            return this
        },
        clone: function () {
            return this.el.cloneNode(true)
        },
        prop: function (e, t) {
            if (t) {
                this.el[e] = t;
                return this
            } else if (typeof e == "object") {
                for (var n in e) {
                    if (e.hasOwnProperty(n)) {
                        this.el[n] = e[n]
                    }
                }
                return this
            } else {
                return this.el[e]
            }
        }
    },
    _tags: "a,abbr,address,area,article,aside,audio,b,base,bdi,bdo,blockquote,body,br,button,canvas,caption,cite,code,col,colgroup,command,datalist,dd,del,details,dfn,div,dl,dt,em,embed,fieldset,figcaption,figure,font,footer,form,frame,frameset,h1,head,header,hgroup,hr,html,i,iframe,img,input,ins,keygen,kbd,label,legend,li,link,map,mark,menu,meta,meter,nav,noscript,object,ol,optgroup,option,output,p,param,pre,progress,q,rp,rt,ruby,s,samp,script,section,select,small,source,span,strong,style,sub,summary,sup,table,tbody,td,textarea,tfoot,th,thead,time,title,tr,track,ul,var,video,wbr".split(","),
    _props: "accesskey,align,border,cellpadding,cellspacing,checked,className,colspan,contenteditable,contextmenu,controls,dir,draggable,dropzone,height,hidden,href,hspace,id,label,lang,longdesc,maxlength,name,noshade,nowrap,placeholder,readonly,rel,rev,role,rows,rowspan,selected,size,spellcheck,src,summary,tabindex,target,text,title,type,value,vspace,width".split(","),
    _init: function () {
        var e = function (e) {
            return function (t) {
                this.el = document.createElement(e);
                return this
            }
        };
        for (var t = 0, n = this._tags.length; t < n; t++) {
            var r = this._tags[t];
            this[r] = e(r)
        }
        var e = function (e) {
            return function (t) {
                if (t || typeof t == "string") {
                    if (",colspan,maxlength,".indexOf("," + e + ",") != -1) {
                        this.el.setAttribute(e, t)
                    } else {
                        this.el[e] = t
                    }
                    return this
                } else {
                    return this.el[e]
                }
            }
        };
        for (var t = 0, n = this._props.length; t < n; t++) {
            var i = this._props[t];
            this._prototypes[i] = e(i)
        }
        for (var s in this) {
            if (this.hasOwnProperty(s)) {
                if (s.left(1) != "_") {
                    for (var o in this._prototypes) {
                        if (this._prototypes.hasOwnProperty(o)) {
                            this[s].prototype[o] = this._prototypes[o]
                        }
                    }
                }
            }
        }
        dom.clear = dom._prototypes.clear
    }
};
dom._init()
