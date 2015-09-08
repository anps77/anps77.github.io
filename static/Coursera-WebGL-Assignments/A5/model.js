"use strict";

function Color(r, g, b, a) {
	this.r = r || 0.0;
	this.g = g || 0.0;
	this.b = b || 0.0;
	this.a = a || 0.0;
}

Color.newRandom = function() {
	return new Color(Math.random(), Math.random(), Math.random(), Math.random());
}

Color.attach = function(data) {
	data.__proto__ = Color.prototype;
}

function Material() {
	this.ambientColor = new Color();
	this.specularColor = new Color();
	this.diffuseColor = new Color();
	this.edgeDiffuseColor = new Color();
	this.specularExponent = 0.0;
}

Material.attach = function(data) {
	data.__proto__ = Material.prototype;
	Color.attach(data.ambientColor);
	Color.attach(data.specularColor);
	Color.attach(data.diffuseColor);
	Color.attach(data.edgeDiffuseColor);
}

function Mesh() {
	this.vertices = [];
	this.facets = [];
	this.transformation = new Transformation();
	this.material = new Material();
	this.texture = ''; // Move to texture?
	this.textureMultiplier = 1.0;
	this.name = "unnamed";
}

Mesh.attach = function(data) {
	data.__proto__ = Mesh.prototype;
	for(var i = 0; i < data.vertices.length; ++i) {
		Mesh.Vertex.attach(data.vertices[i]);
	}
	for(var i = 0; i < data.facets.length; ++i) {
		Mesh.Facet.attach(data.facets[i]);
	}
	Transformation.attach(data.transformation);
	Material.attach(data.material);
	return data;
}

Mesh.Vertex = function(position, normal, tex) {
	this.position = position;
	this.normal = normal;
	this.tex = tex;
}

Mesh.Vertex.attach = function(data) {
	data.__proto__ = Mesh.Vertex.prototype;
	Point.attach(data.position);
	Vector.attach(data.normal);
	Point2D.attach(data.tex);
}

Mesh.Facet = function(vi1, vi2, vi3) {
	this.vi1 = vi1;
	this.vi2 = vi2;
	this.vi3 = vi3;
}

Mesh.Facet.attach = function(data) {
	data.__proto__ = Mesh.Facet.prototype;
}

Mesh.newSphere = function(origin, radius, stacks, slices, texFun) {
	origin = origin || new Point(new Vector(0.0, 0.0, 0.0));
	radius = radius || 1.0;
	stacks = stacks || 32;
	slices = slices || 32;
	texFun = texFun || function() {
		var s = 1.0, t = 1.0; // TODO: set s twice as t to balance disproportion if neccessary
		var pi = Math.PI;
		var two_pi = 2.0 * pi;
		return new Point2D(new Vector2D(s * phi / two_pi, t * theta / pi));
	};

	function newSphereVertex(x, y, z, nx, ny, nz, phi, theta, tx, ty, tz) {
		//          position           normal              material  tex st                                  tangent
		//return{ { x, y, z, 1.0f }, { nx, ny, nz, 0.0f }, material, { s * phi / two_pi, t * theta / pi }, { tx, ty, tz, 0.0f } };
		return new Mesh.Vertex(origin.add(new Vector(x, y, z)), new Vector(nx, ny, nz), texFun(phi. theta, nx, ny, nz));
	}

	var mesh = new Mesh();
	var slices1 = slices + 1;

	// XXX: top and bottom vertices and faces are duplicated. Probably might be optimized (but careful with texturing)
	for (var i = 0; i <= stacks; i++) {
		var theta = 1.0 * Math.PI * i / stacks;
		for (var j = 0; j <= slices; j++) {
			var phi = 2.0 * Math.PI * j / slices;
			var x = Math.sin(theta) * Math.cos(phi);
			var y = Math.sin(theta) * Math.sin(phi);
			var z = Math.cos(theta);
			////sphere.vertices.push_back(MakeSphereVertex(x * radius, y * radius, z * radius, x, y, z, material, phi, theta, cos(theta), 0.0f, -sin(theta)));
			//sphere.vertices.push_back(MakeSphereVertex(x * radius, y * radius, z * radius, x, y, z, material, phi, theta, -sin(phi), cos(phi), 0.0f));
			mesh.vertices.push(newSphereVertex(x * radius, y * radius, z * radius, x, y, z, phi, theta, -Math.sin(phi), Math.cos(phi), 0.0));
			if (i > 0 && j > 0) {
				var v1 = i * slices1 + j - 1;
				var v2 = (i - 1) * slices1 + j - 1;
				var v3 = i * slices1 + j;
				var v4 = (i - 1) * slices1 + j;
				mesh.facets.push(new Mesh.Facet(v1, v3, v2));
				mesh.facets.push(new Mesh.Facet(v3, v4, v2));
			}
		}
	}

	mesh.name = "Sphere";
	return mesh;
}

Mesh.newCylinder = function(origin, radius, vz, vx, nz, nr) {
	origin = origin || new Point(new Vector(0.0, 0.0, 0.0));
	radius = radius || 1.0;
	vz = vz || new Vector(0.0, 0.0, 1.0);
	vx = vx || new Vector(1.0, 0.0, 0.0);
	nz = nz || 1;
	nr = nr || 32;

	var vy = vz.cross(vx).getNormalized();
	vx = vy.cross(vz).getNormalized();
	var vzn = vz.getNormalized();

	var mesh = new Mesh();

	// XXX: points at 0 and pi*2 are multiplied on intent. It will be
	// required for proper texturing
	for(var z = 0; z <= nz; ++z) {
		for(var r = 0; r <= nr; ++r) {
			var phi = 2.0 * Math.PI * r / nr;
			var rvec = vx.multiply(Math.cos(phi)).add(vy.multiply(Math.sin(phi)));
			mesh.vertices.push(new Mesh.Vertex(origin.add(vz.multiply(z)).add(rvec.multiply(radius)), rvec, new Point2D(new Vector2D(r/nr, z/nz))));
		}
	}

	for(var z = 0; z < nz; ++z) {
		for(var r = 0; r < nr; ++r) {
			var v00 = (z + 0) * (nr + 1) + (r + 0);
			var v01 = (z + 0) * (nr + 1) + (r + 1);
			var v10 = (z + 1) * (nr + 1) + (r + 0);
			var v11 = (z + 1) * (nr + 1) + (r + 1);
			mesh.facets.push(new Mesh.Facet(v00, v01, v11));
			mesh.facets.push(new Mesh.Facet(v00, v11, v10));
		}
	}

  // XXX: proper normals on caps require separate vertex copies for them
	mesh.vertices.push(new Mesh.Vertex(origin, vzn.multiply(-1), new Point2D(new Vector2D(0.5, 0.5))));
	var bottomCenter = mesh.vertices.length - 1;
	for(var r = 0; r <= nr; ++r) {
		var phi = 2.0 * Math.PI * r / nr;
		var rx = Math.cos(phi), ry = Math.sin(phi);
		var rvec = vx.multiply(rx).add(vy.multiply(ry));
		mesh.vertices.push(new Mesh.Vertex(origin.add(rvec.multiply(radius)), vzn.multiply(-1), new Point2D(new Vector2D(0.5 + rx/2, 0.5 + ry/2))));
	}
	for(var r = 0; r < nr; ++r) {
		var v0 = bottomCenter + r + 1;
		var v1 = bottomCenter;
		var v2 = bottomCenter + r + 2;
		mesh.facets.push(new Mesh.Facet(v0, v1, v2));
	}
	mesh.vertices.push(new Mesh.Vertex(origin.add(vz.multiply(nz)), vzn, new Point2D(new Vector2D(0.5, 0.5))));
	var topCenter = mesh.vertices.length - 1;
	for(var r = 0; r <= nr; ++r) {
		var phi = 2.0 * Math.PI * r / nr;
		var rx = Math.cos(phi), ry = Math.sin(phi);
		var rvec = vx.multiply(rx).add(vy.multiply(ry));
		mesh.vertices.push(new Mesh.Vertex(origin.add(vz.multiply(nz)).add(rvec.multiply(radius)), vzn, new Point2D(new Vector2D(0.5 + rx/2, 0.5 + ry/2))));
	}
	for(var r = 0; r < nr; ++r) {
		var v0 = topCenter;
		var v1 = topCenter + r + 1;
		var v2 = topCenter + r + 2;
		mesh.facets.push(new Mesh.Facet(v0, v1, v2));
	}

	mesh.name = "Cylinder";
	return mesh;
}

Mesh.newCone = function(origin, radius, vz, vx, nz, nr) {
	origin = origin || new Point(new Vector(0.0, 0.0, 0.0));
	radius = radius || 1.0;
	vz = vz || new Vector(0.0, 0.0, 1.0);
	vx = vx || new Vector(1.0, 0.0, 0.0);
	nz = nz || 1;
	nr = nr || 32;

  // XXX HACK: cone's head is a singular point of normals.
	// As a result the nearest layer of triangles always looks half-flat-shaded.
	// To minimize visible effect we do not let this layer be the only one.
	// TODO: if somebody knows a proper solution for this issue, please let me know :)
	if(nz == 1) {
		nz = 4;
		vz = vz.multiply(0.25);
	}

	var vy = vz.cross(vx).getNormalized();
	vx = vy.cross(vz).getNormalized();
	var vzn = vz.getNormalized();

	var mesh = new Mesh();

	// XXX: points at 0 and pi*2 are multiplied on intent. It will be
	// required for proper texturing
	// XXX: points and faces at head of cylinder probably might be optimized
	for(var z = 0; z <= nz; ++z) {
		var k = (nz - z) / nz;
		for(var r = 0; r <= nr; ++r) {
			var phi = 2.0 * Math.PI * r / nr;
			var rx = Math.cos(phi), ry = Math.sin(phi);
			var rvec = vx.multiply(rx).add(vy.multiply(ry));
			mesh.vertices.push(new Mesh.Vertex(origin.add(vz.multiply(z)).add(rvec.multiply(k * radius)), rvec, new Point2D(new Vector2D(r/nr, z/nz))));
		}
	}

	for(var z = 0; z < nz; ++z) {
		for(var r = 0; r < nr; ++r) {
			var v00 = (z + 0) * (nr + 1) + (r + 0);
			var v01 = (z + 0) * (nr + 1) + (r + 1);
			var v10 = (z + 1) * (nr + 1) + (r + 0);
			var v11 = (z + 1) * (nr + 1) + (r + 1);
			mesh.facets.push(new Mesh.Facet(v00, v01, v11));
			mesh.facets.push(new Mesh.Facet(v00, v11, v10));
		}
	}

	// XXX: proper normals on cap require separate vertex copies for them
	mesh.vertices.push(new Mesh.Vertex(origin, vzn.multiply(-1), new Point2D(new Vector2D(0.5, 0.5))));
	var bottomCenter = mesh.vertices.length - 1;
	for(var r = 0; r <= nr; ++r) {
		var phi = 2.0 * Math.PI * r / nr;
		var rx = Math.cos(phi), ry = Math.sin(phi);
		var rvec = vx.multiply(rx).add(vy.multiply(ry));
		mesh.vertices.push(new Mesh.Vertex(origin.add(rvec.multiply(radius)), vzn.multiply(-1), new Point2D(new Vector2D(0.5 + rx/2, 0.5 + ry/2))));
	}
	for(var r = 0; r < nr; ++r) {
		var v0 = bottomCenter + r + 1;
		var v1 = bottomCenter;
		var v2 = bottomCenter + r + 2;
		mesh.facets.push(new Mesh.Facet(v0, v1, v2));
	}

	mesh.name = "Cone";
	return mesh;
}

Mesh.newPlane = function(origin, vx, vy, nx, ny) {
	origin = origin || new Point(new Vector(0.0, 0.0, 0.0));
	vx = vx || new Vector(1.0, 0.0, 0.0);
	vy = vy || new Vector(0.0, 1.0, 0.0);
	nx = nx || 1;
	ny = ny || 1;
	var vz = vx.cross(vy).getNormalized();

	var mesh = new Mesh();
	for(var x = 0; x <= nx; ++x) {
		for(var y = 0; y <= ny; ++y) {
			mesh.vertices.push(new Mesh.Vertex(origin.add(vx.multiply(x)).add(vy.multiply(y)), vz, new Point2D(new Vector2D(x/nx, y/ny))));
		}
	}
	for(var x = 0; x < nx; ++x) {
		for(var y = 0; y < ny; ++y) {
			var v00 = (x + 0) * (ny + 1) + (y + 0);
			var v01 = (x + 0) * (ny + 1) + (y + 1);
			var v10 = (x + 1) * (ny + 1) + (y + 0);
			var v11 = (x + 1) * (ny + 1) + (y + 1);
			mesh.facets.push(new Mesh.Facet(v00, v11, v01));
			mesh.facets.push(new Mesh.Facet(v00, v10, v11));
		}
	}

	mesh.name = "Plane";
	return mesh;
}

Mesh.newCube = function(origin, vx, vy, vz) {
	origin = origin || new Point(new Vector(0.0, 0.0, 0.0));
	vx = vx || new Vector(1.0, 0.0, 0.0);
	vy = vy || new Vector(0.0, 1.0, 0.0);
	vz = vz || new Vector(0.0, 0.0, 1.0);

	var mesh = new Mesh();

  function side(o,a,b) {
		var l = mesh.vertices.length;
		var n = b.cross(a).getNormalized();
		mesh.vertices.push(new Mesh.Vertex(o.add(a.multiply(0)).add(b.multiply(0)), n, new Point2D(new Vector2D(0, 0))));
		mesh.vertices.push(new Mesh.Vertex(o.add(a.multiply(0)).add(b.multiply(1)), n, new Point2D(new Vector2D(0, 1))));
		mesh.vertices.push(new Mesh.Vertex(o.add(a.multiply(1)).add(b.multiply(0)), n, new Point2D(new Vector2D(1, 0))));
		mesh.vertices.push(new Mesh.Vertex(o.add(a.multiply(1)).add(b.multiply(1)), n, new Point2D(new Vector2D(1, 1))));
		mesh.facets.push(new Mesh.Facet(l + 0, l + 1, l + 3));
		mesh.facets.push(new Mesh.Facet(l + 0, l + 3, l + 2));
	}
	side(origin, vx, vy);
	side(origin, vy, vz);
	side(origin, vz, vx);
	var origin2 = origin.add(vx).add(vy).add(vz);
	side(origin2, vy.multiply(-1), vx.multiply(-1));
	side(origin2, vz.multiply(-1), vy.multiply(-1));
	side(origin2, vx.multiply(-1), vz.multiply(-1));

	mesh.name = "Cube";
	return mesh;
}

Mesh.newUnion = function(operands) {
	var mesh = new Mesh();
	mesh.name = "Union";
	mesh.material = operands[0].material; // XXX: clone?
	var vertexIndexOffset = 0;
	for(var i = 0; i < operands.length; ++i) {
		var op = operands[i];
		for(var j = 0; j < op.vertices.length; ++j) {
			mesh.vertices.push(new Mesh.Vertex(op.transformation.multiply(op.vertices[j].position), op.transformation.multiply(op.vertices[j].normal), op.vertices[j].tex));
		}
		for(var j = 0; j < op.facets.length; ++j) {
			mesh.facets.push(new Mesh.Facet(op.facets[j].vi1 + vertexIndexOffset, op.facets[j].vi2 + vertexIndexOffset, op.facets[j].vi3 + vertexIndexOffset));
		}
		vertexIndexOffset += op.vertices.length;
	}
	return mesh;
}

function Model() {
    this.meshes = [];
}
