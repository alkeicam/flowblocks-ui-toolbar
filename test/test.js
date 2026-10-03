// Chai is a commonly used library for creating unit test suites. It is easily extended with plugins.
const chai = require('chai');
var chaiAsPromised = require("chai-as-promised");
chai.should();
chai.use(chaiAsPromised);

const assert = chai.assert;
const expect = chai.expect;

// Sinon is a library used for mocking or verifying function calls in JavaScript.
const sinon = require('sinon');
const EventEmitter = require('events');

const theModule = require('../');

/**
 * Minimal flowblocks stand-in: event bus with notify/on (as flowblocks core) plus read only and test id prefix.
 * Drawer element requests are answered immediately with a fresh div (as the designer does).
 */
function fakeFlowblocks(options) {
    var opts = options || {};
    var emitter = new EventEmitter();
    var fb = {
        readOnly: false,
        prefix: opts.prefix,
        requests: [],
        notify: function (eventName, ...args) { emitter.emit(eventName, ...args); },
        on: function (eventName, handler) { emitter.on(eventName, handler); },
        isReadOnly: function () { return this.readOnly; },
        getTestIdPrefix: function () { return this.prefix; }
    };
    var counter = 0;
    fb.on('toolbar-drawer:requested', function (category, section) {
        fb.requests.push({ category: category, section: section });
        var div = document.createElement('div');
        div.id = 'tb-drawer-' + (counter++) + '-' + Date.now();
        document.body.appendChild(div);
        fb.notify('toolbar-drawer:view-ready', category, div.id);
    });
    return fb;
}

const TYPES = [
    { name: 'ProfileRead', template: 'PassThrough', icon: 'agave', style: 'cream', category: 'Data', section: 'data' },
    { name: 'KRS', template: 'PassThrough', icon: 'agave', style: 'cream', category: 'Integrations', section: 'registries' },
    { name: 'Start', template: 'Start', icon: 'agave', style: 'cream', category: 'Core', section: 'core' },
    { name: 'Rule', template: 'PassThrough', icon: 'agave', style: 'cream', category: 'Core', section: 'core' },
    { name: 'Custom', template: 'PassThrough', icon: 'agave', style: 'cream', category: 'Other' }
];
const SECTIONS = [
    { id: 'registries', label: 'Public registries', order: 30, icon: 'fas fa-landmark', collapsed: true },
    { id: 'core', label: 'Core', order: 10 },
    { id: 'data', label: 'Data', order: 20 }
];

describe('Flowblocks UI Toolbar', () => {
    afterEach(() => {
        document.body.innerHTML = '';
    });
    describe('FB-T9 FB-09a sections', () => {
        it('FB-T9 drawers are requested in sections order, unknown sections last', () => {
            const fb = fakeFlowblocks();
            const toolbar = theModule.create(fb);
            fb.notify('toolbar:reset', TYPES, SECTIONS);
            return expect(fb.requests.map(r => r.category)).deep.eq(['core', 'data', 'registries', 'Other']);
        })
        it('FB-T9 section definition is passed with drawer request', () => {
            const fb = fakeFlowblocks();
            theModule.create(fb);
            fb.notify('toolbar:reset', TYPES, SECTIONS);
            const registries = fb.requests.find(r => r.category == 'registries');
            expect(registries.section.label).eq('Public registries');
            expect(registries.section.collapsed).true;
            return expect(fb.requests.find(r => r.category == 'Other').section).deep.eq({ id: 'Other', label: 'Other' });
        })
        it('FB-T9 types of the same section keep their order', () => {
            const fb = fakeFlowblocks();
            const toolbar = theModule.create(fb);
            fb.notify('toolbar:reset', TYPES, SECTIONS);
            const core = toolbar.drawers.find(d => d.category == 'core');
            return expect(core._items.map(i => i.get('_type'))).deep.eq(['Start', 'Rule']);
        })
        it('FB-T9 without sections toolbar is groupped by category in order of appearance (legacy)', () => {
            const fb = fakeFlowblocks();
            theModule.create(fb);
            fb.notify('toolbar:reset', TYPES);
            expect(fb.requests.map(r => r.category)).deep.eq(['Data', 'Integrations', 'Core', 'Other']);
            return expect(fb.requests[0].section).undefined;
        })
        it('FB-T9 sections without order use array position', () => {
            const fb = fakeFlowblocks();
            const toolbar = theModule.create(fb);
            const entries = toolbar.orderBySections(TYPES, [{ id: 'data' }, { id: 'core' }, { id: 'registries' }]);
            return expect(entries.map(e => e.type.name)).deep.eq(['ProfileRead', 'Start', 'Rule', 'KRS', 'Custom']);
        })
    })
    describe('FB-T6 FB-05 test ids', () => {
        it('FB-T6 toolbar items have data-testid and data-block-type', () => {
            const fb = fakeFlowblocks();
            theModule.create(fb);
            fb.notify('toolbar:reset', TYPES, SECTIONS);
            const item = document.querySelector('[data-block-type="KRS"]');
            expect(item.getAttribute('data-testid')).eq('flowblocks.toolbar.item');
            return expect(item.getAttribute('data-section')).eq('registries');
        })
        it('FB-T6 test id prefix follows flowblocks', () => {
            const fb = fakeFlowblocks({ prefix: 'rule-editor' });
            theModule.create(fb);
            fb.notify('toolbar:reset', TYPES);
            return expect(document.querySelectorAll('[data-testid="rule-editor.toolbar.item"]').length).eq(5);
        })
    })
    describe('FB-T5 FB-04 read only', () => {
        it('FB-T5 toolbar item drag is disabled in read only mode', () => {
            const fb = fakeFlowblocks();
            const toolbar = theModule.create(fb);
            fb.notify('toolbar:reset', TYPES);
            const drag = sinon.spy();
            fb.on('toolbar-item:drag', drag);
            const drawer = toolbar.drawers[0];
            const view = drawer._items[0].findView(drawer.paper);
            fb.readOnly = true;
            fb.notify('flowblocks:readonly-changed', true);
            drawer.paper.trigger('cell:pointerdown', view, {}, 1, 1);
            expect(drag.callCount).eq(0);
            expect(drawer.paper.el.classList.contains('fb-readonly')).true;
            fb.readOnly = false;
            fb.notify('flowblocks:readonly-changed', false);
            drawer.paper.trigger('cell:pointerdown', view, {}, 1, 1);
            return expect(drag.callCount).eq(1);
        })
    })
    describe('FB-T14 regression', () => {
        it('FB-T14 toolbar reset removes previous items and repopulates', () => {
            const fb = fakeFlowblocks();
            const toolbar = theModule.create(fb);
            fb.notify('toolbar:reset', TYPES);
            fb.notify('toolbar:reset', TYPES.slice(0, 2));
            const items = toolbar.drawers.reduce((acc, d) => acc + d._items.length, 0);
            return expect(items).eq(2);
        })
        it('FB-T14 toolbar:populated is notified after population', () => {
            const fb = fakeFlowblocks();
            theModule.create(fb);
            const spy = sinon.spy();
            fb.on('toolbar:populated', spy);
            fb.notify('toolbar:reset', TYPES);
            return expect(spy.callCount).eq(1);
        })
    })
})
