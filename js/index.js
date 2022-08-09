import { getBias, playSound, setPannerPosition } from './audioPlayer.js';
import { logKeypress } from './logging.js';
import { initTabbableElements } from './narrator.js';
let alertOpen = false;
//Query Parameters
const params = new Proxy(new URLSearchParams(window.location.search), {
	get: (searchParams, prop) => searchParams.get(prop)
});
//Spatial audio toggle
const spatialAudioEnabled = params.spatialAudio !== 'false';
document.querySelectorAll('*').forEach((node) => {
	node.addEventListener('mousedown', (e) => {
		e.preventDefault();
	});
	node.addEventListener('focus', (e) => {
		readElement(node);
		e.stopPropagation();
	});
	node.addEventListener('keypress', (e) => {
		e.stopPropagation();
		if (getAlertElementType(node) === 'invalid') {
			readElement(node);
		} else {
			if (e.key == 'Enter') {
				logKeypress('Enter');
				openAlert(node);
			}
		}
	});
	switch (node.nodeName.toLowerCase()) {
		case 'h1':
		case 'h2':
		case 'h3':
		case 'a':
		case 'p':
		case 'img':
		case 'hr':
		case 'button':
		case 'input':
			node.setAttribute('tabindex', '0');
			break;
	}
	// Link alert functionality
	if (node.classList.contains('link')) {
		node.addEventListener('click', () => openAlert(node));
	}
});
initTabbableElements();
//Prevent reloading the page when clicking on the link. This would previously cut off played audio.
document.querySelectorAll('a').forEach((node) => {
	node.addEventListener('click', (e) => {
		e.preventDefault();
	});
});
const elementsWithSound = ['h1', 'h2', 'h3', 'p', 'a', 'button', 'img', 'hr', 'header', 'main', 'nav', 'div'];
export function readElement(element) {
	const elementType = element.nodeName.toLowerCase();
	const soundFilePath = `./assets/sound/${elementType}.mp3`;
	const linkSoundFilePath = `./assets/sound/a.mp3`;
	const bias = getBias(element);
	const filename = `${element.getAttribute('additionalSoundBite')}.mp3`;
	const additionalSoundFilePath = `./assets/sound/${getBaseFilePath(elementType)}/${filename}`;
	const containsAdditionalSoundbite = !additionalSoundFilePath.includes('null.mp3');
	//Set panner position
	if (elementsWithSound.includes(elementType) && spatialAudioEnabled) setPannerPosition(bias.x, bias.y);
	const isLink = element.classList.contains('link');
	//Play sound file (can log sound cancellation through catch() callback if necessary)
	switch (elementType) {
		case 'h1':
		case 'h2':
		case 'h3':
		case 'button':
			if (containsAdditionalSoundbite) {
				playSound(additionalSoundFilePath)
					.then(() => {
						if (isLink)
							playSound(soundFilePath)
								.then(() => {
									playSound(linkSoundFilePath).catch(() => {});
								})
								.catch(() => {});
						else playSound(soundFilePath).catch(() => {});
					})
					.catch((e) => {});
			} else {
				if (isLink)
					playSound(soundFilePath)
						.then(() => {
							playSound(linkSoundFilePath).catch(() => {});
						})
						.catch(() => {});
				else playSound(soundFilePath).catch(() => {});
			}
			break;
		case 'p':
		case 'a':
		case 'img':
			playSound(soundFilePath)
				.then(() => {
					if (containsAdditionalSoundbite) {
						playSound(additionalSoundFilePath)
							.then(() => {
								if (isLink) playSound(linkSoundFilePath).catch(() => {});
							})
							.catch(() => {});
					}
				})
				.catch(() => {});
			break;
		case 'hr':
			playSound('./assets/sound/separator.mp3').catch(() => {});
			break;
		case 'header':
			playSound('./assets/sound/banner-landmark.mp3').catch(() => {});
			break;
		case 'main':
			playSound('./assets/sound/main-landmark.mp3').catch(() => {});
			break;
		case 'nav':
			playSound('./assets/sound/navigation-landmark.mp3').catch(() => {});
			break;
		case 'div':
			if (containsAdditionalSoundbite) playSound(additionalSoundFilePath).catch(() => {});
			break;
	}
}
function getBaseFilePath(elementType) {
	switch (elementType) {
		case 'a':
			return 'link-titles';
		case 'h1':
		case 'h2':
		case 'h3':
			return 'header-titles';
		case 'p':
			return 'captions';
		case 'img':
			return 'alt-text';
		default:
			return '';
	}
}
function getAlertElementType(node) {
	switch (node.nodeName.toLowerCase()) {
		case 'h1':
		case 'h2':
		case 'h3':
			return 'text';
		case 'img':
			return 'image';
		default:
			return 'invalid';
	}
}
function openAlert(node) {
	var _a, _b;
	if (alertOpen) return;
	const bias = getBias(node);
	console.log(spatialAudioEnabled);
	if (spatialAudioEnabled) setPannerPosition(bias.x, bias.y);
	alertOpen = true;
	document.dispatchEvent(new Event('alert-open'));
	let elementType = getAlertElementType(node);
	const soundbite = node.getAttribute('additionalSoundbite');
	const selectorArgs = `[additionalSoundbite="${soundbite}"]`;
	const content =
		elementType === 'text'
			? node.textContent
			: (_b = (_a = document.querySelector(`h2${selectorArgs}, h3${selectorArgs}`)) === null || _a === void 0 ? void 0 : _a.textContent) !== null && _b !== void 0
			? _b
			: 'Headline not found.';
	const pageOpenedSoundFilePath = `./assets/sound/page-opened.mp3`;
	const pageClosedSoundFilePath = `./assets/sound/page-closed.mp3`;
	const headerSoundFilePath = `./assets/sound/header-titles/${soundbite}.mp3`;
	playSound(pageOpenedSoundFilePath)
		.then(() => {
			playSound(headerSoundFilePath).catch(() => {});
			//Alert has to go here, since alerts cut off javascript execution.
			setTimeout(() => {
				alert('Page opened: ' + content);
				alertOpen = false;
				document.dispatchEvent(new Event('alert-closed'));
				playSound(pageClosedSoundFilePath).catch(() => {});
			}, 500);
		})
		.catch(() => {});
}
