// Server/utils/validators.js

function requireString(field, value, min = 1, max = 255) {
  if (typeof value !== "string") return `${field} must be a string`;
  const v = value.trim();
  if (v.length < min) return `${field} must be at least ${min} characters`;
  if (v.length > max) return `${field} must be at most ${max} characters`;
  return null;
}

function requireArray(field, value, min = 1, max = 100) {
  if (!Array.isArray(value)) return `${field} must be an array`;
  if (value.length < min) return `${field} must have at least ${min} item(s)`;
  if (value.length > max) return `${field} must have at most ${max} items`;
  return null;
}

function optionalArrayOfStrings(field, value) {
  if (value === undefined) return null;
  if (!Array.isArray(value)) return `${field} must be an array of strings`;
  for (const s of value) {
    if (typeof s !== "string" || !s.trim()) {
      return `${field} items must be non-empty strings`;
    }
  }
  return null;
}

function optionalObject(field, value) {
  if (value === undefined) return null;
  if (typeof value !== "object" || Array.isArray(value) || value === null) {
    return `${field} must be an object`;
  }
  return null;
}

function collectErrors(...checks) {
  return checks.filter(Boolean);
}

module.exports = {
  requireString,
  requireArray,
  optionalArrayOfStrings,
  optionalObject,
  collectErrors,
};
