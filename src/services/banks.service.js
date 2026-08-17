/**
 * Docs
 * @returns {} - Something.
 */
export async function parseBankFile(file) {
  // file.originalname contains the uploaded filename (e.g. "sprites.abk")
  // file.buffer contains the raw binary Buffer of the file for parsing
  const fileName = file.originalname;
  const fileBuffer = file.buffer;

  console.log("Received file:", fileName, "Size (bytes):", file.size);
  
  return fileName;
}
