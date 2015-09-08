"use strict";

function Vector2D(x, y)
{
  this.x = x || 0;
  this.y = y || 0;
}

Vector2D.attach = function(data) {
  data.__proto__ = Vector2D.prototype;
}

function Point2D(radiusVector) {
  this.radiusVector = radiusVector || new Vector2D();
}

Point2D.attach = function(data) {
  data.__proto__ = Point2D.prototype;
  Vector2D.attach(data.radiusVector);
}

function Vector(x, y, z)
{
  this.x = x || 0;
  this.y = y || 0;
  this.z = z || 0;
}

Vector.attach = function(data) {
	data.__proto__ = Vector.prototype;
}

Vector.prototype.subtract = function (otherVector) {
    return new Vector(this.x - otherVector.x, this.y - otherVector.y, this.z - otherVector.z);
};

Vector.prototype.add = function (otherVector) {
    return new Vector(this.x + otherVector.x, this.y + otherVector.y, this.z + otherVector.z);
};

Vector.prototype.divide = function (scalar) {
    return new Vector(this.x / scalar, this.y / scalar, this.z / scalar);
};

Vector.prototype.multiply = function (scalar) {
    return new Vector(this.x * scalar, this.y * scalar, this.z * scalar);
};

Vector.prototype.getLength = function () {
    return Math.sqrt(this.x * this.x + this.y * this.y + ((this.z * this.z) || 0));
};

Vector.prototype.getNormalized = function () {
    // TODO: what if getLength() < EPS?
    return this.divide(this.getLength());
};

Vector.prototype.cross = function (otherVector) {
    return new Vector(
		this.y * otherVector.z - otherVector.y * this.z,
		this.z * otherVector.x - otherVector.z * this.x,
		this.x * otherVector.y - otherVector.x * this.y
	);
};

function Point(radiusVector) {
    this.radiusVector = radiusVector || new Vector();
}

Point.attach = function(data) {
	data.__proto__ = Point.prototype;
    Vector.attach(data.radiusVector);
}

Point.prototype.subtract = function (otherPointOrVector) {
    if (otherPointOrVector instanceof Point) {
        return this.radiusVector.subtract(otherPointOrVector.radiusVector);
    } else if (otherPointOrVector instanceof Vector) {
        return new Point(this.radiusVector.subtract(otherPointOrVector));
    }
};

Point.prototype.add = function (otherVector) {
    return new Point(this.radiusVector.add(otherVector));
};

// Note: matrix is stored in column order. Data below is transposed.

function Transformation(matrix) {
	this.matrix = matrix || [
		[1, 0, 0, 0],
		[0, 1, 0, 0],
		[0, 0, 1, 0],
		[0, 0, 0, 1]
	];
};

Transformation.attach = function(data) {
	data.__proto__ = Transformation.prototype;
}

Transformation.newScale = function(sx, sy, sz) {
	return new Transformation([
		[sx, 0 , 0 , 0],
		[0 , sy, 0 , 0],
		[0 , 0 , sz, 0],
		[0 , 0 , 0 , 1]
	]);
};

Transformation.newTranslation = function(tx, ty, tz) {
	return new Transformation([
		[1 , 0 , 0 , 0],
		[0 , 1 , 0 , 0],
		[0 , 0 , 1 , 0],
		[tx, ty, tz, 1]
	]);
};

Transformation.newRotationY = function(angle) {
	var c = Math.cos(angle);
	var s = Math.sin(angle);
	return new Transformation([
		[c , 0 , -s, 0],
		[0 , 1 , 0 , 0],
		[s , 0 , c , 0],
		[0 , 0 , 0 , 1]
	]);
};

Transformation.newRotationX = function(angle) {
	var c = Math.cos(angle);
	var s = Math.sin(angle);
	return new Transformation([
		[1 , 0 , 0 , 0],
		[0 , c , s , 0],
		[0 , -s, c , 0],
		[0 , 0 , 0 , 1]
	]);
};

Transformation.newRotationZ = function(angle) {
	var c = Math.cos(angle);
	var s = Math.sin(angle);
	return new Transformation([
		[c , s , 0 , 0],
		[-s, c , 0 , 0],
		[0 , 0 , 1 , 0],
		[0 , 0 , 0 , 1]
	]);
};

// Some algorithms ported from C++ GLM library (http://glm.g-truc.net)

Transformation.newPerspective = function(fovy, aspect, zNear, zFar) {
	var tanHalfFovy = Math.tan(fovy / 2);
	var Result = new Transformation();
	Result.matrix[0][0] = 1 / (aspect * tanHalfFovy);
	Result.matrix[1][1] = 1 / (tanHalfFovy);
	Result.matrix[2][2] = -(zFar + zNear) / (zFar - zNear);
	Result.matrix[2][3] = -1;
	Result.matrix[3][2] = -(2 * zFar * zNear) / (zFar - zNear);
	Result.matrix[3][3] = 0;
	return Result;
};

// Calculates inversion matrix. Works properly only for rigid-body transformation matrices
// Rigid transformation is rotation + translation
// Rotation is inverted by simple transpose
// Translation is converted to proper space
Transformation.prototype.getInvertionForRigid = function() {
	var result = new Transformation();
	for(var i = 0; i < 3; ++i) {
		for(var j = 0; j < 3; ++j) {
			result.matrix[i][j] = this.matrix[j][i];
		}
	}
	for(var j = 0; j < 3; ++j) {
		result.matrix[3][j] = 0.0;
		for(var k = 0; k < 3; ++k) {
			result.matrix[3][j] -= result.matrix[k][j] * this.matrix[3][k];
		}
	}

	return result;
};

Transformation.prototype._multiplyTransformation = function (otherTransformation) {
	var result = new Transformation();
	for(var i = 0; i < 4; ++i) {
		for(var j = 0; j < 4; ++j) {
			result.matrix[i][j] = 0;
			for(var k = 0; k < 4; ++k) {
				result.matrix[i][j] += this.matrix[k][j] * otherTransformation.matrix[i][k];
			}
		}
	}

	return result;
};

Transformation.prototype._multiplyPointOrVector = function (pv, w) {
	var src = [pv.x, pv.y, pv.z, w];
	var res = [0, 0, 0, 0];
	for(var i = 0; i < 4; ++i) {
		for(var j = 0; j < 4; ++j) {
			res[j] += this.matrix[i][j] * src[i];
		}
	}

	return new Vector(res[0], res[1], res[2]);
};

Transformation.prototype.multiply = function (otherTransformationOrPointOrVector) {
    if (otherTransformationOrPointOrVector instanceof Transformation) {
        return this._multiplyTransformation(otherTransformationOrPointOrVector);
    } else if (otherTransformationOrPointOrVector instanceof Point) {
        return new Point(this._multiplyPointOrVector(otherTransformationOrPointOrVector.radiusVector, 1.0));
    } else if (otherTransformationOrPointOrVector instanceof Vector) {
        return this._multiplyPointOrVector(otherTransformationOrPointOrVector, 0.0);
    }
};

Transformation.prototype.multiplyAssign = function (otherTransformation) {
	this.matrix = this.multiply(otherTransformation).matrix;
	return this;
};
