'use strict';

import {Readable} from 'stream';

class TempLaterResult extends Readable {
    constructor(strings, substs) {
        super();
        this.strings = strings;
        this.substs = substs;
    }

    sendChunk(chunk) {
        if (this.closed) {
            return;
        }
        if (chunk === null) {
            this.closed = true;
            console.log('fine stream');
        } else {
            console.dir('chunk:' + chunk);
        }

        this.push(chunk);


    }

    _read () {
        
        const sendResult = (data) => {
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

            this.sendChunk(lit);
            this.sendChunk(data);
            
            setImmediate(_ => this._read());
            
            return data; 
        }

        if (this.resolving) {
            return;

        } else {
            
            if (this.strings.length === 0) {
                console.log('chiudo')
                this.sendChunk(null);
            }
        }

        // Retrieve the literal section preceding
        // the current substitution
        let lit = this.strings.shift();
        let subst = this.substs.shift();

        if (subst && subst.then) {
            this.resolving = true;
            subst
                .then(sendResult)
                .then(data => this.resolving = false);

        } else if (subst instanceof Readable) {
            console.log('Readable')
            this.resolving = true;

            this.sendChunk(lit);
            const forward = data => this.sendChunk(data);
            
            subst.on('data', forward);
            subst.once('end', _ => {
                this.resolving = false;
                console.log('end input')
                subst.removeListener('data',forward);
                this._read();
            
            
            });

                
                
        } else {
            sendResult(subst);
            
        }        

        
    }

    
}

export default function tempLater(strings, ...substs) {
    return new TempLaterResult(strings, substs);
}