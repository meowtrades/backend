export const generateCustomId = (id?: string) => {
  const timestamp = Date.now();
  const secondId = id ? id : Math.floor(Math.random() * 1000);
  const randomId = Math.floor(Math.random() * 1000);
  return `request-${timestamp}-${randomId}-${secondId}`;
};
