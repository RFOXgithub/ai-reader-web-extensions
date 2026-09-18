function bytesToDataUrl(bytes, type) {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  return `data:${type};base64,${btoa(binary)}`;
}

export async function cropDataUrl(dataUrl, rect, viewport) {
  const sourceBlob = await (await fetch(dataUrl)).blob();
  const bitmap = await createImageBitmap(sourceBlob);
  const scaleX = bitmap.width / viewport.width, scaleY = bitmap.height / viewport.height;
  const sx = Math.max(0, Math.round(rect.x * scaleX)), sy = Math.max(0, Math.round(rect.y * scaleY));
  const sw = Math.min(bitmap.width - sx, Math.max(1, Math.round(rect.width * scaleX)));
  const sh = Math.min(bitmap.height - sy, Math.max(1, Math.round(rect.height * scaleY)));
  const canvas = new OffscreenCanvas(sw, sh);
  canvas.getContext("2d").drawImage(bitmap, sx, sy, sw, sh, 0, 0, sw, sh);
  bitmap.close();
  const blob = await canvas.convertToBlob({ type: "image/jpeg", quality: 0.86 });
  return bytesToDataUrl(new Uint8Array(await blob.arrayBuffer()), blob.type);
}
