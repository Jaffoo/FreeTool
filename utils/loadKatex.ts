let katexLoaded = false;

export const loadKatex = async (): Promise<void> => {
  if (katexLoaded || typeof window === 'undefined') {
    return;
  }

  // 检查是否已经加载
  if ((window as any).katex) {
    katexLoaded = true;
    return;
  }

  // 动态加载 KaTeX 脚本
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = './libs/katex/katex.min.js';
    script.async = true;

    script.onload = () => {
      katexLoaded = true;
      resolve();
    };

    script.onerror = () => {
      reject(new Error('KaTeX 加载失败'));
    };

    document.head.appendChild(script);

    // 超时处理
    setTimeout(() => {
      if (!katexLoaded) {
        reject(new Error('KaTeX 加载超时'));
      }
    }, 10000);
  });
};
