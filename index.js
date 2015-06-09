'use strict';

import {PassThrough, Readable} from 'stream';
import is from 'is';
import ss from 'stream-stream';
import streamFromPromise from 'stream-from-promise';

const stringer = value => value.toString();
const identity = value => value;

export const syncHandlers = new Map();
export const asyncHandlers = new Map();

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

addAsyncHandler(isStream, identity);
addAsyncHandler(isPromise, streamFromPromise);


export default function tempLater(strings, ...substs) {
    let results = ss();
    let currentSyncValues = null;

    substs.forEach( (subst, idx) => {
        if (currentSyncValues === null) {
            currentSyncValues = new PassThrough();
            currentSyncValues.on('error', err => results.emit('error', err));
            results.write(currentSyncValues);
        }

        let string = strings[idx];
        currentSyncValues.write(string);


        for (let [when, handler] of syncHandlers) {
            if (when(subst)) {
                //console.log(`found sync handler ${handler.name} for value ${subst}`);
                subst = handler(subst);
                //console.log(`sync handler return ${typeof subst}`);
                break;
            }
        }

        if (typeof subst === 'string') {
            currentSyncValues.write(subst);

        } else {

            let stream = null;
            for (let [when, handler] of asyncHandlers) {
                if (when(subst)) {
                    //console.log(`found async handler ${handler.name} for value ${subst}`);
                    stream = handler(subst);
                    //console.log(`async handler return ${typeof stream}`);
                    break;
                }
            }
            if (stream !== null) {
                stream.on('error', err => results.emit('error', err));
                results.write(stream);
                currentSyncValues.end();
                currentSyncValues = null;

            } else {

                throw new Error('Handler not available for value ' + subst);
            }
        }

    });

    if (currentSyncValues !== null) {
        currentSyncValues.end();
    }

    results.on('error', (err) => console.log(err));

    results.end();

    return results;

}
