/**
 * Image Crop and Rotate Utilities
 * 
 * Handles client-side image processing for cropping and rotating vehicle images.
 * Uses Canvas API for transformations with optimized quality settings.
 */

import type { Area } from "react-easy-crop";

/**
 * Create a cropped and rotated image from the source image
 * 
 * @param imageSrc - URL of the source image
 * @param pixelCrop - Crop area in pixels from react-easy-crop
 * @param rotation - Rotation angle in degrees (0, 90, 180, 270)
 * @param flip - Optional flip settings
 * @returns Promise resolving to a Blob of the processed image
 */
export async function createCroppedImage(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0,
  flip = { horizontal: false, vertical: false }
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  const rotRad = getRadianAngle(rotation);

  // Calculate bounding box of the rotated image
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation
  );

  // Set canvas size to match the bounding box
  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  // Translate canvas context to a central location to allow rotating and flipping around the center
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
  ctx.translate(-image.width / 2, -image.height / 2);

  // Draw rotated image
  ctx.drawImage(image, 0, 0);

  // Create a new canvas for the cropped image
  const croppedCanvas = document.createElement("canvas");
  const croppedCtx = croppedCanvas.getContext("2d");

  if (!croppedCtx) {
    throw new Error("Failed to get cropped canvas context");
  }

  // Set the size of the cropped canvas
  croppedCanvas.width = pixelCrop.width;
  croppedCanvas.height = pixelCrop.height;

  // Draw the cropped image
  croppedCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  // Return as a blob
  return new Promise<Blob>((resolve, reject) => {
    croppedCanvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to create blob from canvas"));
          return;
        }
        resolve(blob);
      },
      "image/jpeg",
      0.9 // High quality JPEG
    );
  });
}

/**
 * Create an Image element from a URL
 */
function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous"); // Needed for CORS
    image.src = url;
  });
}

/**
 * Convert degrees to radians
 */
function getRadianAngle(degreeValue: number): number {
  return (degreeValue * Math.PI) / 180;
}

/**
 * Calculate the new bounding area of a rotated rectangle
 */
function rotateSize(
  width: number,
  height: number,
  rotation: number
): { width: number; height: number } {
  const rotRad = getRadianAngle(rotation);

  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}

/**
 * Get image dimensions from a Blob
 */
export async function getImageDimensions(
  blob: Blob
): Promise<{ width: number; height: number }> {
  const url = URL.createObjectURL(blob);
  try {
    const image = await createImage(url);
    return {
      width: image.width,
      height: image.height,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

