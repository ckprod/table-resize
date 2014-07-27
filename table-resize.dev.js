;
if (typeof DEBUG === "undefined") DEBUG = true;

// debugging utils
function log() {
    var a = arguments[0],
        s = arguments.length > 1 ? Array.prototype.slice.call(arguments) : a;

    if (typeof console !== "undefined" && typeof console.log !== "undefined") {
        console[/error/i.test(a) ? 'error' : /warn/i.test(a) ? 'warn' : 'log'](s);
    } else {
        alert(s);
    }
}

function benchmark(text, time) {
    log(text + " (" + (new Date().getTime() - time.getTime()) + "ms)");
}

(function () {
    "use strict";

    // This simple and small javascript solution for resizing html tables
    // is based on
    // http://bz.var.ru/comp/web/resizable.html
    // Browser support: IE9+, current Chrome, Firefox, etc.
    function TableResize(table, options) {
        if (table && table.tagName !== 'TABLE') {
            DEBUG && log('ERROR: DOM element/input is not a table!');
            console.log('ERROR: DOM element/input is not a table!');
            return '';
        }

        var time = new Date();
        this.init(table, options || {});
		DEBUG && benchmark('init finished', time);

        // The overriden placeholder methods
        this.mouseStart = function (event) {
            // initial column
            this.ic = event.target.parentNode.parentNode.cellIndex;
            var initialColumn = this.ic;

            if (!this.hr || initialColumn < 0 || this.hr.length < initialColumn) return false;

            // set true width
            var cell = this.hr.cells[initialColumn],
                width = window.getComputedStyle(cell, null).getPropertyValue("width");
            for (var i = 0; i < this.nr; i++) {
                cell = table.rows[i].cells[initialColumn];
                cell.style.maxWidth = cell.style.width = width;
            }

            // replace current document cursor
            this.cur = document.body.style.cursor;
            document.body.style.cursor = 'col-resize';

            return true;
        };
        this.mouseDrag = function (event) {
            var dist = event.pageX - this.mouseDownEvent.pageX,
                initialColumn = this.ic,
                cell = this.hr.cells[initialColumn],
                width = parseInt(cell.style.width);

            if (width <= -dist) {
                this.mouseUp(event);
            } else {
                var newWidth = width + dist;
                if (newWidth > this.options.minWidth) {

                    for (var i = 0; i < this.nr; i++) {
                        cell = table.rows[i].cells[initialColumn];
                        cell.style.maxWidth = cell.style.width = newWidth + 'px';
                    }

                    this.mouseDownEvent = event;
                }
            }

        };
        this.mouseStop = function (event) {
            // set width
            var initialColumn = this.ic,
                cell = this.hr.cells[initialColumn],
                width = window.getComputedStyle(cell, null).getPropertyValue("width");

            for (var i = 0; i < this.nr; i++) {
                cell = table.rows[i].cells[initialColumn];
                cell.style.maxWidth = cell.style.width = width;
            }

            // restore mouse cursor
            document.body.style.cursor = this.cur;
        };
    }

    TableResize.prototype = {
        options: {
            distance: 0, // in px
            minWidth: 30 // in px
        },

        init: function (table, options) {
            // check empty table
            if (!(table && table.rows && table.rows.length > 0)) {
                DEBUG && log('WARNING: Empty table.');
                return '';
            }

            // header row
            this.hr = table.rows[0];
            // number of rows
            this.nr = table.rows.length;
            // to keep context
            var that = this;

            DEBUG && log('Number of cells: ' + this.hr.cells.length);
            DEBUG && log('Number of rows: ' + this.nr + ' (including header row)');

            // attach handlers to each cell of the header row.
            for (var i = 0; i < this.hr.cells.length; i++) {
                var cell = this.hr.cells[i];
                cell.innerHTML = '<div class=\"resize-base\"><div class=\"resize-elem\"></div><div class=\"resize-text\">' + cell.innerHTML + '</div></div>';

                addEvent(cell.childNodes[0].childNodes[0], 'mousedown', function (event) {
                    that.mouseDown(event);
                });
            }
        },

        // This simple javascript code is based on 
        // https://github.com/jquery/jquery-ui/blob/master/ui/mouse.js
        mouseDown: function (event) {

            // we may have missed mouseup (out of window) - clean start, reset all
            (this.mouseStarted && this.mouseUp(event));

            // to compute the first (and the following) resize move correctly
            this.mouseDownEvent = event;

            // only left mouse button down is of interest
            if (event.which !== 1) {
                return true;
            }

            // lets start
            if (this.mouseDistanceMet(event)) {
                this.mouseStarted = (this.mouseStart(event) !== false);
                if (!this.mouseStarted) {
                    event.preventDefault();
                    return true;
                }
            }

            // to keep context
            var that = this;
            this.mouseMoveDelegate = function (event) {
                return that.mouseMove(event);
            };
            this.mouseUpDelegate = function (event) {
                return that.mouseUp(event);
            };

            addEvent(document.body, 'mousemove', this.mouseMoveDelegate);
            addEvent(document.body, 'mouseup', this.mouseUpDelegate);

            event.preventDefault();

            return true;
        },

        // This simple javascript code is based on 
        // https://github.com/jquery/jquery-ui/blob/master/ui/mouse.js
        mouseMove: function (event) {
            // Iframe mouseup check - mouseup occurred in another document
            if (!event.which) {
                return this.mouseUp(event);
            }

            // drag functionality
            if (this.mouseStarted) {
                this.mouseDrag(event);
                return event.preventDefault();
            }

            // within no action circle
            if (this.mouseDistanceMet(event)) {
                this.mouseStarted = (this.mouseStart(this.mouseDownEvent, event) !== false);

                (this.mouseStarted ? this.mouseDrag(event) : this.mouseUp(event));
            }

            return !this.mouseStarted;
        },

        // This simple javascript code is based on
        // https://github.com/jquery/jquery-ui/blob/master/ui/mouse.js
        mouseUp: function (event) {
            //DEBUG && log("up " + event.which);
            //DEBUG && log(this);

            removeEvent(document.body, 'mousemove', this.mouseMoveDelegate);
            removeEvent(document.body, 'mouseup', this.mouseUpDelegate);

            if (this.mouseStarted) {
                this.mouseStarted = false;

                this.mouseStop(event);
            }

            return false;
        },

        // This simple javascript code is roughly based on 
        // https://github.com/jquery/jquery-ui/blob/master/ui/mouse.js
        mouseDistanceMet: function (event) {
            var x = Math.abs(this.mouseDownEvent.pageX - event.pageX),
                y = Math.abs(this.mouseDownEvent.pageY - event.pageY);
            return (Math.sqrt(x * x + y * y)) >= this.options.distance;
        },

        // These are placeholder methods, to be overriden by extentions
        mouseStart: function () {},
        mouseDrag: function () {},
        mouseStop: function () {}
    };

    // http://ejohn.org/apps/jselect/event.html
    function addEvent(obj, type, fn) {
        if (obj.attachEvent) {
            obj['e' + type + fn] = fn;
            obj[type + fn] = function () {
                obj['e' + type + fn](window.event);
            };
            obj.attachEvent('on' + type, obj[type + fn]);
        } else obj.addEventListener(type, fn, false);
    }

    function removeEvent(obj, type, fn) {
        if (obj.detachEvent) {
            obj.detachEvent('on' + type, obj[type + fn]);
            obj[type + fn] = null;
        } else obj.removeEventListener(type, fn, false);
    }

    // based on
    // https://github.com/tristen/tablesort/blob/gh-pages/src/tablesort.js
    // line 297 - 301
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = TableResize;
    } else {
        window.TableResize = TableResize;
    }
})();