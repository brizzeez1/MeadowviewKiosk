function encodeDrivePngToBase64(fileId) {
  const file = DriveApp.getFileById(fileId);
  const blob = file.getBlob();
  const b64 = Utilities.base64Encode(blob.getBytes());
  Logger.log("Base64 for " + file.getName() + ":\n" + b64);
  Logger.log("Length:", b64.length);
  return b64;
}
function encodeAppleTouchIcon() {
  encodeDrivePngToBase64("1ORYUVADHWoJtGfiKkYYJczX0NkKPWeB4");
}
