"use strict";

function Renderer(canvas) {
    this.canvas = canvas;
    this.gl = WebGLUtils.setupWebGL( canvas );
    if ( !this.gl ) {
        alert( "WebGL isn't available" );
    }

    this.gl.getExtension('OES_standard_derivatives');

    this.programMeshes = initShaders( this.gl, $("#vertex-shader-meshes").text(), $("#fragment-shader-meshes").text() );
    this.bufferIdMeshesVertices = this.gl.createBuffer();
    
    this.onresize(canvas);
}

Renderer.prototype.onresize = function(canvas) {
	this.canvas.width = this.canvas.clientWidth;
	this.canvas.height = this.canvas.clientHeight;
	var fov = 67.0; // 67 degrees is approximately human eye's field of view
    this.projection = Transformation.newPerspective(Math.PI * fov / 180.0, this.canvas.width / this.canvas.height, 0.01, 100.0);
}

Renderer.prototype._renderMeshes = function(dataModel, dataStatistics) {
    var FLOAT32_SIZE = 4;
    var FLOATS_PER_VERTEX = 6;
    var INDICES_PER_FACET = 3;

    function flattenAll( m ) {
        var floatArray = new Float32Array( m.facets.length * INDICES_PER_FACET * FLOATS_PER_VERTEX );
        for(var i = 0; i < m.facets.length; ++i) {
			floatArray[i * INDICES_PER_FACET * FLOATS_PER_VERTEX + 0 ] = m.vertices[m.facets[i].vi1].position.radiusVector.x;
			floatArray[i * INDICES_PER_FACET * FLOATS_PER_VERTEX + 1 ] = m.vertices[m.facets[i].vi1].position.radiusVector.y;
			floatArray[i * INDICES_PER_FACET * FLOATS_PER_VERTEX + 2 ] = m.vertices[m.facets[i].vi1].position.radiusVector.z;
			floatArray[i * INDICES_PER_FACET * FLOATS_PER_VERTEX + 3 ] = 1;
			floatArray[i * INDICES_PER_FACET * FLOATS_PER_VERTEX + 4 ] = 0;
			floatArray[i * INDICES_PER_FACET * FLOATS_PER_VERTEX + 5 ] = 0;
			floatArray[i * INDICES_PER_FACET * FLOATS_PER_VERTEX + 6 ] = m.vertices[m.facets[i].vi2].position.radiusVector.x;
			floatArray[i * INDICES_PER_FACET * FLOATS_PER_VERTEX + 7 ] = m.vertices[m.facets[i].vi2].position.radiusVector.y;
			floatArray[i * INDICES_PER_FACET * FLOATS_PER_VERTEX + 8 ] = m.vertices[m.facets[i].vi2].position.radiusVector.z;
			floatArray[i * INDICES_PER_FACET * FLOATS_PER_VERTEX + 9 ] = 0;
			floatArray[i * INDICES_PER_FACET * FLOATS_PER_VERTEX + 10] = 1;
			floatArray[i * INDICES_PER_FACET * FLOATS_PER_VERTEX + 11] = 0;
			floatArray[i * INDICES_PER_FACET * FLOATS_PER_VERTEX + 12] = m.vertices[m.facets[i].vi3].position.radiusVector.x;
			floatArray[i * INDICES_PER_FACET * FLOATS_PER_VERTEX + 13] = m.vertices[m.facets[i].vi3].position.radiusVector.y;
			floatArray[i * INDICES_PER_FACET * FLOATS_PER_VERTEX + 14] = m.vertices[m.facets[i].vi3].position.radiusVector.z;
			floatArray[i * INDICES_PER_FACET * FLOATS_PER_VERTEX + 15] = 0;
			floatArray[i * INDICES_PER_FACET * FLOATS_PER_VERTEX + 16] = 0;
			floatArray[i * INDICES_PER_FACET * FLOATS_PER_VERTEX + 17] = 1;
        }

        return floatArray;
    }

    function flattenTransformation( t ) {
        var floatArray = new Float32Array( 16 );
		floatArray[0 ] = t.matrix[0][0];
		floatArray[1 ] = t.matrix[0][1];
		floatArray[2 ] = t.matrix[0][2];
		floatArray[3 ] = t.matrix[0][3];
		floatArray[4 ] = t.matrix[1][0];
		floatArray[5 ] = t.matrix[1][1];
		floatArray[6 ] = t.matrix[1][2];
		floatArray[7 ] = t.matrix[1][3];
		floatArray[8 ] = t.matrix[2][0];
		floatArray[9 ] = t.matrix[2][1];
		floatArray[10] = t.matrix[2][2];
		floatArray[11] = t.matrix[2][3];
		floatArray[12] = t.matrix[3][0];
		floatArray[13] = t.matrix[3][1];
		floatArray[14] = t.matrix[3][2];
		floatArray[15] = t.matrix[3][3];

        return floatArray;
    }
    
    var sceneMeshes = dataModel.scene.decorations.inScene.concat(dataModel.scene.model.meshes);
	for(var i = 0; i < sceneMeshes.length; ++i) {
		var mesh = sceneMeshes[i];
		var vertices = flattenAll(mesh);
		if(vertices.length) {
			this.gl.useProgram( this.programMeshes );
			this.gl.bindBuffer( this.gl.ARRAY_BUFFER, this.bufferIdMeshesVertices );
			this.gl.bufferData( this.gl.ARRAY_BUFFER, vertices.length * FLOAT32_SIZE, this.gl.STATIC_DRAW );
			this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, vertices);
			this.gl.vertexAttribPointer( this.gl.getAttribLocation( this.programMeshes, "vPosition" ), 3, this.gl.FLOAT, false, FLOAT32_SIZE * FLOATS_PER_VERTEX, FLOAT32_SIZE * 0 );
			this.gl.enableVertexAttribArray( this.gl.getAttribLocation( this.programMeshes, "vPosition" ) );
			this.gl.vertexAttribPointer( this.gl.getAttribLocation( this.programMeshes, "vBarycentric" ), 3, this.gl.FLOAT, false, FLOAT32_SIZE * FLOATS_PER_VERTEX, FLOAT32_SIZE * 3 );
			this.gl.enableVertexAttribArray( this.gl.getAttribLocation( this.programMeshes, "vBarycentric" ) );
            this.gl.uniformMatrix4fv(this.gl.getUniformLocation(this.programMeshes, "modelMatrix"), false, flattenTransformation(mesh.transformation));
            this.gl.uniformMatrix4fv(this.gl.getUniformLocation(this.programMeshes, "viewMatrix"), false, flattenTransformation(dataModel.scene.camera.transformation.getInvertionForRigid()));
            this.gl.uniformMatrix4fv(this.gl.getUniformLocation(this.programMeshes, "projectionMatrix"), false, flattenTransformation(this.projection));
            var fc = mesh.material.faceColor, wc = mesh.material.edgeColor;
            this.gl.uniform4f(this.gl.getUniformLocation(this.programMeshes, "faceColor"), fc.r, fc.g, fc.b, fc.a);
            this.gl.uniform4f(this.gl.getUniformLocation(this.programMeshes, "edgeColor"), wc.r, wc.g, wc.b, wc.a);
			
			this.gl.drawArrays( this.gl.TRIANGLES, 0, vertices.length / FLOATS_PER_VERTEX );
			
			dataStatistics.triangleCount += vertices.length / (INDICES_PER_FACET * FLOATS_PER_VERTEX);
		}
	}
}

Renderer.prototype.render = function(dataModel, dataStatistics) {
    var startDime = new Date();
    dataStatistics.triangleCount = 0;

    this.gl.viewport( 0, 0, this.canvas.width, this.canvas.height );
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    this.gl.enable(this.gl.CULL_FACE);
    this.gl.cullFace(this.gl.BACK);
    this.gl.frontFace(this.gl.CCW);
    this.gl.clearColor( 0.9, 0.9, 0.9, 1.0 );
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.clear( this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT );
    this.gl.depthFunc(this.gl.LESS);

	this._renderMeshes(dataModel, dataStatistics);

    var endDime = new Date();
    dataStatistics.renderTime = endDime - startDime;
    dataStatistics.applyToGui();
};

function initShaders( gl, vertexShaderText, fragmentShaderText )
{
    var vertShdr = gl.createShader( gl.VERTEX_SHADER );
    gl.shaderSource( vertShdr, vertexShaderText );
    gl.compileShader( vertShdr );
    if ( !gl.getShaderParameter(vertShdr, gl.COMPILE_STATUS) ) {
        var msg = "Vertex shader failed to compile.  The error log is:"
            + "<pre>" + gl.getShaderInfoLog( vertShdr ) + "</pre>";
        alert( msg );
        return -1;
    }

    var fragShdr = gl.createShader( gl.FRAGMENT_SHADER );
    gl.shaderSource( fragShdr, fragmentShaderText );
    gl.compileShader( fragShdr );
    if ( !gl.getShaderParameter(fragShdr, gl.COMPILE_STATUS) ) {
        var msg = "Fragment shader failed to compile.  The error log is:"
            + "<pre>" + gl.getShaderInfoLog( fragShdr ) + "</pre>";
        alert( msg );
        return -1;
    }

    var program = gl.createProgram();
    gl.attachShader( program, vertShdr );
    gl.attachShader( program, fragShdr );
    gl.linkProgram( program );

    if ( !gl.getProgramParameter(program, gl.LINK_STATUS) ) {
        var msg = "Shader program failed to link.  The error log is:"
            + "<pre>" + gl.getProgramInfoLog( program ) + "</pre>";
        alert( msg );
        return -1;
    }

    return program;
}
