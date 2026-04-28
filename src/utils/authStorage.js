export const USERNAME_STORAGE_KEY = "trelaSignedInUsername";
export const LEGACY_USERNAME_STORAGE_KEY = "treloSignedInUsername";

export const getStoredUsername = () =>
  localStorage.getItem(USERNAME_STORAGE_KEY) || localStorage.getItem(LEGACY_USERNAME_STORAGE_KEY) || "";

export const clearStoredUsername = () => {
  localStorage.removeItem(USERNAME_STORAGE_KEY);
  localStorage.removeItem(LEGACY_USERNAME_STORAGE_KEY);
};
