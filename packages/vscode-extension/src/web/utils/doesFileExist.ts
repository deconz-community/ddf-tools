import {workspace, FileType, FileSystemError, Uri } from 'vscode';

export async function doesFileExist(uri: Uri, fileType = FileType.File): Promise<boolean> {
    try {
        const stat = await workspace.fs.stat(uri);
        return stat.type === fileType;
    } catch (error) {
        if (error instanceof FileSystemError && error.code === 'FileNotFound') {
            return false;
        }
        throw error;
    }
}
