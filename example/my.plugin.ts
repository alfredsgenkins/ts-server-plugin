const pluginForMethod = () => {
    return 'ABC';
};

export default {
    'Hello/World': {
        'member-function': {
            method: pluginForMethod
        }
    }
}