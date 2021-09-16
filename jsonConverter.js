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
	userInput = getInfoOfEachLine(userInput);

	// This line is removed from the userInput array because it's only use to
	// get type of json (object or array)
	if (userInput.length > 0) {
		jsonType = userInput.shift().type;
		if (jsonType == TYPE.OBJECT) json = {};
		else if (jsonType == TYPE.ARRAY) json = [];
	}

	for (var i = 0; i < userInput.length; i++) {
		let currentJsonLine = userInput[i];
		let target = json;

		if (currentJsonLine.indentation > 0) appendLineToParentTarget(userInput, i);
		else appendLineToTarget(currentJsonLine, target);
	}

	return JSON.stringify(json, undefined, SETTINGS.indentation);
}

// Read user input line by line
// And return an Array with:
// - Indentation level (number of spaces to the left)
// - Type of data (property, array, object or primitive)
// - Object with the information the user input
function getInfoOfEachLine(userInput) {
	let array = [];
	let lines = userInput.split('\n');

	for (var i = 0; i < lines.length; i++) {
		let line = lines[i];
		let type = getType(line);

		// If is not comment, push line to array
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
				"indentation": indentation > 0 ? indentation - 1 : indentation,
				"type": type,
				"object": object,
			}));
		}
	}
	return array;
}

// # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
// Parent functions
// # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
function appendLineToParentTarget(userInput, currentLineIndex) {
	let parentTarget; // Reference to the json object to append new JsonLine
	let parentType;

	// Get parent Target
	switch (jsonType) {
		case TYPE.OBJECT: {
			let parentArray = getParentArrayOfLine(userInput, currentLineIndex, []);
			if (parentArray.length > 0) {
				parentType = parentArray[parentArray.length - 1].type;

				// Get parent path in this format a.b.c
				let parentPath = "";
				for (let i = 0; i < parentArray.length; i++)
					parentPath += parentArray[i].object.name + ".";
				parentPath = parentPath.substring(0, parentPath.length - 1); // Remove last dot

				// Get Parent reference
				var jsonReference = json;
				var parentPathFormatted = parentPath.split('.');
				for (var i = 0; i < parentPathFormatted.length - 1; i++) {
					var parent = parentPathFormatted[i];
					if (!jsonReference[parent]) jsonReference[parent] = {}
					jsonReference = jsonReference[parent];
				}
				parentTarget = jsonReference[parentPathFormatted[parentPathFormatted.length - 1]];

			}
			break;
		}
		case TYPE.ARRAY: {

			break;
		}
	}

	appendLineToTarget(userInput[currentLineIndex], parentTarget, parentType);
}

// Returns array with the parents of the current line
// Sort by descending indentation
function getParentArrayOfLine(lines, currentLineIndex, array) {
	let currentLine = lines[currentLineIndex];
	let currentIndentation = currentLine.indentation
	let parent;

	for (var i = currentLineIndex - 1; i >= 0; i--) {
		if (lines[i].indentation < currentIndentation) {
			parent = lines[i];

			let indentation = parent.indentation;
			let type = parent.type;
			let object = parent.object;

			array.push(new JsonLine({
				"indentation": indentation,
				"type": type,
				"object": object,
			}));

			currentIndentation = indentation
		}
	}

	array.reverse();

	return array;
}

function appendLineToTarget(currentJsonLine, target, parentType) {

	if (parentType == null) parentType = jsonType;

	switch (parentType) {
		case TYPE.OBJECT:
			switch (currentJsonLine.type) {
				case TYPE.PROPERTY:
					target[currentJsonLine.object.name] = currentJsonLine.object.value;
					break;
				case TYPE.ARRAY:
					target[currentJsonLine.object.name] = [];
					break;
				case TYPE.OBJECT:
					target[currentJsonLine.object.name] = {};
					break;
				case TYPE.PRIMITIVE:
					break;
			}
			break;
		case TYPE.ARRAY:
			switch (currentJsonLine.type) {
				case TYPE.PROPERTY:
					target.push({
						[currentJsonLine.object.name]: currentJsonLine.object.value,
					});
					break;
				case TYPE.ARRAY: {
					let array = [];
					array.name = currentJsonLine.object.name;
					target.push(array);
					break;
				}
				case TYPE.OBJECT:
					var a = {};
					target.push(a);
					break;
				case TYPE.PRIMITIVE:
					target.push(currentJsonLine.object.name);
					break;
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
// Code for getting the type of data the user inputs
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
var jsonType = TYPE.OBJECT;
