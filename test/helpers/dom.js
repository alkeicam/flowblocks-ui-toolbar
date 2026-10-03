/**
 * jsdom environment for tests (required by mocha via test/mocha.opts before any test file).
 * JointJS requires browser globals and a few SVG geometry methods that jsdom does not implement -
 * they are stubbed with constant values (layout is not verified by tests).
 */
const { JSDOM } = require('jsdom');

const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', { pretendToBeVisual: true });
const W = dom.window;
global.window = W;
global.document = W.document;
['navigator', 'Node', 'Element', 'HTMLElement', 'SVGElement', 'getComputedStyle', 'MutationObserver', 'DOMParser',
    'XMLSerializer', 'SVGAngle', 'SVGPathElement', 'Text', 'Event', 'MouseEvent', 'HTMLTemplateElement', 'CustomEvent', 'HTMLImageElement', 'HTMLCanvasElement', 'Image', 'KeyboardEvent'].forEach(key => {
    if (W[key] !== undefined) global[key] = W[key];
});

function matrix() {
    var m = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
    ['multiply', 'inverse', 'translate', 'scale', 'scaleNonUniform', 'rotate', 'skewX', 'skewY', 'flipX', 'flipY'].forEach(fn => {
        m[fn] = function () { return matrix(); };
    });
    return m;
}
W.SVGElement.prototype.getBBox = function () { return { x: 0, y: 0, width: 10, height: 10 }; };
W.SVGElement.prototype.getComputedTextLength = function () { return 10; };
W.SVGElement.prototype.getScreenCTM = function () { return matrix(); };
W.SVGElement.prototype.getCTM = function () { return matrix(); };
W.SVGElement.prototype.createSVGMatrix = function () { return matrix(); };
W.SVGElement.prototype.createSVGPoint = function () { return { x: 0, y: 0, matrixTransform: function () { return { x: 0, y: 0 }; } }; };
W.SVGElement.prototype.createSVGTransform = function () {
    return { matrix: matrix(), setMatrix: function () { }, setTranslate: function () { }, setScale: function () { }, setRotate: function () { } };
};

// toolbar expects JointJS as a global in browser
global.joint = require('jointjs');

module.exports = dom;
