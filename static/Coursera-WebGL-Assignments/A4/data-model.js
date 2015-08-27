"use strict";

function DataModel() {
    this.scene = new Scene();
    this.events = new EventEmitter("change");
    this.selected = this.scene.camera;
    this.transformation = {
		translateAmount: 0.25,
		rotateAmount: 5,
		scaleAmount: 1.1
	}
}

DataModel.prototype.setModel = function(model) {
    this.scene.model = model;
    this.events.emit("change");
};

DataModel.prototype.newObjectTransformFromCamera = Transformation.newTranslation(0, 0, -4);

DataModel.prototype.setMeshGenerators = function(generators) {
	var dataModel = this;

  var ulAddObject = $("#ul-structure-add-object");
  var addElement = function(title, generator) {
    var a = $("<a href='#'></a>");
    a.text(title);
    a.on("click", function() {
  		var mesh = generator();

  		mesh.transformation = dataModel.scene.camera.transformation.multiply(dataModel.newObjectTransformFromCamera);

  		var c = Color.newRandom();
  		mesh.material.diffuseColor = new Color(c.r, c.g, c.b, 1.0);
      mesh.material.ambientColor = new Color(c.r * 0.1, c.g * 0.1, c.b * 0.1, 1.0);
      mesh.material.specularColor = new Color(1.0, 1.0, 1.0, 1.0);
      mesh.material.specularExponent = 1000.0;
  		mesh.material.edgeDiffuseColor = new Color(c.r, c.g, c.b, 1.0);

  		dataModel.scene.model.meshes.push(mesh);
  		dataModel.selected = mesh;
  		dataModel.events.emit("change");
  		dataModel.applyToGui();
  	});
    var li = $("<li>");
    li.append(a);
    ulAddObject.append(li);
  };

  var prevChildren = ulAddObject.children();
  prevChildren.detach();
	for(var title in generators) {
		addElement(title, generators[title]);
	}
  ulAddObject.append(prevChildren);
}

DataModel.prototype.bindToGui = function() {
	var dataModel = this;

	var reloadData = function(e) { dataModel.loadFromGui(e.target); }
  $(".data-model-container input").on("change", reloadData);
  $(".colorpicker-component").on("changeColor.colorpicker", reloadData);
  $(".data-model-container select").on("change", reloadData);

  $("#button-structure-remove-object").on("click", function() {
    var meshes = dataModel.scene.model.meshes;
		var meshIndex = meshes.indexOf(dataModel.selected);
    if(meshIndex != -1) {
      meshes.splice(meshIndex, 1);
  		if(meshIndex < meshes.length) {
  			dataModel.selected = meshes[meshIndex];
  		} else if(meshes.length > 0) {
  			dataModel.selected = meshes[meshes.length - 1]
  		} else {
  			dataModel.selected = dataModel.scene.camera;
  		}
  		dataModel.applyToGui();
  		dataModel.events.emit("change");
    }
    var lights = dataModel.scene.lights;
    var lightIndex = lights.indexOf(dataModel.selected);
    if(lightIndex != -1) {
      lights.splice(lightIndex, 1);
  		if(lightIndex < lights.length) {
  			dataModel.selected = lights[lightIndex];
  		} else if(lights.length > 0) {
  			dataModel.selected = lights[lights.length - 1]
  		} else {
  			dataModel.selected = dataModel.scene.camera;
  		}
  		dataModel.applyToGui();
  		dataModel.events.emit("change");
    }
	});

  $("#button-structure-remove-all-objects").on("click", function() {
		var meshes = dataModel.scene.model.meshes;
		meshes.length = 0;
		dataModel.selected = dataModel.scene.camera;
		dataModel.applyToGui();
		dataModel.events.emit("change");
	});

	$('#button-structure-boolean-union-all').on("click", function() {
		dataModel.scene.model.meshes = [ Mesh.newUnion(dataModel.scene.model.meshes) ];
		dataModel.selected = dataModel.scene.model.meshes[0];
		dataModel.applyToGui();
		dataModel.events.emit("change");
	});

	var bindTransformationButton = function(suffix, generator) {
		$("#button-transformation-" + suffix).on("click", function() {
      if(dataModel.selected instanceof Mesh) {
			  dataModel.selected.transformation.multiplyAssign(generator());
      } else if(dataModel.selected instanceof Camera) {
  		  dataModel.selected.transformation.multiplyAssign(generator());
      } else if(dataModel.selected instanceof PointLight) {
        dataModel.selected.position = generator().multiply(dataModel.selected.position);
      } else if(dataModel.selected instanceof DirectionLight) {
        dataModel.selected.direction = generator().multiply(dataModel.selected.direction);
      }
			dataModel.events.emit("change");
			return;
		});
	};
	bindTransformationButton("translate-xp", function() { return Transformation.newTranslation(+dataModel.transformation.translateAmount, 0.0, 0.0); });
	bindTransformationButton("translate-xn", function() { return Transformation.newTranslation(-dataModel.transformation.translateAmount, 0.0, 0.0); });
	bindTransformationButton("translate-yp", function() { return Transformation.newTranslation(0.0, +dataModel.transformation.translateAmount, 0.0); });
	bindTransformationButton("translate-yn", function() { return Transformation.newTranslation(0.0, -dataModel.transformation.translateAmount, 0.0); });
	bindTransformationButton("translate-zp", function() { return Transformation.newTranslation(0.0, 0.0, +dataModel.transformation.translateAmount); });
	bindTransformationButton("translate-zn", function() { return Transformation.newTranslation(0.0, 0.0, -dataModel.transformation.translateAmount); });
	bindTransformationButton("rotate-xp", function() { return Transformation.newRotationX(+dataModel.transformation.rotateAmount * Math.PI / 180); });
	bindTransformationButton("rotate-xn", function() { return Transformation.newRotationX(-dataModel.transformation.rotateAmount * Math.PI / 180); });
	bindTransformationButton("rotate-yp", function() { return Transformation.newRotationY(+dataModel.transformation.rotateAmount * Math.PI / 180); });
	bindTransformationButton("rotate-yn", function() { return Transformation.newRotationY(-dataModel.transformation.rotateAmount * Math.PI / 180); });
	bindTransformationButton("rotate-zp", function() { return Transformation.newRotationZ(+dataModel.transformation.rotateAmount * Math.PI / 180); });
	bindTransformationButton("rotate-zn", function() { return Transformation.newRotationZ(-dataModel.transformation.rotateAmount * Math.PI / 180); });
	bindTransformationButton("scale-xp", function() { return Transformation.newScale(1*dataModel.transformation.scaleAmount, 1.0, 1.0); });
	bindTransformationButton("scale-xn", function() { return Transformation.newScale(1/dataModel.transformation.scaleAmount, 1.0, 1.0); });
	bindTransformationButton("scale-yp", function() { return Transformation.newScale(1.0, 1*dataModel.transformation.scaleAmount, 1.0); });
	bindTransformationButton("scale-yn", function() { return Transformation.newScale(1.0, 1/dataModel.transformation.scaleAmount, 1.0); });
	bindTransformationButton("scale-zp", function() { return Transformation.newScale(1.0, 1.0, 1*dataModel.transformation.scaleAmount); });
	bindTransformationButton("scale-zn", function() { return Transformation.newScale(1.0, 1.0, 1/dataModel.transformation.scaleAmount); });

	$('#button-transformation-to-origin').on("click", function() {
    if(dataModel.selected instanceof Mesh) {
      dataModel.selected.transformation = new Transformation();
    }
    if(dataModel.selected instanceof PointLight) {
      dataModel.selected.position = new Point();
    }
		dataModel.events.emit("change");
		return;
	});

	$('#button-transformation-to-camera').on("click", function() {
    if(dataModel.selected instanceof Mesh) {
		  dataModel.selected.transformation = dataModel.scene.camera.transformation.multiply(dataModel.newObjectTransformFromCamera);
    }
    if(dataModel.selected instanceof PointLight) {
      dataModel.selected.position = dataModel.scene.camera.transformation.multiply(dataModel.newObjectTransformFromCamera).multiply(new Point());
    }
		dataModel.events.emit("change");
		return;
	});

  $("#button-structure-add-light").on("click", function() {
    var light = new PointLight();

    light.position = dataModel.scene.camera.transformation.multiply(dataModel.newObjectTransformFromCamera).multiply(new Point());

    var c = Color.newRandom();
    light.diffuseColor = new Color(c.r, c.g, c.b, 1.0);
    light.ambientColor = new Color(c.r * 0.1, c.g * 0.1, c.b * 0.1, 1.0);
    light.specularColor = new Color(1.0, 1.0, 1.0, 1.0);

    dataModel.scene.lights.push(light);
    dataModel.selected = light;
    dataModel.events.emit("change");
    dataModel.applyToGui();
  });

  dataModel.applyToGui();
};

DataModel.prototype.loadFromGui = function(src) {
	// TODO: this looks like a design flaw
  var selectActiveObject = $('#select-structure-active-object');
	if(src == selectActiveObject[0]) {
		if($("#option-structure-active-object-camera").prop('selected')) {
			this.selected = this.scene.camera;
		} else if(selectActiveObject.val().substring(0, 5) == 'light') {
      this.selected = this.scene.lights[+selectActiveObject.val().substring(5)];
    } else {
			this.selected = this.scene.model.meshes[+selectActiveObject.val()];
		}
		this.events.emit("change");
		this.applyToGui();
		return;
	}

  if(this.selected instanceof Camera) {
		// nothing
  } else if(this.selected instanceof Light) {
    this.selected.diffuseColor = this._loadFromGuiColor("input-material-diffuse-color");
    this.selected.ambientColor = this._loadFromGuiColor("input-material-ambient-color");
    this.selected.specularColor = this._loadFromGuiColor("input-material-specular-color");
    if(this.selected instanceof PointLight) {
      this.selected.ac0 = +$("#input-light-attenuation-ac0").val();
      this.selected.ac1 = +$("#input-light-attenuation-ac1").val();
      this.selected.ac2 = +$("#input-light-attenuation-ac2").val();
    }
	} else {
		this.selected.name = $('#input-structure-active-object-name').val();
    this.selected.material.diffuseColor = this._loadFromGuiColor("input-material-diffuse-color");
    this.selected.material.ambientColor = this._loadFromGuiColor("input-material-ambient-color");
    this.selected.material.specularColor = this._loadFromGuiColor("input-material-specular-color");
		this.selected.material.edgeDiffuseColor = this._loadFromGuiColor("input-material-edge-diffuse-color");
    this.selected.material.specularExponent = +$("#input-material-specular-exponent").val();
	}

  this.transformation.translateAmount = +$("#input-transformation-translate-amount").val();
  this.transformation.rotateAmount = +$("#input-transformation-rotate-amount").val();
  this.transformation.scaleAmount = +$("#input-transformation-scale-amount").val();

  this.events.emit("change");
};

DataModel.prototype._applyToGuiModelObjects = function() {
  var ogModelObjects = $("#optgroup-structure-active-object-model-objects")
  ogModelObjects.empty();
  for(var i = 0; i < this.scene.model.meshes.length; ++i) {
		var newOption = $("<option value='" + i + "'></option>");
		newOption.text(this.scene.model.meshes[i].name);
		if(this.selected == this.scene.model.meshes[i]) {
			newOption.prop('selected', true); // prop or attr?
		}
		ogModelObjects.append(newOption);
	}
  var ogLights = $("#optgroup-structure-active-object-lights")
  ogLights.empty();
  for(var i = 0; i < this.scene.lights.length; ++i) {
		var newOption = $("<option value='light" + i + "'></option>");
		newOption.text("#" + i);
		if(this.selected == this.scene.lights[i]) {
			newOption.prop('selected', true); // prop or attr?
		}
		ogLights.append(newOption);
	}
	if(this.selected == this.scene.camera) {
		$("#option-structure-active-object-camera").prop('selected', true);
	}
  $('#select-structure-active-object').selectpicker('refresh');
}

DataModel.prototype._loadFromGuiColor = function(id) {
    var rgba = $("#" + id).data('colorpicker').color.toRGB();
    return new Color(rgba.r / 255, rgba.g / 255, rgba.b / 255, rgba.a);
}

DataModel.prototype._applyToGuiColor = function(id, c) {
    // workaround for erroneous colorpicker component
    var stringColor = "rgba(" + Math.floor(c.r * 255) + "," + Math.floor(c.g * 255) + "," + Math.floor(c.b * 255) + "," + c.a + ")";
    $("#" + id).data('colorpicker').color.setColor(stringColor);
    $("#" + id).data('colorpicker').format = "rgba";
    $("#" + id + " input").val(stringColor);
    $("#" + id).data('colorpicker').update(true);
}

DataModel.prototype.applyToGui = function() {
  this._applyToGuiModelObjects();

  if(this.selected instanceof Camera) {
		$('#input-structure-active-object-name').val("(Camera)");
		$('#input-structure-active-object-name').prop('disabled', true);

		$('#button-structure-remove-object').prop('disabled', true);

		$('#button-structure-save').prop('disabled', true);

		$('#button-transformation-scale-xp').prop('disabled', true);
		$('#button-transformation-scale-xn').prop('disabled', true);
		$('#button-transformation-scale-yp').prop('disabled', true);
		$('#button-transformation-scale-yn').prop('disabled', true);
		$('#button-transformation-scale-zp').prop('disabled', true);
		$('#button-transformation-scale-zn').prop('disabled', true);
    $('#button-transformation-translate-xp').prop('disabled', false);
    $('#button-transformation-translate-xn').prop('disabled', false);
    $('#button-transformation-translate-yp').prop('disabled', false);
    $('#button-transformation-translate-yn').prop('disabled', false);
    $('#button-transformation-translate-zp').prop('disabled', false);
    $('#button-transformation-translate-zn').prop('disabled', false);
    $('#button-transformation-rotate-xp').prop('disabled', false);
    $('#button-transformation-rotate-xn').prop('disabled', false);
    $('#button-transformation-rotate-yp').prop('disabled', false);
    $('#button-transformation-rotate-yn').prop('disabled', false);
    $('#button-transformation-rotate-zp').prop('disabled', false);
    $('#button-transformation-rotate-zn').prop('disabled', false);

    $("#input-light-attenuation-ac0").val(1.0);
    $('#input-light-attenuation-ac0').prop('disabled', true);
    $("#input-light-attenuation-ac1").val(0.0);
    $('#input-light-attenuation-ac1').prop('disabled', true);
    $("#input-light-attenuation-ac2").val(0.0);
    $('#input-light-attenuation-ac2').prop('disabled', true);

		$('#button-transformation-to-origin').prop('disabled', true);
		$('#button-transformation-to-camera').prop('disabled', true);

    this._applyToGuiColor("input-material-diffuse-color", new Color());
		$('#input-material-diffuse-color').colorpicker('disable');
    this._applyToGuiColor("input-material-ambient-color", new Color());
		$('#input-material-ambient-color').colorpicker('disable');
    this._applyToGuiColor("input-material-specular-color", new Color());
		$('#input-material-specular-color').colorpicker('disable');
		this._applyToGuiColor("input-material-edge-diffuse-color", new Color());
		$('#input-material-edge-diffuse-color').colorpicker('disable');

    $("#input-material-specular-exponent").val(0.0);
    $('#input-material-specular-exponent').prop('disabled', true);
  } else if(this.selected instanceof Light) {
    $('#input-structure-active-object-name').val("(Light)");
		$('#input-structure-active-object-name').prop('disabled', true);

		$('#button-structure-remove-object').prop('disabled', false);

		$('#button-structure-save').prop('disabled', true);

		$('#button-transformation-scale-xp').prop('disabled', true);
		$('#button-transformation-scale-xn').prop('disabled', true);
		$('#button-transformation-scale-yp').prop('disabled', true);
		$('#button-transformation-scale-yn').prop('disabled', true);
		$('#button-transformation-scale-zp').prop('disabled', true);
		$('#button-transformation-scale-zn').prop('disabled', true);

    if(this.selected instanceof PointLight) {
      $('#button-transformation-translate-xp').prop('disabled', false);
  		$('#button-transformation-translate-xn').prop('disabled', false);
  		$('#button-transformation-translate-yp').prop('disabled', false);
  		$('#button-transformation-translate-yn').prop('disabled', false);
  		$('#button-transformation-translate-zp').prop('disabled', false);
  		$('#button-transformation-translate-zn').prop('disabled', false);

      $('#button-transformation-rotate-xp').prop('disabled', true);
  		$('#button-transformation-rotate-xn').prop('disabled', true);
  		$('#button-transformation-rotate-yp').prop('disabled', true);
  		$('#button-transformation-rotate-yn').prop('disabled', true);
  		$('#button-transformation-rotate-zp').prop('disabled', true);
  		$('#button-transformation-rotate-zn').prop('disabled', true);

      $("#input-light-attenuation-ac0").val(this.selected.ac0);
      $('#input-light-attenuation-ac0').prop('disabled', false);
      $("#input-light-attenuation-ac1").val(this.selected.ac1);
      $('#input-light-attenuation-ac1').prop('disabled', false);
      $("#input-light-attenuation-ac2").val(this.selected.ac2);
      $('#input-light-attenuation-ac2').prop('disabled', false);
    } else if(this.selected instanceof DirectionLight) {
      $('#button-transformation-translate-xp').prop('disabled', true);
  		$('#button-transformation-translate-xn').prop('disabled', true);
  		$('#button-transformation-translate-yp').prop('disabled', true);
  		$('#button-transformation-translate-yn').prop('disabled', true);
  		$('#button-transformation-translate-zp').prop('disabled', true);
  		$('#button-transformation-translate-zn').prop('disabled', true);

      $('#button-transformation-rotate-xp').prop('disabled', false);
  		$('#button-transformation-rotate-xn').prop('disabled', false);
  		$('#button-transformation-rotate-yp').prop('disabled', false);
  		$('#button-transformation-rotate-yn').prop('disabled', false);
  		$('#button-transformation-rotate-zp').prop('disabled', false);
  		$('#button-transformation-rotate-zn').prop('disabled', false);

      $("#input-light-attenuation-ac0").val(1.0);
      $('#input-light-attenuation-ac0').prop('disabled', true);
      $("#input-light-attenuation-ac1").val(0.0);
      $('#input-light-attenuation-ac1').prop('disabled', true);
      $("#input-light-attenuation-ac2").val(0.0);
      $('#input-light-attenuation-ac2').prop('disabled', true);
    }

		$('#button-transformation-to-origin').prop('disabled', false);
		$('#button-transformation-to-camera').prop('disabled', false);

    this._applyToGuiColor("input-material-diffuse-color", this.selected.diffuseColor);
		$('#input-material-diffuse-color').colorpicker('enable');
    this._applyToGuiColor("input-material-ambient-color", this.selected.ambientColor);
		$('#input-material-ambient-color').colorpicker('enable');
    this._applyToGuiColor("input-material-specular-color", this.selected.specularColor);
		$('#input-material-specular-color').colorpicker('enable');
		this._applyToGuiColor("input-material-edge-diffuse-color", new Color());
		$('#input-material-edge-diffuse-color').colorpicker('disable');

    $("#input-material-specular-exponent").val(0.0);
    $('#input-material-specular-exponent').prop('disabled', true);
  } else {
		$('#input-structure-active-object-name').val(this.selected.name);
		$('#input-structure-active-object-name').prop('disabled', false);

		$('#button-structure-remove-object').prop('disabled', false);

		$('#button-structure-save').prop('disabled', false);

		$('#button-transformation-scale-xp').prop('disabled', false);
		$('#button-transformation-scale-xn').prop('disabled', false);
		$('#button-transformation-scale-yp').prop('disabled', false);
		$('#button-transformation-scale-yn').prop('disabled', false);
		$('#button-transformation-scale-zp').prop('disabled', false);
		$('#button-transformation-scale-zn').prop('disabled', false);
    $('#button-transformation-translate-xp').prop('disabled', false);
    $('#button-transformation-translate-xn').prop('disabled', false);
    $('#button-transformation-translate-yp').prop('disabled', false);
    $('#button-transformation-translate-yn').prop('disabled', false);
    $('#button-transformation-translate-zp').prop('disabled', false);
    $('#button-transformation-translate-zn').prop('disabled', false);
    $('#button-transformation-rotate-xp').prop('disabled', false);
    $('#button-transformation-rotate-xn').prop('disabled', false);
    $('#button-transformation-rotate-yp').prop('disabled', false);
    $('#button-transformation-rotate-yn').prop('disabled', false);
    $('#button-transformation-rotate-zp').prop('disabled', false);
    $('#button-transformation-rotate-zn').prop('disabled', false);

    $("#input-light-attenuation-ac0").val(1.0);
    $('#input-light-attenuation-ac0').prop('disabled', true);
    $("#input-light-attenuation-ac1").val(0.0);
    $('#input-light-attenuation-ac1').prop('disabled', true);
    $("#input-light-attenuation-ac2").val(0.0);
    $('#input-light-attenuation-ac2').prop('disabled', true);

		$('#button-transformation-to-origin').prop('disabled', false);
		$('#button-transformation-to-camera').prop('disabled', false);

    this._applyToGuiColor("input-material-diffuse-color", this.selected.material.diffuseColor);
		$('#input-material-diffuse-color').colorpicker('enable');
    this._applyToGuiColor("input-material-ambient-color", this.selected.material.ambientColor);
		$('#input-material-ambient-color').colorpicker('enable');
    this._applyToGuiColor("input-material-specular-color", this.selected.material.specularColor);
		$('#input-material-specular-color').colorpicker('enable');
		this._applyToGuiColor("input-material-edge-diffuse-color", this.selected.material.edgeDiffuseColor);
		$('#input-material-edge-diffuse-color').colorpicker('enable');

    $("#input-material-specular-exponent").val(this.selected.material.specularExponent);
    $('#input-material-specular-exponent').prop('disabled', false);
	}

	$('#button-structure-remove-all-objects').prop('disabled', this.scene.model.meshes.length > 0 ? false : true);
	$('#button-structure-boolean-union-all').prop('disabled', this.scene.model.meshes.length > 0 ? false : true);

  $("#input-transformation-translate-amount").val(this.transformation.translateAmount);
  $("#input-transformation-rotate-amount").val(this.transformation.rotateAmount);
  $("#input-transformation-scale-amount").val(this.transformation.scaleAmount);
};
