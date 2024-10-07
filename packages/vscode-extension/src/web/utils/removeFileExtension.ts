export function removeFileExtension(filePath: string): string {
    const lastDotIndex = filePath.lastIndexOf('.');
    if (lastDotIndex === -1) {return filePath;} // Pas d'extension trouvée
    return filePath.substring(0, lastDotIndex);
}
