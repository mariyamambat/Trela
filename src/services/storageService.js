export const uploadFile = async (userId, tripId, file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ url: reader.result, path: "" });
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};