export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPassword = (password: string): boolean => {
  return password.length >= 8;
};

export const isValidUsername = (username: string): boolean => {
  // Lowercase letters, numbers, and underscores only, 3-20 characters
  const usernameRegex = /^[a-z0-9_]{3,20}$/;
  return usernameRegex.test(username);
};

export const sanitizeUsername = (input: string): string => {
  // Remove @ symbol and force lowercase
  return input.replace('@', '').toLowerCase();
};

export const getUsernameError = (username: string): string | null => {
  if (!username) return null;

  if (username.length < 3) {
    return 'Must be at least 3 characters';
  }

  if (username.length > 20) {
    return 'Must be less than 20 characters';
  }

  if (!/^[a-z0-9_]+$/.test(username)) {
    return 'Only lowercase letters, numbers, and underscores';
  }

  return null;
};
