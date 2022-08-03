var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const server = 'https://saul-parse-serv.nairvish.io:2096/';
const APP_ID = 'SAUL_PROJECT_PARSE_ENV';
const REST_KEY = 'X5NL4gwgT7ylYhxRjnF5jFz4ZZcAeBHo';
const id = generateUserID();
let objID;
let objCreationRequestSent = false;
let keypresses = [];
class Keypress {
    constructor(keypress, timestamp) {
        this.keypress = keypress;
        this.timestamp = timestamp;
    }
}
export function logKeypress(keypress) {
    return __awaiter(this, void 0, void 0, function* () {
        const xhr = new XMLHttpRequest();
        keypresses.push(new Keypress(keypress, new Date().toTimeString()));
        if (objID) {
            // Update existing object
            xhr.open('PUT', server + `parse/classes/Session/${objID}`);
            setHeaders(xhr);
            xhr.send(JSON.stringify({
                keyPresses: keypresses
            }));
        }
        else if (!objCreationRequestSent) {
            objCreationRequestSent = true;
            // Create new object
            xhr.open('POST', server + 'parse/classes/Session');
            setHeaders(xhr);
            xhr.send(JSON.stringify({
                sessionID: id,
                keyPresses: keypresses
            }));
        }
        // https://stackoverflow.com/questions/48969495/in-javascript-how-do-i-should-i-use-async-await-with-xmlhttprequest
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                // Successful
                if (!objID)
                    objID = JSON.parse(xhr.response).objectId;
            }
        };
    });
}
function setHeaders(xhr) {
    xhr.setRequestHeader('Content-Type', 'application/json');
    // Authentication
    xhr.setRequestHeader('X-Parse-Application-Id', APP_ID);
    xhr.setRequestHeader('X-Parse-REST-API-Key', REST_KEY);
}
// https://stackoverflow.com/questions/6860853/generate-random-string-for-div-id
function generateUserID(prefix = '') {
    return Math.random().toString(36).replace('0.', prefix);
}
