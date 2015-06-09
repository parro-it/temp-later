'use strict';

import tempLater from '../index';
import concat  from 'concat-stream';
import {Readable} from 'stream';

describe('tempLater', () => {

    it('is defined', () => {
        tempLater.should.be.a('function');
    });

    it('support sync values', (done) => {
        const john= 'jude';
        const data= new Date().getFullYear();
        const result = tempLater`ciao ${john} come butta ${data}`;
        
        result.pipe(concat({encoding:'string'},function(data) {
            data.should.be.equal('ciao jude come butta 2015');    
            done();
        }));
        
    });

    it('support promise', (done) => {
        const john= 'jude';
        const data= new Promise((resolve, reject) => {
            setTimeout(_ => {
                resolve(new Date().getFullYear());
            });
        });
        const result = tempLater`ciao ${john} come butta ${data}`;
        
        result.pipe(concat({encoding:'string'},function(data) {
            data.should.be.equal('ciao jude come butta 2015');    
            done();
        }));
        
    });

    it('support multiple promises', (done) => {
        const john= new Promise((resolve, reject) => {
            setTimeout(_ => {
                resolve('jude');
            });
        });
        const data= new Promise((resolve, reject) => {
            setTimeout(_ => {
                resolve(new Date().getFullYear());
            });
        });
        const result = tempLater`ciao ${john} come butta ${data}`;
        
        result.pipe(concat({encoding:'string'},function(data) {
            data.should.be.equal('ciao jude come butta 2015');    
            done();
        }));
        
    });

/*
    it('support streams', (done) => {
        const john = new Readable();
        const jude = 'jude'.split('');
        console.log(jude.join('-'));
        john._read = () => {
            if (jude.length) {
                setTimeout( _ => {
                    let value = jude.shift();
                    console.log('mando '+ value);
                    john.push(value);
                    if (jude.length === 0) {
                        console.log('mando fine');
                        john.push(null);
                    }
                },10);        
            }
            
        };
        
        const data= new Date().getFullYear();
           
        const result = tempLater`ciao ${john} come butta ${data}`;
        
        result.pipe(concat({encoding:'string'},function(data) {
            data.should.be.equal('ciao jude come butta 2015');    
            done();
        }));
        
    });
*/


});
