"use strict";

function Texture(gl, string, dirty) {
  this.string = string;
  this.gl = gl;
  this.dirty = dirty;
  this._regenerate();
}

Texture.prototype.update = function(string) {
  if(string != this.string) {
    this.string = string;
    this._flush();
    this._regenerate();
  }
}

Texture.prototype._flush = function() {
  this.image = null;
  this.texture = null;
  // TODO: properly release resources
}

Texture.prototype._regenerate = function() {
  this.enabled = false;
  var gl = this.gl;

  var s = this.string;
  if(s.substring(0,9) == "generate:") {
    var genString = s.substring(9);
    var p = JSON.parse(genString);
    if(p.algorithm == "checkerboard") {
      var numChecks = p.numChecks;
      var texSize = p.texSize;
      var c1 = p.color1, c2 = p.color2;
      var image = new Uint8Array(4 * texSize * texSize);
      for ( var i = 0; i < texSize; i++ ) {
          for ( var j = 0; j <texSize; j++ ) {
              var patchx = Math.floor(i / (texSize / numChecks));
              var patchy = Math.floor(j / (texSize / numChecks));
              var c = ((patchx % 2) ^ (patchy % 2)) ? c1 : c2;
              image[4*i*texSize + 4*j+0] = c.r;
              image[4*i*texSize + 4*j+1] = c.g;
              image[4*i*texSize + 4*j+2] = c.b;
              image[4*i*texSize + 4*j+3] = c.a;
          }
      }

      this.texture = gl.createTexture();
      gl.bindTexture( gl.TEXTURE_2D, this.texture );
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
      gl.generateMipmap(gl.TEXTURE_2D);
      this.enabled = true;
    }
  } else if(s.length > 0) {
    function handleTextureLoaded(self) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, self.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, self.image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
      	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
        gl.generateMipmap(gl.TEXTURE_2D);
        self.enabled = true;
        self.dirty();
    }

    this.texture = gl.createTexture();
    this.image = new Image();
    var self = this;
    this.image.onload = function() { handleTextureLoaded(self); }
    this.image.src = s;
  }
}

Texture.prototype.preRender = function(program) {
  var gl = this.gl;
  if(this.enabled) {
    gl.activeTexture( gl.TEXTURE0 );
    gl.bindTexture( gl.TEXTURE_2D, this.texture );
    gl.uniform1i(gl.getUniformLocation( program, "texture"), 0);
    gl.uniform1i(gl.getUniformLocation( program, "enableTexture"), 1);
  } else {
    gl.uniform1i(gl.getUniformLocation( program, "enableTexture"), 0);
  }
}
