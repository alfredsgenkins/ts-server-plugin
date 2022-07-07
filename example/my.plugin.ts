const pluginForMethod = () => {
    return 'ABC';
};

export default {
    'Hello/World': {
        'member-function': {
            method: pluginForMethod,
            method3: () => 123,
            a: () => 11,
            b: () => 11
        }
    },
    'Me/1': {
        'member-function': {
            method: pluginForMethod,
        }
    },
    'Wrong/Namespace': {
        'function': () => {}
    },
    'Test': {
        'function': pluginForMethod
    },
}
