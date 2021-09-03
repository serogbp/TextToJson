function processUserInput(input) {
	inputProcessed = input
	Alpine.data('userInput', () => 'j')
}

const userInput = () => {
	return {
		input: '',
		convertedInput: '',

		convertInput() {
			this.convertedInput = convertToJson(this.input);
		},

	}
}

function convertToJson(userInput) {
	var myJson = {};

	// Read userInput line by line getting the indentation (number of spaces to the left)
	var lines = inputWithDepth(userInput);

	for (var i = 0; i < lines.length; i++) {
		let currentLine = lines[i];

		let parentsChain = [];
		parentsChain = getParentObjectChain(lines, i, []);

		let a = {};
		// let b = parentsChain.shift()
		// a[b.object.property[0]] = b.object.value;

		let parents;
		if (parentsChain.length > 1) {
			parents = getParentObject(parentsChain, a);
		}


		if (parents !== currentLine && 	parents != null) {
			switch (parents[parents.length - 2].type) { // Type of the direct parent
				case TYPE.PROPERTY: {
					// myJson[parent.object.property][currentLine.object.property] = currentLine.object.value;
					insertObjectToTarget(myJson[parents.object.property], currentLine);
					break;
				}
				case TYPE.ARRAY: {
					insertObjectToTarget(myJson[parents.object.property], currentLine);
					break;
				}
				case TYPE.OBJECT: {
					insertObjectToTarget(myJson[parents.object.property], currentLine);
					break;
				}
				case TYPE.SIMPLE_TYPE: {
					break;
				}
			}
		} else {
			insertObjectToTarget(myJson, currentLine);
		}
	}
	return JSON.stringify(myJson, undefined, 4);
}

function convertToText(userInput) {

}

// Read user input line by line
// And return an Array with:
// - The line as String
// - Identation level (number of spaces to the left)
function inputWithDepth(userInput) {
	let array = [];
	let lines = userInput.split('\n');
	for (var i = 0; i < lines.length; i++) {
		let depth = countPrefixSpaces(lines[i])
		let type = getType(lines[i]);
		let object = getJsonObject(lines[i], type);
		array.push({
			"line": lines[i],
			"depth": depth,
			"type": type,
			"object": object,
		});
	}
	return array;
}

// var parent
// for parents
// parent = parents[i]

// Returns de number of spaces a string starts with
function countPrefixSpaces(s) {
	var count = 0
	for (var i = 0; i < s.length; i++) {
		if (s[i].trim() === '') {
			count++;
		} else {
			break;
		}
	}
	return count;
}

function getJsonObject(line, type) {
	let jsonObject = {
		"property": "",
		"value": "",
	}
	switch (type) {
		case TYPE.PROPERTY: {
			let property = getProperty(line);
			let value = getValue(line);
			if (property !== null && value !== null) {
				jsonObject.property = property;
				jsonObject.value = value;
			}
			break;
		}
		case TYPE.ARRAY: {
			let property = getProperty(line);
			jsonObject.property = [property]
			break;
		}
		case TYPE.OBJECT: {
			let property = getPropertyObject(line);
			jsonObject.property = [property]
			break;
		}
		case TYPE.SIMPLE_TYPE: {
			let property = getProperty(line);
			jsonObject.property = [property]
			break;
		}
	}

	return jsonObject;
}

function insertObjectToTarget(target, currentLine) {
	switch (currentLine.type) {
		case TYPE.PROPERTY: {
			target[currentLine.object.property] = currentLine.object.value;
			break;
		}
		case TYPE.ARRAY: {
			target[currentLine.object.property] = [];
			break;
		}
		case TYPE.OBJECT: {
			target[currentLine.object.property] = {};
			break;
		}
		case TYPE.SIMPLE_TYPE: {
			target.push(currentLine.object.property);
			break;
		}
	}
}

// e.g. "property = value" => "property"
// e.g. "array[]" => "array"
const getProperty = (userInput) => /(.*)(=|\[])/.exec(userInput)[1].trim();
// For TYPE.OBJECT
const getPropertyObject = (userInput) => /(.*)/.exec(userInput)[1].trim();

// e.g. "property = value" => "value"
const getValue = (userInput) => /=(.*)/.exec(userInput)[1].trim();

const TYPE = {
	COMMENT: -1,
	PROPERTY: 0,
	ARRAY: 1,
	OBJECT: 2,
	SIMPLE_TYPE: 3,
}

function getType(userInput) {
	var type = -1;
	if (isComment(userInput)) type = TYPE.COMMENT
	else if (isProperty(userInput)) type = TYPE.PROPERTY
	else if (isArray(userInput)) type = TYPE.ARRAY
	else if (isObject(userInput)) type = TYPE.OBJECT
	else if (isSimpleType(userInput)) type = TYPE.SIMPLE_TYPE
	return type;
}

// e.g. "// This is a comment" => true
const isComment = (userInput) => /^\/.*$/.test(userInput);

// e.g. "property = value" => true
const isProperty = (userInput) => /\S+\s*=\s*\S+/.test(userInput);

// e.g. "someText[]" => true
const isArray = (userInput) => /\S\[]/.test(userInput)

// e.g. "objectName" => true
const isObject = (userInput) => /\S+/.test(userInput);

// e.g. "arrayItem," => true
const isSimpleType = (userInput) => /\S+,/.test(userInput);



















// function getParentObject(list, index) {
// 	let originalDepth = list[index].depth;
// 	if (originalDepth == 0) return null;

// 	let children = list[index];

// 	let hierarchy = [];
// 	let currentDepth = originalDepth;

// 	for (var i = index - 1; i >= 0; i--) {
// 		if (list[i].depth < currentDepth) {
// 			hierarchy.push(list[i]);
// 			currentDepth--;
// 		}
// 	}

// 	let parent;
// 	for (var i = hierarchy.length - 1; i >= 0; i--) {

// 	}

// 	return (parent!=null) ? parent[list[i].object.property] : null;
// }

// function getParentObject(list, index) {
// 	let depth = list[index].depth;
// 	let parent;

// 	let children = list[index];

// 	for (var i = index - 1; i >= 0; i--) {
// 		// if (list[i].depth < depth) return list[i];
// 		if (list[i].depth < depth) parent = getParentObject(list, i);
// 	}
// 	return (parent!=null) ? parent[children.object.property] : children;
// }

function getParentObjectChain(list, index, array) {
	let depth = list[index].depth;
	let parent;

	let children = list[index];

	for (var i = index - 1; i >= 0; i--) {
		if (list[i].depth < depth) array = getParentObjectChain(list, i, array);
	}
	if (parent!=null){
		array.push(parent);
	} else {
		array.push(children);
	}
	return array;
}

function getParentObject(array, parent) {
	// if (array.length > 0) {
	// 	parent[array.shift().object.property[0]][getParentObject(array, parent)];
	// }
	// return parent;

	let lastObjectName = "";
	while (array.length > 0) {
		let object = array.shift();
		let objectName = object.object.property[0];
		if (lastObjectName != "") {
			parent[lastObjectName][objectName] = {};
		} else {
			parent[objectName] = {};
		}
		lastObjectName = objectName;
	}

	return parent;
}

function getParentObjects(array) {
	var parent;
	for (var i = 0; i > array.length; i++) {
		// parent =
	}
}
