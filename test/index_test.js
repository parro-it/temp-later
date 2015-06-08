'use strict';

import temp-later from '..';

describe('temp-later', () => {

    it('is defined', () => {
        temp-later.should.be.a('function');
    });

    it('support async', function *() {
        const result = yield Promise.resolve(temp-later());
        result.should.be.equal(42);
    });

});
