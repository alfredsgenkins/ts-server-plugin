// Edit this file to trigger the TSServer commands.

/**
 * @namespace Hello/World
 * @extends me
 **/
class Abc {
    static method3() {
        return '123';
    }

    method3() {
        return '444';
    }

    a = () => {
        console.log(123);
    };

    method(a: string, b: number): string {
        return "Hello World" + b;
    }

    method2() {
        /** @namespace Test */
        const test = () => {};
        this.method("Hello", 2);
    }
}

new Abc()
