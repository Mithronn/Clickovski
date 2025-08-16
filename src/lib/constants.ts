import { Transition } from "motion/react";

export const transition = { duration: 0.6, ease: [0.43, 0.13, 0.23, 0.96] } as Transition<any>;

export function convertKeyToReadableFromBackend(keyStr: string): string {
    let keys = String(keyStr).split("+");

    let functionalKeysArray = []; //{key: key,isModifier: false/true}
    for (let i = 0; i < keys.length; i++) {
        let keyObject = {
            key: "",
            isModifier: false
        }

        switch (keys[i]) {
            case "Control": keyObject.key = "CTRL"; keyObject.isModifier = true; break;
            case "AltGraph": keyObject.key = "ALT"; keyObject.isModifier = true; break;
            case "Alt": keyObject.key = "ALT"; keyObject.isModifier = true; break;
            case "Meta": keyObject.key = "META"; keyObject.isModifier = true; break;
            case "Shift": keyObject.key = "SHIFT"; keyObject.isModifier = true; break;
            case "Backspace": keyObject.key = "Backspace".toUpperCase(); keyObject.isModifier = true; break;
            case "CapsLock": keyObject.key = "CapsLock".toUpperCase(); keyObject.isModifier = true; break;
            case "Tab": keyObject.key = "Tab".toUpperCase(); keyObject.isModifier = true; break;
            case "Delete": keyObject.key = "Delete".toUpperCase(); keyObject.isModifier = true; break;
            case "End": keyObject.key = "End".toUpperCase(); keyObject.isModifier = true; break;
            case "Escape": keyObject.key = "Escape".toUpperCase(); keyObject.isModifier = true; break;
            case "Option": keyObject.key = "ALT"; keyObject.isModifier = true; break;
            case "PageDown": keyObject.key = "PageDown".toUpperCase(); keyObject.isModifier = true; break;
            case "PageUp": keyObject.key = "PageUp".toUpperCase(); keyObject.isModifier = true; break;
            case "Enter": keyObject.key = "Return".toUpperCase(); keyObject.isModifier = true; break;
            case "Space": keyObject.key = "Space".toUpperCase(); keyObject.isModifier = true; break;

            case "F1": keyObject.key = keys[i]; keyObject.isModifier = true; break;
            case "F2": keyObject.key = keys[i]; keyObject.isModifier = true; break;
            case "F3": keyObject.key = keys[i]; keyObject.isModifier = true; break;
            case "F4": keyObject.key = keys[i]; keyObject.isModifier = true; break;
            case "F5": keyObject.key = keys[i]; keyObject.isModifier = true; break;
            case "F6": keyObject.key = keys[i]; keyObject.isModifier = true; break;
            case "F7": keyObject.key = keys[i]; keyObject.isModifier = true; break;
            case "F8": keyObject.key = keys[i]; keyObject.isModifier = true; break;
            case "F9": keyObject.key = keys[i]; keyObject.isModifier = true; break;
            case "F10": keyObject.key = keys[i]; keyObject.isModifier = true; break;
            case "F11": keyObject.key = keys[i]; keyObject.isModifier = true; break;
            case "F12": keyObject.key = keys[i]; keyObject.isModifier = true; break;

            case "ArrowDown": keyObject.key = "DownArrow".toUpperCase(); keyObject.isModifier = true; break;
            case "ArrowLeft": keyObject.key = "LeftArrow".toUpperCase(); keyObject.isModifier = true; break;
            case "ArrowUp": keyObject.key = "UpArrow".toUpperCase(); keyObject.isModifier = true; break;
            case "ArrowRight": keyObject.key = "RightArrow".toUpperCase(); keyObject.isModifier = true; break;

            // Plus also modifier false but it is equal to split string so we cannot use Plus as +;
            case "Plus": keyObject.key = "+"; keyObject.isModifier = false; break;
            default: {
                keyObject.key = keys[i].toLowerCase(); keyObject.isModifier = false; break;
            }
        }
        functionalKeysArray[i] = keyObject;
    };

    let returnKeySequence = "";

    // first part of the sequence like {+SHIFT}v{+ALT}
    for (let i = 0; i < functionalKeysArray.length; i++) {
        let keyObj = functionalKeysArray[i];
        if (keyObj.isModifier) {
            returnKeySequence += `{+${keyObj.key}}`
        } else {
            returnKeySequence += keyObj.key.trim();
        }
    }

    let reverserdArr = functionalKeysArray.reverse();

    //last part of the sequence like {+SHIFT}v{+ALT}{-ALT}{-SHIFT} 
    for (let i = 0; i < reverserdArr.length; i++) {
        let keyObj = functionalKeysArray[i];
        if (keyObj.isModifier) {
            returnKeySequence += `{-${keyObj.key}}`
        }
    }

    return returnKeySequence;
}