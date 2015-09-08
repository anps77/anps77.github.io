"use strict";

function EventEmitter() {
    this.events = [];
    this.subscribers = {};
    for(var i = 0; i < arguments.length; ++i) {
        this.events.push(arguments[i]);
        this.subscribers[arguments[i]] = [];
    }
}

EventEmitter.prototype.on = function(event, cb) {
    this.subscribers[event].push(cb);
};

EventEmitter.prototype.emit = function(event) {
    for(var i = 0; i < this.subscribers[event].length; ++i) {
        this.subscribers[event][i]();
    }
};

