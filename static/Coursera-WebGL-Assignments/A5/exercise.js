"use strict";

window.onload = function() {
	$('[data-toggle="tooltip"]').tooltip()
	$('.colorpicker-component').colorpicker();
    $('.selectpicker').selectpicker();

    var dataModel = new DataModel();
    var dataStatistics = new DataStatistics();

    var renderer = new Renderer($("#gl-canvas")[0]);
    var render = function() { renderer.render(dataModel, dataStatistics); };

    $(window).on("resize", function() {
		renderer.onresize();
		render();
	});

	var hotkeys = {
		W:      "#button-transformation-translate-zn",
		S:      "#button-transformation-translate-zp",
		A:      "#button-transformation-translate-xn",
		D:      "#button-transformation-translate-xp",
		Z:      "#button-transformation-translate-yn",
		X:      "#button-transformation-translate-yp",
		Q:      "#button-transformation-rotate-zp",
		E:      "#button-transformation-rotate-zn",
		"\x25": "#button-transformation-rotate-yp", /* LEFT */
		"\x27": "#button-transformation-rotate-yn", /* RIGHT */
		"\x26": "#button-transformation-rotate-xp", /* UP */
		"\x28": "#button-transformation-rotate-xn", /* DOWN */
		R:      "#button-transformation-scale-xn",
		T:      "#button-transformation-scale-xp",
		F:      "#button-transformation-scale-yn",
		G:      "#button-transformation-scale-yp",
		V:      "#button-transformation-scale-zn",
		B:      "#button-transformation-scale-zp",
		"\x20": "#button-transformation-to-origin" /* SPACE */
	};
    $("#gl-canvas").on("keydown", function(e) {
		for(var key in hotkeys) {
			if(key.charCodeAt(0) == e.keyCode) {
				var button = $(hotkeys[key]);
				if(button.prop('disabled') == false) {
					button.click();
				}
				break;
			}
		}
	});
	// Digits:
	// (without ALT) select active mesh
	// (with ALT) add mesh from list
    $("#gl-canvas").on("keydown", function(e) {
		if(e.altKey) {
			if("1".charCodeAt(0) <= e.keyCode && e.keyCode <= "9".charCodeAt(0)) {
				var index = e.keyCode - "1".charCodeAt(0);
				$("#ul-structure-add-object").children().eq(index).find("a").click();
				e.preventDefault();
			}
		} else {
			if(192 /* tilde */ == e.keyCode || "0".charCodeAt(0) == e.keyCode) {
				$("#option-structure-active-object-camera").prop('selected', true);
				dataModel.loadFromGui($('#select-structure-active-object')[0]); // hack
			}
			if("1".charCodeAt(0) <= e.keyCode && e.keyCode <= "9".charCodeAt(0)) {
				var index = e.keyCode - "1".charCodeAt(0);
				var option = $('#optgroup-structure-active-object-model-objects option').eq(index);
				if(option) {
					option.prop('selected', true);
					dataModel.loadFromGui($('#select-structure-active-object')[0]); // hack
				}
			}
		}
	});

	dataModel.setMeshGenerators({
		"Sphere" : function() { return Mesh.newSphere(); },
		"Cylinder" : function() { return Mesh.newCylinder(); },
		"Cone" : function() { return Mesh.newCone(); },
		"Cube" : function() { return Mesh.newCube(); },
		"Plane (Surface)" : function() { return Mesh.newPlane(); },
		"Sphere (XY Tex)" : function() { return Mesh.newSphere(null, null, null, null, function(phi,theta,nx,ny,nz){return new Point2D(new Vector2D(nx,ny))}); }
	});

	dataModel.bindToGui();

  dataModel.events.on("change", render);

  render();

	// TODO: it is a monster
	$("#button-structure-load").on("click", function(e) {
		$('#modal-load tbody').children().not('.tr-modal-load-table-first-row').empty();
		$('#modal-load').modal();

		$.get(
			"library/"
		).done(function(data, textStatus, jqXHR) {
			if(jqXHR.status == 200) {
				for(var name in data) {
					var tr = $('<tr></tr>');
					var aName = $('<a href="#"></a>').text(name);
					aName.on("click", function(e) {
						$('#modal-load tbody').children().not('.tr-modal-load-table-first-row').empty();
						$.get(
							"library/" + encodeURIComponent(e.target.textContent)
						).done(function(data, textStatus, jqXHR) {
							var mesh = Mesh.attach(data);
							// TODO: code dup
							dataModel.scene.model.meshes.push(mesh);
							dataModel.selected = mesh;
							dataModel.events.emit("change");
							dataModel.applyToGui();

							$('#modal-load').modal('hide')
						}).fail(function(jqXHR, textStatus, errorThrown) {
							$('#modal-load .alert-danger').text("Error getting library entry: " + textStatus + " (" + errorThrown + ")");
							$('#modal-load .alert-danger').collapse('show');
						});
					});
					var tdName = $('<td></td>').append(aName);
					var tdDate = $('<td></td>').text(data[name].date.toString());
					$('#modal-load tbody').append(tr.append(tdName).append(tdDate));
				}
				$('#modal-load .alert-danger').collapse('hide');
			} else {
				$('#modal-load .alert-danger').text("Error getting library listing: " + textStatus);
				$('#modal-load .alert-danger').collapse('show');
			}
		}).fail(function(jqXHR, textStatus, errorThrown) {
			$('#modal-load .alert-danger').text("Error getting library listing: " + textStatus + " (" + errorThrown + ")");
			$('#modal-load .alert-danger').collapse('show');
		});
	});

	// TODO: basic alert & prompt look unnatural here
	$("#button-structure-save").on("click", function(e) {
		var body = JSON.stringify(dataModel.selected);
		var name = prompt("Enter library entry name", "");
		$.ajax({
			url: "library/" + encodeURIComponent(name),
			method: "put",
			contentType: "application/json",
			data: body
		}).done(function(data, textStatus, jqXHR) {
			alert("done: " + textStatus);
		}).fail(function(jqXHR, textStatus, errorThrown) {
			alert("fail: " + textStatus + " (" + errorThrown + ")");
		});
	});

    $("#button-information").on("click", function(e) {
		$('#modal-intro').modal();
	});

    $("#gl-canvas").on("keydown", function(e) {
		if(112 /* F1 */ == e.keyCode) {
			$("#button-information").click();
			e.preventDefault();
		}
	});

	$("#button-demo").on("click", function(e) {
		var script = [
			{ button:"#button-structure-remove-all-objects", timeout:1000 },
			{ button:"#button-structure-add-object", timeout:2000 },

			// Globe
			{ ahref:"#ul-structure-add-object li:nth-of-type(1) a", timeout:2000 },
			{ input:"#input-material-texture", value:"tex/nasa/2048.jpg", timeout:2000 },
			{ input:"#input-transformation-rotate-amount", value:90, timeout:1000 },
			{ button:"#button-transformation-rotate-xn", timeout:1000 },
			{ input:"#input-transformation-rotate-amount", value:4, timeout:1000 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ input:"#input-transformation-translate-amount", value:2, timeout:1000 },
			{ button:"#button-transformation-translate-xn", timeout:1000 },

			// Checkerboard
			{ ahref:"#ul-structure-add-object li:nth-of-type(1) a", timeout:2000 },
			{ input:"#input-material-texture", value:'generate:{"algorithm":"checkerboard","texSize":256,"numChecks":32,"color1":{"r":255,"g":0,"b":255,"a":255},"color2":{"r":192,"g":192,"b":192,"a":255}}', timeout:2000 },
			{ input:"#input-transformation-rotate-amount", value:90, timeout:1000 },
			{ button:"#button-transformation-rotate-xn", timeout:1000 },
			{ input:"#input-transformation-rotate-amount", value:4, timeout:1000 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ input:"#input-transformation-translate-amount", value:2, timeout:1000 },
			{ button:"#button-transformation-translate-xp", timeout:1000 },

			// Pattern
			{ ahref:"#ul-structure-add-object li:nth-of-type(1) a", timeout:2000 },
			{ input:"#input-material-texture", value:'tex/marble_9181130-1024.jpg', timeout:2000 },
			{ input:"#input-material-texture-multiplier", value:4, timeout:2000 },
			{ input:"#input-transformation-rotate-amount", value:90, timeout:1000 },
			{ button:"#button-transformation-rotate-xn", timeout:1000 },
			{ input:"#input-transformation-rotate-amount", value:4, timeout:1000 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ input:"#input-transformation-translate-amount", value:2, timeout:1000 },
			{ button:"#button-transformation-translate-zn", timeout:1000 },

			// Checkerboard
			{ ahref:"#ul-structure-add-object li:nth-of-type(6) a", timeout:2000 },
			{ input:"#input-material-texture", value:'generate:{"algorithm":"checkerboard","texSize":256,"numChecks":32,"color1":{"r":128,"g":255,"b":128,"a":255},"color2":{"r":192,"g":192,"b":192,"a":255}}', timeout:2000 },
			{ input:"#input-transformation-rotate-amount", value:90, timeout:1000 },
			{ button:"#button-transformation-rotate-xn", timeout:1000 },
			{ input:"#input-transformation-rotate-amount", value:4, timeout:1000 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ button:"#button-transformation-rotate-zn", timeout:40 },
			{ input:"#input-transformation-translate-amount", value:2, timeout:1000 },
			{ button:"#button-transformation-translate-zp", timeout:1000 },

			{ finish:true, message:"Demonstration complete! Click anywhere in the scene and use LEFT/RIGHT/UP/DOWN ARROW and QE keys to rotate the sphere. Click 'Information' to know more." }
		]
		function play(frameIndex) {
			var frame = script[frameIndex];
			var onexit = [];
			var e = null;
			if(frame.button != null) {
				e = $(frame.button);
				onexit.push(function(){ e.click().blur(); });
			}
			if(frame.ahref != null) {
				e = $(frame.ahref);
				onexit.push(function(){ e.click().blur(); });
			}
			if(frame.input != null) {
				e = $(frame.input);
				e.val(frame.value);
				onexit.push(function(){ e.change(); });
			}
			if(frame.option != null) {
				e = $(frame.option);
				e.prop('selected', true);
				onexit.push(function(){
					dataModel.loadFromGui($(frame.select)[0]); // XXX HACK
				});
			}
			if(frame.static != null) {
				e = $(frame.static);
			}
			if(e) {
				e.addClass("demo-highlight");
				onexit.push(function(){ e.removeClass("demo-highlight"); });
			}
			if(frame.finish != true) {
				setTimeout(function () {
					for(var i = 0; i < onexit.length; ++i) {
						onexit[i]();
					}
					play(frameIndex + 1);
				}, frame.timeout * 1);
			} else {
				alert(frame.message);
			}
		}
		play(0);
	});

  $('#modal-intro').modal();
};
