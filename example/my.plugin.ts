const pluginForMethod = () => {
    return 'ABC';
};

export default {
    'Hello/World': {
        'member-function': {
            method: pluginForMethod,
            method3: () => 123,
            a: () => 11
        }
    },
    'Test': {
        'function': pluginForMethod
    }
}