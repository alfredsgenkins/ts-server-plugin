// Edit this file to trigger the TSServer commands.

class Bca {
    method() {
        return 123;
    }
}

/**
 * @namespace Hello/World
 * @extends me
 **/
class Abc extends Bca {
    static method3() {
        return '123';
    }

    method3() {
        return '444';
    }

    a = () => {
        console.log(123);
    };

    method2() {
        /** @namespace Test */
        const test = () => {};
        this.method();
    }
}

new Abc()
