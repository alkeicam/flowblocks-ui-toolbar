const joint = require("jointjs")
const DEFAULTS = require('./defaults')
const ToolbarItem = require('./toolbar-item')
/**
 * @returns data-testid prefix used by flowblocks (default 'flowblocks')
 */
function testIdPrefix(flowblocks){
    return flowblocks && typeof flowblocks.getTestIdPrefix === 'function' && flowblocks.getTestIdPrefix() ? flowblocks.getTestIdPrefix() : 'flowblocks';
}

/**
 * @returns true when flowblocks is in read only mode
 */
function isReadOnly(flowblocks){
    return flowblocks && typeof flowblocks.isReadOnly === 'function' ? flowblocks.isReadOnly() : false;
}

/**
 * Represents a set of ToolbarItems grouped in a single category.
 * Toolbar may contain multiple drawers each holding multiple items.
 */
class Drawer {
    constructor(){
        this.elementId = undefined;
        this.category = undefined;
        this.section = undefined;   // section definition {id, label, order, icon, collapsed} (optional)
        this.graph = undefined;
        this.paper = undefined;
        this.flowblocks = undefined;
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
     * @param {*} flowblocks 
     * @param {*} section (Optional) section definition {id, label, order, icon, collapsed}
     */
    create(category,  flowblocks, section){
        this.state = 'UNATTACHED';
        this.category = category;        
        this.section = section;
        this.flowblocks = flowblocks;
    }

    /**
     * Removes all items frow drawer and marks it with UNATTACHED state so it can be again populated.
     */
    removeAllItems(){
        var self = this;  
        this.state = 'UNATTACHED';      
        if(this.graph)
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
            // section definition (when available) is passed so the drawer can be labelled and ordered
            if(this.section)
                this.flowblocks.notify('toolbar-drawer:requested', this.category, this.section);
            else
                this.flowblocks.notify('toolbar-drawer:requested', this.category);
            return toolbarItem;
        }
        
        // add to graph 
        this.graph.addCell(toolbarItem);    
        // test ids (FB-05)
        this._decorateItem(toolbarItem);
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
        this.graph = new joint.dia.Graph;
        // create paper
        this.paper = new joint.dia.Paper({
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
        this.flowblocks.notify('toolbar-drawer:attached', this.category, this.elementId);

        
    }

    /**
     * Adds data-testid and data-block-type attributes to the toolbar item element
     * @param {*} toolbarItem 
     */
    _decorateItem(toolbarItem){
        var view = toolbarItem.findView(this.paper);
        if(!view || !view.el || !view.el.setAttribute) return;
        view.el.setAttribute('data-testid', testIdPrefix(this.flowblocks) + '.toolbar.item');
        view.el.setAttribute('data-block-type', toolbarItem.get('_type') !== undefined ? toolbarItem.get('_type') : '');
        view.el.setAttribute('data-section', this.category !== undefined ? this.category : '');
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
            // no dragging in read only mode (FB-04)
            if(isReadOnly(self.flowblocks)) return;
            var block = cellView.model;            
            var typeClicked = block.get('_type');    
            self.flowblocks.notify('toolbar-item:drag', typeClicked, block, x, y, e);
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
        this.flowblocks = undefined;
        this.drawers = [];
        this.options = {};
        Object.assign(this.options, options);
        this._initialize();
    }
    _initialize() {
    }

    create(flowblocks) {
        var newToolbar = new Toolbar();
        
        newToolbar.flowblocks = flowblocks;
        newToolbar._bindAppEvents();
        return newToolbar;
    }   

    _bindAppEvents() {        
        var self = this;

        // binds paper for the given drawer when html presentation element is ready - we try to 
        // attached proper Drawer to the HTML element
        this.flowblocks.on('toolbar-drawer:view-ready',function(category, elementId){
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
        this.flowblocks.on('toolbar:reset', function(typeDefinitionsArray, sections){
            // first removes previous toolbar contents
            self.removeAllItems();
            // now populate with new types
            self.populateWithItems(typeDefinitionsArray, sections);            
            console.log('Flowblocks UI Toolbar restarted and running')
        })

        // read only mode (FB-04) - toolbar items can not be dragged
        this.flowblocks.on('flowblocks:readonly-changed', function(readOnly){
            self.drawers.forEach(drawer=>{
                if(drawer.paper && drawer.paper.el && drawer.paper.el.classList){
                    if(readOnly) drawer.paper.el.classList.add('fb-readonly');
                    else drawer.paper.el.classList.remove('fb-readonly');
                }
            })
        })
    }

    /**
     * Returns id of the section in which type is presented - type.section or (when not provided) type.category
     * @param {*} typeDefinition 
     */
    sectionIdOf(typeDefinition){
        return typeDefinition.section !== undefined && typeDefinition.section !== null ? typeDefinition.section : typeDefinition.category;
    }

    /**
     * Orders types according to sections order. Types of the same section keep their original order,
     * types of unknown sections are presented after known sections (in order of appearance).
     * @param {*} typeDefinitionsArray 
     * @param {*} sections Array of {id, label, order, icon, collapsed}
     * @returns Array of {type, sectionId, section}
     */
    orderBySections(typeDefinitionsArray, sections){
        var self = this;
        var sectionsById = {};
        var sectionsOrder = {};
        (sections || []).forEach((section, idx)=>{
            sectionsById[section.id] = section;
            sectionsOrder[section.id] = section.order !== undefined && section.order !== null ? section.order : idx;
        });
        var unknownOrder = {};
        var entries = typeDefinitionsArray.map((type, idx)=>{
            var sectionId = self.sectionIdOf(type);
            var section = sectionsById[sectionId];
            if(!section && unknownOrder[sectionId] === undefined)
                unknownOrder[sectionId] = Object.keys(unknownOrder).length;
            return {
                type: type,
                sectionId: sectionId,
                section: section,
                idx: idx,
                known: section ? 0 : 1,
                order: section ? sectionsOrder[sectionId] : unknownOrder[sectionId]
            }
        });
        entries.sort((a, b)=>{
            if(a.known != b.known) return a.known - b.known;
            if(a.order != b.order) return a.order - b.order;
            return a.idx - b.idx;
        });
        return entries;
    }

    /**
     * Populates toolbar with new items
     * @param {*} typeDefinitionsArray 
     * @param {*} sections (Optional) Array of section definitions {id, label, order, icon, collapsed}; type is
     * presented in section with id == type.section (or type.category). When omitted items are groupped by type.category
     * in order of appearance (as before).
     */
    populateWithItems(typeDefinitionsArray, sections){
        if(sections && sections.length > 0){
            this.orderBySections(typeDefinitionsArray, sections).forEach(entry=>{
                var section = entry.section ? entry.section : { id: entry.sectionId, label: entry.sectionId };
                this.createToolbarItem(entry.type, undefined, section);
            });
        }else{
            typeDefinitionsArray.forEach(element => {
                this.createToolbarItem(element);
            });
        }
        this.flowblocks.notify('toolbar:populated');
        // w efekcie ktos powinien wywolac bulmaExtensions.bulmaAccordion.attach(); zeby przywrocic dzialanie toolbara
    }

    /**
     * Cleans toolbar
     */
    removeAllItems(){
        this.drawers.forEach(drawer=>{
            drawer.removeAllItems();
            
        })
        this.flowblocks.notify('toolbar:removedall');        
        // w efekcie ktos powinien wywolac bulmaExtensions.bulmaAccordion.attach(); zeby przywrocic dzialanie toolbara
    }
    /**
     * Adds toolbar item to given category in toolbar.
     * @param {*} toolbarItem 
     * @param {*} category 
     * @param {*} section (Optional) section definition of the category
     */
    addItem(toolbarItem, category, section) {
        // znajdz drawer. dodaj item
        var drawer = this.drawers.find(drawer=>{
            return drawer.category == category;
        })
        
        if(!drawer){
            // when there is no drawer for a category create a new Drawer
            drawer = new Drawer();
            
            // initialize Drawer (in a detached state)
            drawer.create(category, this.flowblocks, section);
            this.drawers.push(drawer);
        } else if(section){
            drawer.section = section;
        }

        drawer.addItem(toolbarItem);
    }

    /**
     * Adds new type of given definition to the toolbar so one can create flowblock elements from toolbar using this type.
     * @param {*} typeDefinition Type definition object     
     * @param {*} size (Optional) Dimensions of the item in toolbar
     * @param {*} section (Optional) Section definition in which item is presented (see populateWithItems)
     */
    createToolbarItem(typeDefinition, size, section){                
        var toolbarItem = ToolbarItem.createBlank(typeDefinition.template, typeDefinition.statusDefinition, typeDefinition.style);
        toolbarItem.set('name', typeDefinition.name);
        toolbarItem.set('_type', typeDefinition.name);
        if(size){
            toolbarItem.set('size', size);
        }             
        if(typeDefinition.icon){
            if(typeDefinition.icon.lastIndexOf('/')==-1){                    
                toolbarItem.set('icon', 'https://cdn.jsdelivr.net/npm/flowblocks-icons@1.0.8/i/'+typeDefinition.icon+'.svg');
            }else{
                toolbarItem.set('icon', typeDefinition.icon);
            }                
        }   
        if(section)
            this.addItem(toolbarItem, section.id, section);
        else
            this.addItem(toolbarItem, typeDefinition.category);
        return toolbarItem;        
    }
}
module.exports = new Toolbar({});