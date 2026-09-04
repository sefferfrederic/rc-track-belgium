/**
 * Compresse et redimensionne une image côté navigateur avant upload.
 * Réduit le temps d'envoi (upload) ET le poids stocké/téléchargé par chaque
 * visiteur ensuite. Redimensionne pour que le plus grand côté ne dépasse pas
 * maxDimension, et réencode en JPEG à la qualité donnée.
 *
 * En cas d'échec (navigateur trop ancien, erreur quelconque), retourne le
 * fichier original tel quel plutôt que de bloquer l'utilisateur.
 */
export function compressImage(file: File, maxDimension = 1600, quality = 0.82): Promise<File> {
  return new Promise((resolve) => {
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(file);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                resolve(file);
                return;
              }
              resolve(new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" }));
            },
            "image/jpeg",
            quality
          );
        };
        img.onerror = () => resolve(file);
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve(file);
      reader.readAsDataURL(file);
    } catch {
      resolve(file);
    }
  });
}
