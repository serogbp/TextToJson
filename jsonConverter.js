// Converts simple syntax text to Json format
// Author: serogbp

// alpine.js x-data for both textarea
const userInput = () => {
	return {
		input: '',
		convertedInput: '',

		convertInput() {
			this.convertedInput = text2Json(this.input);
		},

	}
}

// # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
// Process user input
// # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
function text2Json(userInput) {
	// Transforms user input in array of JsonLine objects
	userInput = getInfoOfEachLine(userInput);

	// First line is removed from the userInput array because it's used to:
	// - get type of json (object or array)
	// - initialize the json variable
	if (userInput.length > 0) {
		jsonType = userInput.shift().type;
		if (jsonType == TYPE.OBJECT) json = {};
		else if (jsonType == TYPE.ARRAY) json = [];
	}

	populateJson(userInput, json, jsonType);

	// while (userInput.length > 0) {
	// 	let jsonReference = json;
	// 	let type = jsonType;
	// 	populateJson(userInput, jsonReference, type);
	// }

	return JSON.stringify(json, undefined, SETTINGS.indentation);
}

// Populates the json variable (an object or an array) with the values of the userInput array (array of JsonLine) using recursion
//
// Attributes
// userInput: array of JsonLine objects with the user input
// jsonReference: a reference of the json variable or a property/array position of it
// lastLineType: necessary for appendLineToTarget() function
function populateJson(userInput, jsonReference, lastLineType) {
	if (userInput.length > 0) {
		let line = userInput.shift();
		let lastJsonReference = jsonReference; // Save reference in case there is a line with same indentation as the current
		jsonReference = appendLineToTarget(line, jsonReference, lastLineType);

		if (userInput[0] && userInput[0].indentation > line.indentation) {
			populateJson(userInput, jsonReference, line.type);
		}

		if (userInput[0] && userInput[0].indentation == line.indentation) {
			populateJson(userInput, lastJsonReference, lastLineType);
		}
	}
}

// Reads user input, splits it by \n (newline character) and returns an Array with information of each line:
// - Indentation level (number of spaces to the left)
// - Type of data (property, array, object or primitive)
// - Object with the values of the line
function getInfoOfEachLine(userInput) {
	let array = []; // Returns this array
	let lines = userInput.split('\n');

	for (var i = 0; i < lines.length; i++) {
		let line = lines[i];
		let type = getType(line);

		// If is not comment (-1), push line to array
		if (type != -1) {
			let indentation = line.countStartSpaces();
			let object;

			switch (type) {
				case TYPE.PROPERTY: {
					object = new JsonProperty(line);
					break;
				}
				case TYPE.ARRAY: {
					object = new JsonArray(line);
					break;
				}
				case TYPE.OBJECT: {
					object = new JsonObject(line);
					break;
				}
				case TYPE.PRIMITIVE: {
					object = new JsonPrimitive(line);
					break;
				}
			}

			array.push(new JsonLine({
				"indentation": indentation,
				"type": type,
				"object": object,
			}));
		}
	}
	return array;
}

// If the target is an object, adds the value of the currentJsonLine as property of the target.
// Then returns the reference of that target property.
//
// If the target is an array, pushed the value of the currentJsonLine to the target
// Then returns the array position of the target
function appendLineToTarget(currentJsonLine, target, parentType) {
	if (parentType == null)
		parentType = jsonType;

	switch (parentType) {
		case TYPE.OBJECT:
			switch (currentJsonLine.type) {
				case TYPE.PROPERTY:
					target[currentJsonLine.object.name] = currentJsonLine.object.value;
					return target[currentJsonLine.object.name];
				case TYPE.ARRAY:
					target[currentJsonLine.object.name] = [];
					return target[currentJsonLine.object.name];
				case TYPE.OBJECT:
					target[currentJsonLine.object.name] = {};
					return target[currentJsonLine.object.name];
				case TYPE.PRIMITIVE:
					// Can't add a primitive to an object
					break;
			}
			break;
		case TYPE.ARRAY:
			switch (currentJsonLine.type) {
				case TYPE.PROPERTY:
					target.push({
						[currentJsonLine.object.name]: currentJsonLine.object.value,
					});
					return target[target.length - 1];
				case TYPE.ARRAY: {
					// Arrays doesn't care of arrays names, so create empty one and push it
					target.push([]);
					return target[target.length - 1];
				}
				case TYPE.OBJECT:
					// Arrays doesn't care of object names, so create empty one and push it
					target.push({});
					return target[target.length - 1];
				case TYPE.PRIMITIVE:
					target.push(currentJsonLine.object.name);
					return target[target.length - 1];
			}
			break;
	}
}

// # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
// Classes
// # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
class JsonLine {
	constructor(line) {
		this.indentation = line.indentation;
		this.type = line.type;
		this.object = line.object;
	}
}

class JsonArray {
	constructor(input) {
		this.name = this._getName(input);
	}

	_getName(input) {
		return regexArray.exec(input)[1].trim();
	}
}

class JsonObject {
	constructor(input) {
		this.name = this._getName(input);
	}

	_getName(input) {
		return regexObject.exec(input)[1].trim();
	}
}

class JsonProperty {
	constructor(input) {
		this.name = this._getName(input);
		this.value = this._getValue(input);
	}

	_getName(input) {
		return regexPropertyName.exec(input)[1].trim();
	}

	_getValue(input) {
		if (regexPropertyValueForcedString.test(input)) {
			input = regexPropertyValueForcedString.exec(input)[1].trim();
			return input.toString();
		} else {
			input = regexPropertyValue.exec(input)[1].trim();
			return parseValue(input);
		}
	}
}

class JsonPrimitive {
	constructor(input) {
		this.name = this._getName(input);
	}

	_getName(input) {
		if (regexPrimitiveForceString.test(input)) {
			input = regexPrimitiveForceString.exec(input)[1].trim();
			return input.toString();
		}
		else {
			input = regexPrimitive.exec(input)[1].trim();
			return parseValue(input);
		}
	}
}
// # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
// Extend methods
// # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

// Returns de number of spaces a string starts with
String.prototype.countStartSpaces = function () {
	var count = 0
	for (var i = 0; i < this.length; i++) {
		if (this[i].trim() === '') {
			count++;
		} else {
			break;
		}
	}
	return count;
}

// # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
// Getting the type of data the user inputs
// # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
const TYPE = {
	COMMENT: -1,
	PROPERTY: 0,
	ARRAY: 1,
	OBJECT: 2,
	PRIMITIVE: 3,
}

function getType(userInput) {
	var type = -1;
	if (isComment(userInput)) type = TYPE.COMMENT
	else if (isProperty(userInput)) type = TYPE.PROPERTY
	else if (isArray(userInput)) type = TYPE.ARRAY
	else if (isObject(userInput)) type = TYPE.OBJECT
	else if (isPrimitive(userInput)) type = TYPE.PRIMITIVE
	return type;
}

const isComment = (userInput) => regexComment.test(userInput);
const isProperty = (userInput) => regexProperty.test(userInput);
const isArray = (userInput) => regexArray.test(userInput)
const isObject = (userInput) => regexObject.test(userInput);
const isPrimitive = (userInput) => regexPrimitive.test(userInput);

const regexComment = /^\/.*$/;				// e.g. "// This is a comment" => true
const regexProperty = /\S+\s*=\s*\S+/;		// e.g. "property = value" => true
const regexArray = /(\S*)\[]/;				// e.g. "someText[]" => true
const regexObject = /(\S*){}/;				// e.g. "objectName" => true
const regexPrimitive = /(.+),/;				// e.g. "arrayItem," => true
const regexPrimitiveForceString = /"(.+)",/	// e.g. "\"1\"," => true

const regexPropertyName = /(.*)(=)/;				// e.g. "property = value" => "property"
const regexPropertyValue = /=(.*)/;					// e.g. "property = value" => "value"
const regexPropertyValueForcedString = /=\s*"(.*)"/;	// e.g. "property = \"true\"" => "true"

function parseValue(input) {
	if (!isNaN(parseFloat(input))) return parseFloat(input);
	else if (input.toLowerCase() === 'true') return true;
	else if (input.toLowerCase() === 'false') return false;
	else return input;
}

// Stores the user input as an object
// Later use JSON.stringify to show it in the 2nd textarea
var json = {};
var jsonType;
