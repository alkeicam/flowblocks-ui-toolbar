const jointjs = require("jointjs")
const DEFAULTS = require('./defaults')

class BlockToolbarItem {
    constructor(options) {
        this.options = {
            defaultSize: DEFAULTS.SIZE,
            defaultPosition: DEFAULTS.POSITION,
            defaultPositionDelta: DEFAULTS.POSITION_DELTA,            
        };
        this.Model = {};
        this.View = {};
        Object.assign(this.options, options);
        this._initialize();
    }

    _initialize() {
        jointjs.shapes.flowblocks.toolbar = {};

        this.Model = jointjs.shapes.devs.Model.define('flowblocks.toolbar.BlockToolbarItem', {
            // now model fields            
            name: '',
            icon: './resources/img/svg/agave.svg',            
            debug: true, // debug mode when blockId is presented
            _style: undefined,
            _defaultStyle: DEFAULTS.STYLE,
            _styles: DEFAULTS.STYLES,
            
            // type of element
            _type: undefined,

            // now presentation fields
            attrs: {
                rect: {                    
                    'fill': 'rgb(211, 55, 255)'
                },
                body: {
                    fill: '#ffffff',
                    stroke: '#000000'
                },
                link: {
                    refWidth: '100%',
                    refHeight: '100%',
                    xlinkShow: 'new',
                    cursor: 'pointer'
                },
                
                '.status-err': {
                    'refHeight': '25%',
                    'fill': 'rgb(204, 41, 0)',
                    'refY': '75%'

                },

                '.fb-icon-rect': {
                    'ref-width': '100%',
                    'fill': '#3DB5FF'

                },
                '.fb-icon-image': {
                    'ref': '.fb-icon-rect'
                },

                '.fb-status-rect': {
                    'ref-width': '100%',
                    'fill': 'rgb(209, 226, 208)'

                },
                '.fb-status-text': {
                    'ref': '.fb-status-rect',

                    'text-anchor': 'start',
                    'fill': 'black',
                    'y-alignment': 'middle'
                },

                '.fb-label-rect': {
                    'ref-width': '100%',
                    'fill': 'rgb(255, 230, 206)'
                },
                '.fb-validation-rect': {
                    'fill': '#d63031'
                },
                '.fb-label-text': {
                    'ref': '.fb-label-rect',

                    'text-anchor': 'start',
                    'fill': 'black',
                    'y-alignment': 'middle'
                },
                '.fb-tool-label-text': {                    
                    'text-anchor': 'start',
                    'fill': 'black',
                    'y-alignment': 'middle'
                }

                // label: {
                //     fill: '#ffa500'
                // }

            }
            // defaults - object that contains properties to be assigned to every constructed instance of the subtype. 
            // Used for specifying default attributes.
        }, {
            // proto props - object that contains properties to be assigned on the subtype prototype. 
            // Intended for properties intrinsic to the subtype, not usually modified. Used for specifying shape markup.
            markup: [
                '<g class="rotatable">',
                '<rect class="body"/>',
                '<rect class="fb-icon-rect"/>',
                '<image class="fb-icon-image" href="//resources/img/svg/agave.svg" />',
                '<rect class="fb-label-rect"/>',
                '<text class="fb-label-text">Label</text>',
                '<rect class="fb-status-rect"/>',
                '<text class="fb-tool-label-text"></text>',
                // '<rect class="fb-validation-rect"/>',
                '</g>'
            ].join(''),

            initialize: function () {
                this.on('change:name change:icon change:status change:statusMsg change:size', function () {
                    this._updateMyModel();
                    this.trigger('flowblocks-block-toolbar-item-update');
                }, this);

                // this.on('all',function(eName, thing){
                //     console.log(eName, thing);
                // })

                //this.updateRectangles();

                this._updateMyModel();                
                jointjs.shapes.devs.Model.prototype.initialize.apply(this, arguments);

                //joint.shapes.basic.Generic.prototype.initialize.apply(this, arguments);
            },

            /**
             * Applies style for the block.
             * @param {*} style Either name of the available preset styles or style specification
             */
            style(style) {                
                if(!style){                    
                    this.style(this.get('_defaultStyle'));                    
                } else if (typeof style === 'string' || style instanceof String) {
                    var presetStyle = this.get('_styles')[style.toLocaleLowerCase()];
                    if (presetStyle)
                        this.style(presetStyle);
                } else {
                    this.set('_style', style);                
                    if (style.icon)
                        this.set('icon', style.icon);
                    if (style.bodyColor)
                        this.attr('.fb-icon-rect/fill', style.bodyColor)
                    if (style.titleBarColor)
                        this.attr('.fb-label-rect/fill', style.titleBarColor)
                    if (style.statusBarColor)
                        this.attr('.fb-status-rect/fill', style.statusBarColor)
                    if (style.portInColor) {
                        this.getPorts().forEach(port => {                            
                            if(port.group == 'in')
                                this.portProp(port.id, 'attrs/circle/fill', style.portInColor);
                        })
                    }

                    if (style.portOutColor){
                        this.getPorts().forEach(port => {
                            if(port.group == 'out')
                                this.portProp(port.id, 'attrs/circle/fill', style.portOutColor);
                        })
                    }                                    
                }
            },

            _recalculateRectWithLabel: function (classSelectorPrefix, label, elementHeight, fontSize, baseSize, positionY) {
                var attrs = this.get('attrs');
                // section height
                var partHeight = elementHeight * baseSize.height;

                var partFontSize = fontSize * partHeight;
                var fontY = positionY + partHeight / 2;
                var fontX = 0.1 * baseSize.width;

                this.attr(classSelectorPrefix + '-rect/height', partHeight);
                // attrs[classSelectorPrefix+'-rect'].height = partHeight;
                this.attr(classSelectorPrefix + '-rect/transform', 'translate(0,' + positionY + ')');
                // attrs[classSelectorPrefix+'-rect'].transform = 'translate(0,' + positionY + ')';

                this.attr(classSelectorPrefix + '-text/font-size', partFontSize);
                // attrs[classSelectorPrefix+'-text']['font-size'] = partFontSize;
                this.attr(classSelectorPrefix + '-text/transform', 'translate(' + fontX + ',' + fontY + ')');
                // attrs[classSelectorPrefix+'-text'].transform = 'translate(' + fontX + ',' + fontY + ')';                
                this.attr(classSelectorPrefix + '-text/text', label);

                return partHeight;
            },

            _recalculateToolLabel: function(classSelectorPrefix, label, baseSize, positionY){
                var fontSize = baseSize.height*DEFAULTS.TOOLBAR.FONT.SIZE;
                var fontX = 0;
                var fontY = positionY+fontSize;
                
                this.attr(classSelectorPrefix + '-text/font-size', fontSize);                
                this.attr(classSelectorPrefix + '-text/transform', 'translate(' + fontX + ',' + fontY + ')');                
                this.attr(classSelectorPrefix + '-text/text', label);
                this.attr(classSelectorPrefix + '-text/font-family', DEFAULTS.TOOLBAR.FONT.FAMILY);    
                this.attr(classSelectorPrefix + '-text/font-weight', DEFAULTS.TOOLBAR.FONT.WEIGHT);                    
            },

            _recalculateValidationRect: function (classSelectorPrefix, elementHeight, elementWidth, baseSize, positionY) {
                var attrs = this.get('attrs');
                // section height
                var partHeight = elementHeight * baseSize.height;                
                
                var positionX = (1.0-elementWidth) * baseSize.width;
                var partWidth = elementWidth * baseSize.width;                                
                this.attr(classSelectorPrefix + '-rect/height', partHeight);
                this.attr(classSelectorPrefix + '-rect/width', partWidth);                
                this.attr(classSelectorPrefix + '-rect/transform', 'translate('+positionX+',' + positionY + ')');
                this.attr(classSelectorPrefix + '-rect/title', 'Block validation state: '+this.get('status'));                
                return partHeight;
            },

            _recalculateRectWithIcon: function (classSelectorPrefix, iconHref, elementHeight, iconSize, baseSize, positionY) {
                var partHeight = elementHeight * baseSize.height;

                this.attr(classSelectorPrefix + '-rect/height', partHeight);
                this.attr(classSelectorPrefix + '-rect/transform', 'translate(0,' + positionY + ')');

                var iconHeight = iconSize * partHeight;
                var iconX = baseSize.width / 2 - iconHeight / 2;
                var iconY = positionY + partHeight / 2 - iconHeight / 2;

                this.attr(classSelectorPrefix + '-image/height', iconHeight);
                this.attr(classSelectorPrefix + '-image/transform', 'translate(' + iconX + ',' + iconY + ')');
                this.attr(classSelectorPrefix + '-image/href', iconHref);

                return partHeight;
            },

            _updateMyModel: function () {
                var self = this;
                var offsetY = 0;
                var field = {
                    width: this.get('size').width,
                    height: this.get('size').height,
                    icon: this.get('icon'),
                    name: this.get('name'),
                    statusMessage: this.get('statusMsg'),
                    status: this.get('status'),
                }
                offsetY += self._recalculateRectWithLabel('.fb-label', 'Block', 0.2, 0.6, field, offsetY);
                offsetY += self._recalculateRectWithIcon('.fb-icon', field.icon, 0.6, 0.8, field, offsetY);                
                offsetY += self._recalculateRectWithLabel('.fb-status', field.statusMessage, 0.2, 0.3, field, offsetY);                                
                self._recalculateToolLabel('.fb-tool-label',field.name, field, offsetY);
            }
        }, {
            // static props - object that contains properties to be assigned on the subtype constructor. 
            // Not very common, used mostly for alternative constructor functions.
        })


        jointjs.shapes.flowblocks.toolbar.BlockToolbarItemView = jointjs.dia.ElementView.extend({

            initialize: function () {

                jointjs.dia.ElementView.prototype.initialize.apply(this, arguments);

                this.listenTo(this.model, 'flowblocks-block-toolbar-item-update', function () {
                    this.update();
                    this.resize();
                });
            }
        });
        this.View = jointjs.shapes.flowblocks.toolbar.BlockToolbarItemView;
    }

    createBlank(template, statusDefinition, style) {
        var factories = {
            PassThrough: this.createPassThroughElement,
            Start: this.createStartElement,
            Split: this.createSplitElement,
            Join: this.createJoinElement,
            End: this.createSinkElement,
            Mixer: this.createMixerElement
        }
        if (factories[template]) {
            var block = factories[template].call(this, '', statusDefinition, style);
            // apply style
            block.style(style);
            return block;
        } else {
            throw new Error('Unsuported template: ' + template);
        }
    }

    _createBaseOptions(){
        var options = {
            position: this.options.defaultPosition,
            size: this.options.defaultSize,
            ports: {
                groups: {
                    'in': {
                        attrs: {
                            '.port-body': {
                                fill: '#16A085',
                                magnet: 'passive'
                            },
                            '.port-label': {
                                display: 'none'                                
                            }
                        }
                    },
                    'out': {
                        attrs: {
                            '.port-body': {
                                fill: '#E74C3C',
                                magnet: 'passive'
                            },
                            '.port-label': {
                                display: 'none'                                
                            }
                        }
                    }
                },
            },
            attrs: {
                '.label': { text: 'Model', 'ref-x': .5, 'ref-y': .2 },
                rect: { fill: '#2ECC71' }
            }
        }
        return options;
    }


    /**
     * Element with a single input and a dual output
     * @param {*} name 
     * @param {*} statusDefinition 
     */
    createSplitElement(name, statusDefinition, style) {
        var options = this._createBaseOptions();
        options.inPorts = ['i1']
        options.outPorts = ['o1', 'o2']
    
        var newBlock = new this.Model(options);                
        return newBlock;
    }

    /**
     * Element with a double input and a single output
     * @param {*} name 
     * @param {*} statusDefinition 
     */
    createJoinElement(name, statusDefinition, style) {
        var options = this._createBaseOptions();
        options.inPorts = ['i1', 'i2'];
        options.outPorts = ['o1'];

        var newBlock = new this.Model(options);        
        return newBlock;
    }
    
    createMixerElement(name, statusDefinition, style) {
        var options = this._createBaseOptions();
        options.inPorts = ['in1', 'in2'];
        options.outPorts = ['out1', 'out2'];

        var newBlock = new this.Model(options);        
        return newBlock;
    }

    /**
     * Element with a single input and a single output
     * @param {*} name 
     * @param {*} statusDefinition 
     */
    createPassThroughElement(name, statusDefinition, style) {
        var options = this._createBaseOptions();
        options.inPorts = ['i1'];
        options.outPorts = ['o1'];

        var newBlock = new this.Model(options);
        return newBlock;
    }


    /**
     * Starting element
     * @param {*} name 
     * @param {*} statusDefinition 
     */
    createStartElement(name, statusDefinition, style) {
        var options = this._createBaseOptions();        
        options.outPorts = ['o1'];

        var newBlock = new this.Model(options);
        return newBlock;
    }

    /**
     * Finish (sink) element
     * @param {*} name 
     * @param {*} statusDefinition 
     */
    createSinkElement(name, statusDefinition, style) {
        var options = this._createBaseOptions();
        options.inPorts = ['i1'];
        
        var newBlock = new this.Model(options);
        return newBlock;
    }

    
}
module.exports = new BlockToolbarItem({});