let dataGridXLLoaded = false;

export const loadDataGridXL = async (): Promise<void> => {
  if (dataGridXLLoaded || typeof window === 'undefined') {
    return;
  }

  // 检查是否已经加载
  if ((window as any).DataGridXL) {
    dataGridXLLoaded = true;
    return;
  }

  // 动态加载 DataGridXL 脚本
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = './libs/datagridxl/datagridxl2.js';
    script.async = true;

    script.onload = () => {
      dataGridXLLoaded = true;
      resolve();
    };

    script.onerror = () => {
      reject(new Error('DataGridXL 加载失败'));
    };

    document.head.appendChild(script);

    // 超时处理
    setTimeout(() => {
      if (!dataGridXLLoaded) {
        reject(new Error('DataGridXL 加载超时'));
      }
    }, 10000);
  });
};
