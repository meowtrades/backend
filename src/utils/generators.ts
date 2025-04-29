export const generateCustomId = () => {
  const timestamp = Date.now();
  const randomNum = Math.floor(Math.random() * 10000);
  return `request-${timestamp}-${randomNum}`;
};
