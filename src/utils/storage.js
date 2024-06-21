export const localStorageGetItem = (key, defaultValue = null) => {
  return JSON.parse(localStorage.getItem(key)) ?? defaultValue;
};
export const localStorageSetItem = (key, value) => {
  return localStorage.setItem(key, JSON.stringify(value));
};

export const localStorageRemoveItem = (key) => {
  return localStorage.removeItem(key);
};
