'use strict';

import {PassThrough, Readable, Transform} from 'stream';
import is from 'is';
import ss from 'stream-stream';
import streamFromPromise from 'stream-from-promise';

const stringer = value => value.toString();
const identity = value => value;

export const syncHandlers = new Map();
export const asyncHandlers = new Map();

function convertSyncValue (value) {
    let result = value;
    for (let [when, handler] of syncHandlers) {
        if (when(value)) {
            result = handler(value);
            break;
        }
    }
    return result;
}

function convertAsyncValue (value) {
    let stream = null;
    for (let [when, handler] of asyncHandlers) {
        if (when(value)) {
            //console.log(`found async handler ${handler.name} for value ${subst}`);
            stream = handler(value);
            //console.log(`async handler return ${typeof stream}`);
            break;
        }
    }
    if (stream === null) {
        throw new Error('Async handler not available for value ' + value);
    }

    return stream;
}

class ConvertSyncValueTransform extends Transform {
    constructor(){
        super({
            objectMode: true
        });
    }

    _transform (data, encoding, callback) {
        let value = convertSyncValue(data);
        callback(null, value);
    }
}


export function addSyncHandler(when, handler) {
    syncHandlers.set(when, handler);
}

export function addAsyncHandler(when, handler) {
    asyncHandlers.set(when, handler);
}

export function isStream(value) {
    return value instanceof Readable;
}

export function isPromise(value) {
    return typeof value.then === 'function';
}

addSyncHandler(is.string, identity);
addSyncHandler(is.number, stringer);
addSyncHandler(is.date, stringer);
addSyncHandler(is.boolean, stringer);
addSyncHandler(is.regexp, stringer);

addAsyncHandler(isStream, s => s.pipe(new ConvertSyncValueTransform()));
addAsyncHandler(isPromise, p => streamFromPromise(p.then(convertSyncValue)));

export default function tempLater(strings, ...substs) {
    let results = ss();

    function newSyncValuesStream() {
        let syncValues = new PassThrough();
        syncValues.on('error', err => results.emit('error', err));
        results.write(syncValues);
        return syncValues;
    }

    let currentSyncValues = newSyncValuesStream();

    substs.forEach( (subst, idx) => {
        let string = strings[idx];
        currentSyncValues.write(string);

        let value = convertSyncValue(subst);

        if (typeof value === 'string') {
            currentSyncValues.write(value);

        } else {

            let stream = convertAsyncValue(value);

            stream.on('error', err => results.emit('error', err));
            results.write(stream);

            currentSyncValues.end();
            currentSyncValues = newSyncValuesStream();
        }

    });

    if (currentSyncValues !== null) {
        currentSyncValues.end();
    }

    results.on('error', (err) => console.log(err.stack));

    results.end();

    return results;

}
