"use strict";

function Camera() {
	// Note: it is camera transformation. To make it view transformation invert it
	this.transformation = new Transformation();
	this.transformation = Transformation.newTranslation(2, 2, 5);
}

function Light(diffuseColor, ambientColor, specularColor) {
	this.diffuseColor = diffuseColor || new Color();
	this.ambientColor = ambientColor || new Color();
	this.specularColor = specularColor || new Color();
}

function PointLight(diffuseColor, ambientColor, specularColor, position, ac0, ac1, ac2) {
	Light.apply(this, arguments);
	this.position = position || new Point();
	this.ac0 = ac0 || 1.0;
	this.ac1 = ac1 || 0.0;
	this.ac2 = ac2 || 0.0;
}

PointLight.prototype = Object.create(Light.prototype);
PointLight.prototype.constructor = PointLight;

// TODO: support DirectionLight.
function DirectionLight(diffuseColor, ambientColor, specularColor, direction) {
	Light.apply(this, arguments);
	this.direction = direction || new Vector();
}

DirectionLight.prototype = Object.create(Light.prototype);
DirectionLight.prototype.constructor = DirectionLight;

function Decorations() {
	this.inScene = [];
	this._generateXYZPlanes();
}

Decorations.prototype._generateXYZPlanes = function() {
	var sectionCount = 4;
	var faceAlpha = 0.05;
	var edgeAlpha = 0.95

	var pxy = Mesh.newPlane(null, new Vector(1, 0, 0), new Vector(0, 1, 0), sectionCount, sectionCount);
	pxy.material.diffuseColor = new Color(0.0, 0.0, 1.0, faceAlpha);
	pxy.material.ambientColor = new Color(0.0, 0.0, 0.0, 0.0);
	pxy.material.specularColor = new Color(0.0, 0.0, 0.0, 0.0);
	pxy.material.specularExponent = 1.0;
	pxy.material.edgeDiffuseColor = new Color(0.0, 0.0, 1.0, edgeAlpha);
	this.inScene.push(pxy);

	var pyz = Mesh.newPlane(null, new Vector(0, 1, 0), new Vector(0, 0, 1), sectionCount, sectionCount);
	pyz.material.diffuseColor = new Color(1.0, 0.0, 0.0, faceAlpha);
	pyz.material.ambientColor = new Color(0.2, 0.2, 0.2, 0.0);
	pyz.material.specularColor = new Color(0.0, 0.0, 0.0, 0.0);
	pyz.material.specularExponent = 1.0;
	pyz.material.edgeDiffuseColor = new Color(1.0, 0.0, 0.0, edgeAlpha);
	this.inScene.push(pyz);

	var pzx = Mesh.newPlane(null, new Vector(0, 0, 1), new Vector(1, 0, 0), sectionCount, sectionCount);
	pzx.material.diffuseColor = new Color(0.0, 1.0, 0.0, faceAlpha);
	pzx.material.ambientColor = new Color(0.2, 0.2, 0.2, 0.0);
	pzx.material.specularColor = new Color(0.0, 0.0, 0.0, 0.0);
	pzx.material.specularExponent = 1.0;
	pzx.material.edgeDiffuseColor = new Color(0.0, 1.0, 0.0, edgeAlpha);
	this.inScene.push(pzx);
}

function Scene() {
	this.model = new Model();
	this.camera = new Camera();
	this.decorations = new Decorations();
	this.lights = [
		new PointLight(new Color(0.9, 0.9, 0.9, 1.0), new Color(0.1, 0.1, 0.1, 1.0), new Color(1.0, 1.0, 1.0, 1.0), new Point(new Vector(10, 10, 10)), 1, 0, 0),
		new PointLight(new Color(0.9, 0.9, 0.9, 1.0), new Color(0.1, 0.1, 0.1, 1.0), new Color(1.0, 1.0, 1.0, 1.0), new Point(new Vector(-5, 20, 5)), 1, 0, 0)
	];
}
