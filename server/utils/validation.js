const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NAME_PATTERN = /^[\p{L}][\p{L} .'-]*$/u;

export const PASSWORD_REQUIREMENTS =
  "Password must be 12-128 characters and include uppercase, lowercase, number, and special character";

export function validateRegistrationInput({ name, email, password } = {}) {
  if (
    typeof name !== "string" ||
    typeof email !== "string" ||
    typeof password !== "string"
  ) {
    return "Name, email, and password are required";
  }

  const trimmedName = name.trim();
  const trimmedEmail = email.trim().toLowerCase();

  if (
    trimmedName.length < 2 ||
    trimmedName.length > 80 ||
    !NAME_PATTERN.test(trimmedName)
  ) {
    return "Name must be 2-80 letters and may include spaces, apostrophes, periods, or hyphens";
  }

  if (trimmedEmail.length > 254 || !EMAIL_PATTERN.test(trimmedEmail)) {
    return "Please provide a valid email address";
  }

  if (
    password.length < 12 ||
    password.length > 128 ||
    !/[A-Z]/.test(password) ||
    !/[a-z]/.test(password) ||
    !/[0-9]/.test(password) ||
    !/[^\w\s]/.test(password)
  ) {
    return PASSWORD_REQUIREMENTS;
  }

  return null;
}

export function validatePrompt(prompt) {
  return typeof prompt === "string" && prompt.trim().length >= 3
    ? prompt.trim().slice(0, 12000)
    : null;
}
