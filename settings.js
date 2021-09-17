var SETTINGS_TEMPLATE = {
	"indentation" : '\t'.toString(),
}
var SETTINGS;

var settingsIndentationType;
var settingsNumberOfSpaces;

initSettings();

function initSettings() {
	SETTINGS = JSON.parse(localStorage.getItem('settings')) || SETTINGS_TEMPLATE;
	settingsIndentationType = document.getElementById('settings_indentationType');
	settingsNumberOfSpaces = document.getElementById('settings_numberSpaces');

	if (SETTINGS.indentation == '\t'.toString()) {
		settingsIndentationType.value = '\\t';
		settingsNumberOfSpaces.style.display = "none";
	} else {
		settingsIndentationType.value = 'spaces';
		settingsNumberOfSpaces.style.display = "inline";
		settingsNumberOfSpaces.value = SETTINGS.indentation;
	}
}

function updateSettings() {
	switch (settingsIndentationType.value) {
		case '\\t':
			settingsIndentationType.value = '\\t';
			SETTINGS.indentation = '\t'.toString();
			settingsNumberOfSpaces.style.display = "none";
			break;
		case 'spaces':
			settingsIndentationType.value = 'spaces';
			settingsNumberOfSpaces.style.display = "inline";
			SETTINGS.indentation = parseInt(settingsNumberOfSpaces.value);
			break;
	}

	saveSettings();

	userInput().convertInput();
}

function saveSettings() {
	localStorage.setItem('settings', JSON.stringify(this.SETTINGS));
}
