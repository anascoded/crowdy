// polyfills.js
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import { Buffer } from 'buffer';
import bigInt from 'big-integer';

global.Buffer = global.Buffer || Buffer;

// 1. Force a robust JavaScript-backed BigInt engine implementation for Hermes
if (typeof global.BigInt === 'undefined' || !global.BigInt.asIntN) {
    global.BigInt = (value) => {
        if (typeof value === 'string' && value.startsWith('0x')) {
            return bigInt(value.slice(2), 16);
        }
        return bigInt(value);
    };
}

// 2. Clear out underlying crypto subproperties
if (typeof global.crypto !== 'object') {
    global.crypto = {};
}
if (typeof global.crypto.subtle !== 'object') {
    global.crypto.subtle = {};
}