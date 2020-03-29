const jointjs = require("jointjs")
const DEFAULTS = require('./defaults')
const ToolbarItem = require('./toolbar-item')
/**
 * Represents a set of ToolbarItems grouped in a single category.
 * Toolbar may contain multiple drawers each holding multiple items.
 */
class Drawer {
    constructor(){
        this.elementId = undefined;
        this.category = undefined;
        this.graph = undefined;
        this.paper = undefined;
        this.emitter = undefined;
        this.state = undefined;         
        this._items = [];   // stores ToolbarItems that are in this Drawer
        this.options = {
            size: DEFAULTS.TOOLBAR.SIZE,
            padding: DEFAULTS.TOOLBAR.PADDING,
            rowPadding: DEFAULTS.TOOLBAR.ROW_PADDING,
        };
    }

    /**
     * Creates empty and detached Drawer. One can populate Drawer contents but the Drawer must be attached
     * to HTML element in order for elements to be presented.
     * @param {*} category 
     * @param {*} emitter 
     */
    create(category,  emitter){
        this.state = 'UNATTACHED';
        this.category = category;        
        this.emitter = emitter;
    }

    /**
     * Removes all items frow drawer and marks it with UNATTACHED state so it can be again populated.
     */
    removeAllItems(){
        var self = this;  
        this.state = 'UNATTACHED';      
        this.graph.removeCells(this._items);
        this._items = [];
    }
 
    /**
     * Adds item to the Drawer. When the Drawer is attached then item is immediately being displayed, otherwise
     * item is stored and will be presented only when the drawer becomes attached.
     * @param {*} toolbarItem 
     */
    addItem(toolbarItem){
        var self = this;
        this._items.push(toolbarItem);    
        this._add(toolbarItem);
        return toolbarItem;       
    }
    /**
     * When Drawer is attached then item is added to the underlying model and presented in the Drawer.
     * When Drawer is detached then nothing happens.
     * @param {*} toolbarItem To be presented in the Drawer
     */
    _add(toolbarItem){
        if(this.state == 'UNATTACHED'){
            this.state = 'PENDING';
            // for detached toolbar request element to which the toolbar may be attached. And await for a drawer to be attached to HTML element
            this.emitter.emit('toolbar-drawer:requested', this.category);
            return toolbarItem;
        }
        
        // add to graph 
        this.graph.addCell(toolbarItem);    
        // resize
        this._resizeItem(toolbarItem);
        // reposition items on paper
        this._repositionItems();
    }

    /**
     * Attaches Drawer to the HTML element. As a result 
     * drawer contents are drawn and become operational.
     * 
     * @param {*} elementId Element to which drawer will be attached (drawn)
     */
    _attach(elementId){
        var self = this;
        this.elementId = elementId;
        this.graph = new jointjs.dia.Graph;
        // create paper
        this.paper = new jointjs.dia.Paper({
            el: document.getElementById(elementId),
            width: self.options.size.width,
            height: self.options.size.height,
            gridSize: 1,
            model: self.graph,
            background: {
                color: 'transparent'
            },
            interactive: false,
            // interactive: {
            //     addLinkFromMagnet: false,
            //     elementMove: false
            // },
            snapLinks: false,
            linkPinning: false,
            embeddingMode: false,
            clickThreshold: 5,
            defaultConnectionPoint: { name: 'boundary' },

            validateConnection: function (cellViewS, magnetS, cellViewT, magnetT, end, linkView) {
                return false
            }
        });

        // enable toolbar events
        self._bindEvents();

        // add all items to graph and paper (draw the drawer)
        this._items.forEach(item=>{
            this._add(item);
        })
        // mark drawer as attached
        this.state = 'ATTACHED';
        // console.log('Drawer attached ', this.category, this.elementId);
        // notify that drawer is attached
        this.emitter.emit('toolbar-drawer:attached', this.category, this.elementId);

        
    }

    /**
     * Binds interaction events that allow to drag flowblocks elements from toolbar to the 
     * main flowblocks diagram.
     */
    _bindEvents() {
        var self = this;
        // adding by doubleclick
        // this.paper.on('element:pointerdblclick', function (toolView, evt) {            
        //     var typeClicked = toolView.model.get('_type');                        
        //     self.emitter.emit(EVENTS_DICT.EVENTS.TOOLBAR_ITEM_DBLCLICK, typeClicked, evt)                        
        //     evt.preventDefault();
        // });

        // adding by dragging
        this.paper.on('cell:pointerdown', function(cellView, e, x, y){
        // this.paper.on('cell:pointerclick', function(cellView, e, x, y){            
            var block = cellView.model;            
            var typeClicked = block.get('_type');    
            self.emitter.emit('toolbar-item:drag', typeClicked, block, x, y, e);
        })
    }
    /**
     * Resizes ToolbarItem
     * @param {*} toolbarItem 
     */
    _resizeItem(toolbarItem) {
        var toolbarWidth = this.options.size.width;
        var padding = 2 * this.options.padding.x;
        var percentage = 0.2
        padding *= (1 + percentage);
        var calculatedWidth = toolbarWidth - padding;

        toolbarItem.set('size', {
            width: calculatedWidth,
            height: calculatedWidth
        })

    }

    _repositionItems() {
        var self = this;
        var previousPosition = {
            x: 15,
            y: 5
        }

        var paperHeight = 0;
        

        this._items.forEach(item => {

            var view = item.findView(this.paper);
            // var itemSize = item.get('size');
            // var itemPosition = item.get('position');



            var newPosition = {

                x: previousPosition.x,
                y: previousPosition.y + view.getBBox().height / 6
            }
            // console.log('BEFORE: ', item.get('_type'),item.get('position'), previousPosition, newPosition, item.getBBox().height, view.getBBox().height);
            // update paper size
            paperHeight = newPosition.y + view.getBBox().height;
            self.paper.setDimensions(self.paper.width, paperHeight);
            
            item.set('position', newPosition);

            

            previousPosition = {
                x: newPosition.x,
                y: newPosition.y + view.getBBox().height
            }
            // console.log('AFTER: ', item.get('_type'),item.get('position'));
        })
    }
}
/**
 * Represents a Flowblocks toolbar .i.e. element that is used to present
 * to the user available Flowblocks block types and allow user to add Blocks 
 * from Toolbar to the Flowblock's diagram.
 */
class Toolbar {
    constructor(options) {        
        this.emitter = undefined;
        this.drawers = [];
        this.options = {};
        Object.assign(this.options, options);
        this._initialize();
    }
    _initialize() {
    }

    create(emitter) {
        var self = this;
        this.emitter = emitter;
        this._bindAppEvents();
        return this;
    }   

    _bindAppEvents() {        
        var self = this;

        // binds paper for the given drawer when html presentation element is ready - we try to 
        // attached proper Drawer to the HTML element
        this.emitter.on('toolbar-drawer:ready',function(category, elementId){
            // console.log('Drawer is ready', category, elementId);
            // find drawer
            var matchingDrawer = self.drawers.find(drawer=>{
                return drawer.category == category;
            })
            // console.log('Matching drawer ', matchingDrawer);
            if(matchingDrawer){
                matchingDrawer._attach(elementId);                
            }
        })

        // resets toolbar
        this.emitter.on('toolbar:reset', function(typeDefinitionsArray){
            // first removes previous toolbar contents
            self.removeAllItems();
            // now populate with new types
            typeDefinitionsArray.forEach(element => {
                self.createToolbarItem(element);
            });
        })
    }

    /**
     * Cleans toolbar
     */
    removeAllItems(){
        this.drawers.forEach(drawer=>{
            drawer.removeAllItems();
            
        })
        this.emitter.emit('toolbar-drawer:removedall');        
        // w efekcie ktos powinien wywolac bulmaExtensions.bulmaAccordion.attach(); zeby przywrocic dzialanie toolbara
    }
    /**
     * Adds toolbar item to given category in toolbar.
     * @param {*} toolbarItem 
     * @param {*} category 
     */
    addItem(toolbarItem, category) {
        // znajdz drawer. dodaj item
        var drawer = this.drawers.find(drawer=>{
            return drawer.category == category;
        })
        
        if(!drawer){
            // when there is no drawer for a category create a new Drawer
            drawer = new Drawer();
            
            // initialize Drawer (in a detached state)
            drawer.create(category, this.emitter);
            this.drawers.push(drawer);
        }

        drawer.addItem(toolbarItem);
    }

    /**
     * Adds new type of given definition to the toolbar so one can create flowblock elements from toolbar using this type.
     * @param {*} typeDefinition Type definition object     
     * @param {*} size (Optional) Dimensions of the item in toolbar
     */
    createToolbarItem(typeDefinition, size){                
        var toolbarItem = ToolbarItem.createBlank(typeDefinition.template, typeDefinition.statusDefinition, typeDefinition.style);
        toolbarItem.set('name', typeDefinition.name);
        toolbarItem.set('_type', typeDefinition.name);
        if(size){
            toolbarItem.set('size', size);
        }             
        if(typeDefinition.icon){
            if(typeDefinition.icon.lastIndexOf('/')==-1){                    
                toolbarItem.set('icon', 'https://unpkg.com/flowblocks/dist/resources/img/svg/'+typeDefinition.icon+'.svg');
            }else{
                toolbarItem.set('icon', typeDefinition.icon);
            }                
        }   
        this.addItem(toolbarItem, typeDefinition.category);
        return toolbarItem;        
    }
}
module.exports = new Toolbar({});