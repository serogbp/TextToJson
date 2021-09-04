// alpine.js x-data for both textareas
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
	var json = {};

	userInput = getInfoOfEachLine(userInput);

	for (var i = 0; i < userInput.length; i++) {
		let currentLine = userInput[i];

		let parentArray = getParentArrayOfLine(userInput, i, []);
		parentArray.pop(); // Remove last item, that is the currentLine

		let parentType;
		let parentChain;

		if (parentArray.length > 0) {
			parentType = parentArray[parentArray.length - 1].type;
			parentChain = getParentChainOfParentArray(parentArray, {});
		}

		if (parentChain != null) {
			switch (parentType) {

			}
		} else {
			appendLineToTarget(currentLine, json);
		}
	}
	return JSON.stringify(json, undefined, 4);
}

// Read user input line by line
// And return an Array with:
// - Identation level (number of spaces to the left)
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
				"indentation": indentation,
				"type": type,
				"object": object,
			}));
		}
	}
	console.log(array);
	return array;
}

function getParentArrayOfLine(lines, currentLineIndex, array) {
	let currentLine = lines[currentLineIndex];
	let parent;

	for (var i = currentLineIndex - 1; i >= 0; i--) {
		if (lines[i].indentation < currentLine.indentation) {
			array = getParentArrayOfLine(lines, i, array);
		}
	}

	// array.push((parent != null) ? parent: currentLine);

	let indentation = (parent != null) ? parent.indentation: currentLine.indentation;
	let type = (parent != null) ? parent.type: currentLine.type;
	let object = (parent != null) ? parent.object: currentLine.object;

	array.push( new JsonLine({
		"indentation": indentation,
		"type": type,
		"object": object,
	}));

	return array;
}

function getParentChainOfParentArray(parentArray, parentChain) {
	let lastParent;
	while (parentArray.length > 0) {
		let currentParent = parentArray.shift();

		if (lastParent != null) {
			switch (lastParent.type) {
				case TYPE.PROPERTY:
					parentChain[lastParent.object.name][currentParent.object.name] = [currentParent.object.value];
					break;
				case TYPE.ARRAY:
					parentChain[lastParent.object.name][currentParent.object.name] = [];
					break;
				case TYPE.OBJECT:
					parentChain[lastParent.object.name][currentParent.object.name] = {};
					break;
				case TYPE.PRIMITIVE:
					parentChain[lastParent.object.name].push(currentParent.object.name);
					break;
			}
		} else { // First parent
			switch (currentParent.type) {
				case TYPE.PROPERTY:
					parentChain[currentParent.object.name] = [currentParent.object.value];
					break;
				case TYPE.ARRAY:
					parentChain[currentParent.object.name] = [];
					break;
				case TYPE.OBJECT:
					parentChain[currentParent.object.name] = {};
					break;
				case TYPE.PRIMITIVE:
					// TODO ???
					break;
			}
		}
		lastParent = currentParent;
	}
	return parentChain;
}

function appendLineToTarget(line, target) {
	if (line instanceof JsonLine) {
		switch (line.type) {
			case TYPE.PROPERTY: {
				target[line.object.name] = line.object.value;
				break;
			}
			case TYPE.ARRAY: {
				target[line.object.name] = [];
				break;
			}
			case TYPE.OBJECT: {
				target[line.object.name] = {};
				break;
			}
			case TYPE.PRIMITIVE: {
				target.push(line.object.name);
			}
		}
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

class JsonProperty {
	constructor(input) {
		this.name = this._getName(input);
		this.value = this._getValue(input);
	}

	// e.g. "property = value" => "property"
	_getName(input) {
		return regexPropertyName.exec(input)[1].trim();
	}

	// e.g. "property = value" => "value"
	// 		"property = 5.5" => 5.5
	//		"property = True" => true
	_getValue(input) {
		input = regexPropertyValue.exec(input)[1].trim();

		if (!isNaN(parseFloat(input))) return parseFloat(input);
		else if (input.toLowerCase() === 'true') return true;
		else if (input.toLowerCase() === 'false') return false;
		else return input;
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

class JsonPrimitive {
	constructor(input) {
		this.name = this._getName(input);
	}

	_getName(input) {
		return regexPrimitive.exec(input)[1].trim();
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

const regexComment = /^\/.*$/;			// e.g. "// This is a comment" => true
const regexProperty = /\S+\s*=\s*\S+/;	// e.g. "property = value" => true
const regexArray = /(\S*)\[]/;			// e.g. "someText[]" => true
const regexObject = /(\S*){}/;			// e.g. "objectName" => true
const regexPrimitive = /(\S+),/;		// e.g. "arrayItem," => true

const regexPropertyName = /(.*)(=)/;	// e.g. "property = value" => "property"
const regexPropertyValue = /=(.*)/;		// e.g. "property = value" => "value"
