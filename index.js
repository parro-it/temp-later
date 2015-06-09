'use strict';

import {Readable} from 'stream';

class TempLaterResult extends Readable {
    constructor(strings, substs) {
        super();
        this.strings = strings;
        this.substs = substs;
    }

    sendChunk(chunk) {
         
        this.push(chunk);

    }

    sendResult (data) {
        
        if (data === undefined) {
            data = '';
        }

        if (data === null) {
            data = '';
        }

        if (typeof data === 'number' || data instanceof Date) {
            
            data = data.toLocaleString();
            
        }

        if (typeof data === 'boolean' || data instanceof RegExp) {
            data = data.toString();
        }

        this.sendChunk(data);
        
    }

    _read () {
        if (this.resolving) {
            return;

        } else {
            
            if (this.strings.length === 0 && this.substs.length === 0) {
                this.sendChunk(null);
                return;
            }
        }

        const sendResult = this.sendResult.bind(this);
        

        // Retrieve the literal section preceding
        // the current substitution
        let lit = this.strings.shift();
        sendResult(lit);

        let subst = this.substs.shift();
        
        
        if (subst && subst.then) {
            this.resolving = true;
            
            subst
                .then(sendResult)
                .then(_ => this.resolving = false)
                .then(_ => setImmediate(_ => this._read()));

        } else if (subst instanceof Readable) {
            this.resolving = true;

            const forward = data => this.sendChunk(data || '');
            
            subst.on('data', forward);
            subst.once('end', _ => {
                this.resolving = false;
                subst.removeListener('data',forward);
                this._read();
            });

                
                
        } else {
            sendResult(subst);
            setImmediate(_ => this._read());
        }        

        
    }

    
}

import is from 'is';
import fromArray from 'stream-from-array';
import ss from 'stream-stream';

const stringer = value => value.toString();

export const handlers = {
    number: stringer,
    date: stringer,
    boolean: stringer,
    regexp: stringer,
};

export default function tempLater(strings, ...substs) {
    let results = ss();
    let currentValues = [];
    let handlerKeys = Object.keys();

    substs.forEach( (subst, idx) => {
        let string = strings[idx];



    });

    return new TempLaterResult(strings, substs);
}