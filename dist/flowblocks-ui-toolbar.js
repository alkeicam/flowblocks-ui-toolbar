!function(t,e){"object"==typeof exports&&"object"==typeof module?module.exports=e(require("joint")):"function"==typeof define&&define.amd?define(["joint"],e):"object"==typeof exports?exports["flowblocks-ui-toolbar"]=e(require("joint")):t["flowblocks-ui-toolbar"]=e(t.joint)}(this,(function(t){return function(t){var e={};function i(o){if(e[o])return e[o].exports;var r=e[o]={i:o,l:!1,exports:{}};return t[o].call(r.exports,r,r.exports,i),r.l=!0,r.exports}return i.m=t,i.c=e,i.d=function(t,e,o){i.o(t,e)||Object.defineProperty(t,e,{enumerable:!0,get:o})},i.r=function(t){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},i.t=function(t,e){if(1&e&&(t=i(t)),8&e)return t;if(4&e&&"object"==typeof t&&t&&t.__esModule)return t;var o=Object.create(null);if(i.r(o),Object.defineProperty(o,"default",{enumerable:!0,value:t}),2&e&&"string"!=typeof t)for(var r in t)i.d(o,r,function(e){return t[e]}.bind(null,r));return o},i.n=function(t){var e=t&&t.__esModule?function(){return t.default}:function(){return t};return i.d(e,"a",e),e},i.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},i.p="",i(i.s=2)}([function(e,i){e.exports=t},function(t,e){t.exports=new class{constructor(t){this.SIZE={width:70,height:70},this.LABEL={FONT:{SIZE:.15,FAMILY:"Helvetica",WEIGHT:"bold"}},this.POSITION={x:40,y:20},this.POSITION_DELTA={dx:50,dy:50},this.STYLE="americana",this.STYLES={americana:{bodyColor:"#74b9ff",titleBarColor:"#ffeaa7",statusBarColor:"#fdcb6e",portInColor:"#00cec9",portOutColor:"#ff7675",validationERRORColor:"#d63031",validationOKColor:"#00b894"},original:{bodyColor:"#3DB5FF",titleBarColor:"rgb(255, 230, 206)",statusBarColor:"rgb(209, 226, 208)",portInColor:"#16A085",portOutColor:"#E74C3C",validationERRORColor:"#950952",validationOKColor:"#008D83"},cream:{bodyColor:"#FAE8FF",titleBarColor:"#E1C2ED",statusBarColor:"#E1C2ED",portInColor:"#936DED",portOutColor:"#F2EAD7",validationERRORColor:"#950952",validationOKColor:"#008D83"}},this.TOOLBAR={SIZE:{width:110,height:110},PADDING:{x:20,y:20},ROW_PADDING:30,FONT:{SIZE:.15,FAMILY:"Helvetica",WEIGHT:"bold"},DRAG:{SIZE:{width:150,height:150}}}}}({})},function(t,e,i){const o=i(0),r=i(1),s=i(3);class a{constructor(){this.elementId=void 0,this.category=void 0,this.graph=void 0,this.paper=void 0,this.emitter=void 0,this.state=void 0,this._items=[],this.options={size:r.TOOLBAR.SIZE,padding:r.TOOLBAR.PADDING,rowPadding:r.TOOLBAR.ROW_PADDING}}create(t,e){this.state="UNATTACHED",this.category=t,this.emitter=e}removeAllItems(){this.state="UNATTACHED",this.graph.removeCells(this._items),this._items=[]}addItem(t){return this._items.push(t),this._add(t),t}_add(t){if("UNATTACHED"==this.state)return this.state="PENDING",this.emitter.emit("toolbar-drawer:requested",this.category),t;this.graph.addCell(t),this._resizeItem(t),this._repositionItems()}_attach(t){this.elementId=t,this.graph=new o.dia.Graph,this.paper=new o.dia.Paper({el:document.getElementById(t),width:this.options.size.width,height:this.options.size.height,gridSize:1,model:this.graph,background:{color:"transparent"},interactive:!1,snapLinks:!1,linkPinning:!1,embeddingMode:!1,clickThreshold:5,defaultConnectionPoint:{name:"boundary"},validateConnection:function(t,e,i,o,r,s){return!1}}),this._bindEvents(),this._items.forEach(t=>{this._add(t)}),this.state="ATTACHED",this.emitter.emit("toolbar-drawer:attached",this.category,this.elementId)}_bindEvents(){var t=this;this.paper.on("cell:pointerdown",(function(e,i,o,r){var s=e.model,a=s.get("_type");t.emitter.emit("toolbar-item:drag",a,s,o,r,i)}))}_resizeItem(t){var e=this.options.size.width,i=2*this.options.padding.x,o=e-(i*=1.2);t.set("size",{width:o,height:o})}_repositionItems(){var t=this,e={x:15,y:5},i=0;this._items.forEach(o=>{var r=o.findView(this.paper),s={x:e.x,y:e.y+r.getBBox().height/6};i=s.y+r.getBBox().height,t.paper.setDimensions(t.paper.width,i),o.set("position",s),e={x:s.x,y:s.y+r.getBBox().height}})}}class l{constructor(t){this.emitter=void 0,this.drawers=[],this.options={},Object.assign(this.options,t),this._initialize()}_initialize(){}create(t){var e=new l;return e.emitter=t,e._bindAppEvents(),e}_bindAppEvents(){var t=this;this.emitter.on("toolbar-drawer:ready",(function(e,i){var o=t.drawers.find(t=>t.category==e);o&&o._attach(i)})),this.emitter.on("toolbar:reset",(function(e){t.removeAllItems(),e.forEach(e=>{t.createToolbarItem(e)}),console.log("Flowblocks UI Toolbar restarted and running")}))}removeAllItems(){this.drawers.forEach(t=>{t.removeAllItems()}),this.emitter.emit("toolbar-drawer:removedall")}addItem(t,e){var i=this.drawers.find(t=>t.category==e);i||((i=new a).create(e,this.emitter),this.drawers.push(i)),i.addItem(t)}createToolbarItem(t,e){var i=s.createBlank(t.template,t.statusDefinition,t.style);return i.set("name",t.name),i.set("_type",t.name),e&&i.set("size",e),t.icon&&(-1==t.icon.lastIndexOf("/")?i.set("icon","https://unpkg.com/flowblocks/dist/resources/img/svg/"+t.icon+".svg"):i.set("icon",t.icon)),this.addItem(i,t.category),i}}t.exports=new l({})},function(t,e,i){const o=i(0),r=i(1);t.exports=new class{constructor(t){this.options={defaultSize:r.SIZE,defaultPosition:r.POSITION,defaultPositionDelta:r.POSITION_DELTA},this.Model={},this.View={},Object.assign(this.options,t),this._initialize()}_initialize(){o.shapes.flowblocks||(o.shapes.flowblocks={}),o.shapes.flowblocks.toolbar||(o.shapes.flowblocks.toolbar={}),this.Model=o.shapes.devs.Model.define("flowblocks.toolbar.BlockToolbarItem",{name:"",icon:"./resources/img/svg/agave.svg",debug:!0,_style:void 0,_defaultStyle:r.STYLE,_styles:r.STYLES,_type:void 0,attrs:{rect:{fill:"rgb(211, 55, 255)"},body:{fill:"#ffffff",stroke:"#000000"},link:{refWidth:"100%",refHeight:"100%",xlinkShow:"new",cursor:"pointer"},".status-err":{refHeight:"25%",fill:"rgb(204, 41, 0)",refY:"75%"},".fb-icon-rect":{"ref-width":"100%",fill:"#3DB5FF"},".fb-icon-image":{ref:".fb-icon-rect"},".fb-status-rect":{"ref-width":"100%",fill:"rgb(209, 226, 208)"},".fb-status-text":{ref:".fb-status-rect","text-anchor":"start",fill:"black","y-alignment":"middle"},".fb-label-rect":{"ref-width":"100%",fill:"rgb(255, 230, 206)"},".fb-validation-rect":{fill:"#d63031"},".fb-label-text":{ref:".fb-label-rect","text-anchor":"start",fill:"black","y-alignment":"middle"},".fb-tool-label-text":{"text-anchor":"start",fill:"black","y-alignment":"middle"}}},{markup:['<g class="rotatable">','<rect class="body"/>','<rect class="fb-icon-rect"/>','<image class="fb-icon-image" href="//resources/img/svg/agave.svg" />','<rect class="fb-label-rect"/>','<text class="fb-label-text">Label</text>','<rect class="fb-status-rect"/>','<text class="fb-tool-label-text"></text>',"</g>"].join(""),initialize:function(){this.on("change:name change:icon change:status change:statusMsg change:size",(function(){this._updateMyModel(),this.trigger("flowblocks-block-toolbar-item-update")}),this),this._updateMyModel(),o.shapes.devs.Model.prototype.initialize.apply(this,arguments)},style(t){if(t)if("string"==typeof t||t instanceof String){var e=this.get("_styles")[t.toLocaleLowerCase()];e&&this.style(e)}else this.set("_style",t),t.icon&&this.set("icon",t.icon),t.bodyColor&&this.attr(".fb-icon-rect/fill",t.bodyColor),t.titleBarColor&&this.attr(".fb-label-rect/fill",t.titleBarColor),t.statusBarColor&&this.attr(".fb-status-rect/fill",t.statusBarColor),t.portInColor&&this.getPorts().forEach(e=>{"in"==e.group&&this.portProp(e.id,"attrs/circle/fill",t.portInColor)}),t.portOutColor&&this.getPorts().forEach(e=>{"out"==e.group&&this.portProp(e.id,"attrs/circle/fill",t.portOutColor)});else this.style(this.get("_defaultStyle"))},_recalculateRectWithLabel:function(t,e,i,o,r,s){this.get("attrs");var a=i*r.height,l=o*a,n=s+a/2,h=.1*r.width;return this.attr(t+"-rect/height",a),this.attr(t+"-rect/transform","translate(0,"+s+")"),this.attr(t+"-text/font-size",l),this.attr(t+"-text/transform","translate("+h+","+n+")"),this.attr(t+"-text/text",e),a},_recalculateToolLabel:function(t,e,i,o){var s=i.height*r.TOOLBAR.FONT.SIZE,a=o+s;this.attr(t+"-text/font-size",s),this.attr(t+"-text/transform","translate(0,"+a+")"),this.attr(t+"-text/text",e),this.attr(t+"-text/font-family",r.TOOLBAR.FONT.FAMILY),this.attr(t+"-text/font-weight",r.TOOLBAR.FONT.WEIGHT)},_recalculateValidationRect:function(t,e,i,o,r){this.get("attrs");var s=e*o.height,a=(1-i)*o.width,l=i*o.width;return this.attr(t+"-rect/height",s),this.attr(t+"-rect/width",l),this.attr(t+"-rect/transform","translate("+a+","+r+")"),this.attr(t+"-rect/title","Block validation state: "+this.get("status")),s},_recalculateRectWithIcon:function(t,e,i,o,r,s){var a=i*r.height;this.attr(t+"-rect/height",a),this.attr(t+"-rect/transform","translate(0,"+s+")");var l=o*a,n=r.width/2-l/2,h=s+a/2-l/2;return this.attr(t+"-image/height",l),this.attr(t+"-image/transform","translate("+n+","+h+")"),this.attr(t+"-image/href",e),a},_updateMyModel:function(){var t=0,e={width:this.get("size").width,height:this.get("size").height,icon:this.get("icon"),name:this.get("name"),statusMessage:this.get("statusMsg"),status:this.get("status")};t+=this._recalculateRectWithLabel(".fb-label","Block",.2,.6,e,t),t+=this._recalculateRectWithIcon(".fb-icon",e.icon,.6,.8,e,t),t+=this._recalculateRectWithLabel(".fb-status",e.statusMessage,.2,.3,e,t),this._recalculateToolLabel(".fb-tool-label",e.name,e,t)}},{}),o.shapes.flowblocks.toolbar.BlockToolbarItemView=o.dia.ElementView.extend({initialize:function(){o.dia.ElementView.prototype.initialize.apply(this,arguments),this.listenTo(this.model,"flowblocks-block-toolbar-item-update",(function(){this.update(),this.resize()}))}}),this.View=o.shapes.flowblocks.toolbar.BlockToolbarItemView}createBlank(t,e,i){var o={PassThrough:this.createPassThroughElement,Start:this.createStartElement,Split:this.createSplitElement,Join:this.createJoinElement,End:this.createSinkElement,Mixer:this.createMixerElement};if(o[t]){var r=o[t].call(this,"",e,i);return r.style(i),r}throw new Error("Unsuported template: "+t)}_createBaseOptions(){return{position:this.options.defaultPosition,size:this.options.defaultSize,ports:{groups:{in:{attrs:{".port-body":{fill:"#16A085",magnet:"passive"},".port-label":{display:"none"}}},out:{attrs:{".port-body":{fill:"#E74C3C",magnet:"passive"},".port-label":{display:"none"}}}}},attrs:{".label":{text:"Model","ref-x":.5,"ref-y":.2},rect:{fill:"#2ECC71"}}}}createSplitElement(t,e,i){var o=this._createBaseOptions();return o.inPorts=["i1"],o.outPorts=["o1","o2"],new this.Model(o)}createJoinElement(t,e,i){var o=this._createBaseOptions();return o.inPorts=["i1","i2"],o.outPorts=["o1"],new this.Model(o)}createMixerElement(t,e,i){var o=this._createBaseOptions();return o.inPorts=["in1","in2"],o.outPorts=["out1","out2"],new this.Model(o)}createPassThroughElement(t,e,i){var o=this._createBaseOptions();return o.inPorts=["i1"],o.outPorts=["o1"],new this.Model(o)}createStartElement(t,e,i){var o=this._createBaseOptions();return o.outPorts=["o1"],new this.Model(o)}createSinkElement(t,e,i){var o=this._createBaseOptions();return o.inPorts=["i1"],new this.Model(o)}}({})}])}));