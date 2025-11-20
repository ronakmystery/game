const cache = {};

export function setFBX(key, model) {
    cache[key] = model;
}

export function getFBX(key) {
    return cache[key] || null;
}
