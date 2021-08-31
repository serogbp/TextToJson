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
		let type = getType(lines[i].line);

		if (type != -1) {
			let newObject = getJsonObject(lines[i].line, type);

			switch (type) {
				case TYPE.PROPERTY: {
					if (i > 0 && lines[i].depth > lines[i - 1].depth) {
						myJson[lines[i - 1].property][newObject.property] = newObject.value;
					} else {
						myJson[newObject.property] = newObject.value;
					}
					break;
				}
				case TYPE.ARRAY: {
					myJson[newObject.property] = [];
					break;
				}
				case TYPE.OBJECT: {
					break;
				}
				case TYPE.SIMPLE_TYPE: {
					break;
				}
			}
		}



		// switch (type) {
		// 	case TYPE.PROPERTY: {
		// 		let property = getProperty(line);
		// 		let value = getValue(line);

		// 		if (property[1] !== null && value[1] !== null) {
		// 			myJson[property[1].trim()] = value[1].trim();
		// 		}
		// 		break;
		// 	}
		// 	case TYPE.ARRAY: {
		// 		myJson[lines[1]] = [];
		// 		break;
		// 	}
		// 	case TYPE.OBJECT: {
		// 		break;
		// 	}
		// 	case TYPE.SIMPLE_TYPE: {
		// 		break;
		// 	}
		// }
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
		let type = getType(lines[i]);
		let newObject;
		array.push({
			"line": lines[i],
			"depth": countPrefixSpaces(lines[i]),
			"type": type,
		});
	}
	return array;
}

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
			break;
		}
		case TYPE.SIMPLE_TYPE: {
			break;
		}
	}

	return jsonObject;
}

// e.g. "property = value" => "property"
// e.g. "array[]" => "array"
const getProperty = (userInput) => /(.*)(=|\[])/.exec(userInput)[1].trim();

// e.g. "property = value" => "value"
const getValue = (userInput) => /=(.*)/.exec(userInput)[1].trim();

const TYPE = {
	PROPERTY: 0,
	ARRAY: 1,
	OBJECT: 2,
	SIMPLE_TYPE: 3,
}

function getType(userInput) {
	var type = -1;
	if (isProperty(userInput)) type = TYPE.PROPERTY
	else if (isArray(userInput)) type = TYPE.ARRAY
	else if (isObject(userInput)) type = TYPE.OBJECT
	else if (isSimpleType(userInput)) type = TYPE.SIMPLE_TYPE
	return type;
}

// e.g. "property = value" => true
const isProperty = (userInput) => /\S+\s*=\s*\S+/.test(userInput);

// e.g. "someText[]" => true
const isArray = (userInput) => /\S\[]/.test(userInput)

// e.g. "objectName" => true
const isObject = (userInput) => /\S+/.test(userInput);

// e.g. "arrayItem," => true
const isSimpleType = (userInput) => /\S+,/.test(userInput);
