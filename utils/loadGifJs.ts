let gifJsLoaded = false;

export const loadGifJs = async (): Promise<void> => {
  if (gifJsLoaded || typeof window === 'undefined') {
    return;
  }

  // 检查是否已经加载
  if ((window as any).GIF) {
    gifJsLoaded = true;
    return;
  }

  // 动态加载 GIF.js 脚本
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = './libs/gif.js/gif.js';
    script.async = true;

    script.onload = () => {
      gifJsLoaded = true;
      resolve();
    };

    script.onerror = () => {
      reject(new Error('GIF.js 加载失败'));
    };

    document.head.appendChild(script);

    // 超时处理
    setTimeout(() => {
      if (!gifJsLoaded) {
        reject(new Error('GIF.js 加载超时'));
      }
    }, 10000);
  });
};
