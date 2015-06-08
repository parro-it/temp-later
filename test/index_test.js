'use strict';

import tempLater from '..';

describe('tempLater', () => {

    it('is defined', () => {
        tempLater.should.be.a('function');
    });

    it('support async', function *() {
        const result = yield Promise.resolve(tempLater());
        result.should.be.equal(42);
    });

});
