"use strict";

function DataStatistics() {
    this.triangleCount = 0;
    this.renderTime = 0;
}

DataStatistics.prototype.applyToGui = function() {
    $("#text-statistics-triangle-count").text(this.triangleCount);
    $("#text-statistics-render-time").text(this.renderTime + 'ms');
};

