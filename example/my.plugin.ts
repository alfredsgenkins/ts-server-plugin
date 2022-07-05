const pluginForMethod = () => {
    return 'ABC';
};

export default {
    'Hello/World': {
        'member-function': {
            method: pluginForMethod,
            method3: () => 123,
            a: () => 11,
            b: () => 11,
        }
    },
    'Wrong/Namespace': {
        'function': () => {}
    },
    'Test': {
        'function': pluginForMethod
    }
}
