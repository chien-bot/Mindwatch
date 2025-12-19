/**
 * 视频临时存储 - 用于页面间传递视频 Blob 和演示文稿 ID
 * 使用全局变量而不是 sessionStorage，避免大文件存储限制
 */

interface TempVideoData {
  blob: Blob;
  presentationId: string;
}

let tempVideoData: TempVideoData | null = null;

export const setTempVideo = (blob: Blob, presentationId?: string) => {
  tempVideoData = {
    blob,
    presentationId: presentationId || '',
  };
};

export const getTempVideo = (): Blob | null => {
  return tempVideoData?.blob || null;
};

export const getTempVideoData = (): TempVideoData | null => {
  return tempVideoData;
};

export const clearTempVideo = () => {
  tempVideoData = null;
};
