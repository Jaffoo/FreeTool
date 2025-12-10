import React, { useState, useRef, useCallback, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import PptxGenJS from 'pptxgenjs';

const PdfToPptTool: React.FC = () => {
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [isConverting, setIsConverting] = useState<boolean>(false);
    const [convertProgress, setConvertProgress] = useState<number>(0);
    const [currentPage, setCurrentPage] = useState<number>(0);
    const [totalPages, setTotalPages] = useState<number>(0);
    const [errorMessage, setErrorMessage] = useState<string>('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    // 配置 PDF.js worker - 使用可靠的unpkg CDN
    useEffect(() => {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
    }, []);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            setErrorMessage('请选择PDF文件');
            return;
        }

        setPdfFile(file);
        setErrorMessage('');
        setConvertProgress(0);
        setCurrentPage(0);
        setTotalPages(0);
    }, []);

    const handleConvert = useCallback(async () => {
        if (!pdfFile) return;

        setIsConverting(true);
        setErrorMessage('');
        setConvertProgress(0);
        setCurrentPage(0);

        try {
            // 读取PDF文件
            const arrayBuffer = await pdfFile.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            const numPages = pdf.numPages;
            setTotalPages(numPages);

            // 创建PPT
            const pptx = new PptxGenJS();
            pptx.layout = 'LAYOUT_16x9';
            pptx.author = 'FreeTool PDF to PPT Converter';
            pptx.title = pdfFile.name.replace('.pdf', '');

            // 遍历每一页
            for (let pageNum = 1; pageNum <= numPages; pageNum++) {
                setCurrentPage(pageNum);

                // 获取页面
                const page = await pdf.getPage(pageNum);

                // 设置缩放比例以获得高质量图片
                const scale = 2.0;
                const viewport = page.getViewport({ scale });

                // 创建canvas
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                if (!context) {
                    throw new Error('无法创建canvas上下文');
                }

                canvas.width = viewport.width;
                canvas.height = viewport.height;

                // 渲染PDF页面到canvas
                await page.render({
                    canvasContext: context,
                    viewport: viewport,
                }).promise;

                // 将canvas转为图片base64
                const imageData = canvas.toDataURL('image/png');

                // 添加幻灯片
                const slide = pptx.addSlide();

                // 计算图片尺寸以适应幻灯片（保持宽高比）
                const slideWidth = 10; // 英寸
                const slideHeight = 5.625; // 英寸 (16:9)
                const imageAspectRatio = viewport.width / viewport.height;
                const slideAspectRatio = slideWidth / slideHeight;

                let imgWidth, imgHeight, imgX, imgY;

                if (imageAspectRatio > slideAspectRatio) {
                    // 图片更宽，按宽度适配
                    imgWidth = slideWidth;
                    imgHeight = slideWidth / imageAspectRatio;
                    imgX = 0;
                    imgY = (slideHeight - imgHeight) / 2;
                } else {
                    // 图片更高，按高度适配
                    imgHeight = slideHeight;
                    imgWidth = slideHeight * imageAspectRatio;
                    imgX = (slideWidth - imgWidth) / 2;
                    imgY = 0;
                }

                // 添加图片到幻灯片
                slide.addImage({
                    data: imageData,
                    x: imgX,
                    y: imgY,
                    w: imgWidth,
                    h: imgHeight,
                });

                // 更新进度
                const progress = Math.round((pageNum / numPages) * 100);
                setConvertProgress(progress);
            }

            // 生成并下载PPT
            const fileName = pdfFile.name.replace('.pdf', '.pptx');
            await pptx.writeFile({ fileName });

            setConvertProgress(100);
            setErrorMessage('');

        } catch (error) {
            console.error('转换失败:', error);
            setErrorMessage(`转换失败: ${error instanceof Error ? error.message : '未知错误'}`);
        } finally {
            setIsConverting(false);
        }
    }, [pdfFile]);

    const handleClearFile = useCallback(() => {
        setPdfFile(null);
        setErrorMessage('');
        setConvertProgress(0);
        setCurrentPage(0);
        setTotalPages(0);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, []);

    return (
        <div className="flex w-full flex-col items-center px-4 py-10 sm:px-6 lg:px-8">
            <div className="flex w-full max-w-4xl flex-col items-center gap-2 text-center mb-8">
                <p className="text-3xl font-black leading-tight tracking-tighter text-gray-900 dark:text-white sm:text-4xl">
                    PDF 转 PPT
                </p>
                <p className="text-base font-normal text-gray-500 dark:text-gray-400">
                    将PDF文件转换为PowerPoint演示文稿
                </p>
            </div>

            <div className="w-full max-w-4xl flex flex-col gap-6">
                {/* 上传区域 */}
                <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/20 shadow-sm p-6">
                    <div className="flex flex-col gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                选择PDF文件
                            </label>
                            <div className="flex gap-3">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".pdf,application/pdf"
                                    onChange={handleFileSelect}
                                    className="flex-1 text-sm text-gray-600 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-gray-900 hover:file:opacity-90"
                                />
                                {pdfFile && !isConverting && (
                                    <button
                                        onClick={handleClearFile}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
                                    >
                                        清除
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* 文件信息 */}
                        {pdfFile && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-3xl">
                                        picture_as_pdf
                                    </span>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                            {pdfFile.name}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                                            {totalPages > 0 && ` · ${totalPages} 页`}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 错误提示 */}
                        {errorMessage && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-red-600 dark:text-red-400">
                                        error
                                    </span>
                                    <p className="text-sm text-red-600 dark:text-red-400">
                                        {errorMessage}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* 转换按钮 */}
                        {pdfFile && !isConverting && convertProgress < 100 && (
                            <button
                                onClick={handleConvert}
                                disabled={isConverting}
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold shadow hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                            >
                                <span className="material-symbols-outlined text-xl">transform</span>
                                <span>开始转换</span>
                            </button>
                        )}

                        {/* 转换进度 */}
                        {isConverting && (
                            <>
                                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                                    <span>正在转换第 {currentPage} / {totalPages} 页...</span>
                                    <span>{convertProgress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div
                                        className="bg-primary h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${convertProgress}%` }}
                                    />
                                </div>
                            </>
                        )}

                        {/* 完成提示 */}
                        {convertProgress === 100 && !isConverting && (
                            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-green-600 dark:text-green-400">
                                        check_circle
                                    </span>
                                    <p className="text-sm text-green-600 dark:text-green-400">
                                        转换完成！PPT文件已自动下载
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 功能说明 */}
                <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/20 shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        功能说明
                    </h3>
                    <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-start gap-2">
                            <span className="material-symbols-outlined text-primary mt-0.5">check_circle</span>
                            <p>纯前端转换，无需上传到服务器，数据安全</p>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="material-symbols-outlined text-primary mt-0.5">check_circle</span>
                            <p>每个PDF页面将转换为一张高清图片并插入PPT</p>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="material-symbols-outlined text-primary mt-0.5">check_circle</span>
                            <p>自动适应16:9宽屏比例，保持原始页面宽高比</p>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="material-symbols-outlined text-primary mt-0.5">check_circle</span>
                            <p>支持任意页数的PDF文件转换</p>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="material-symbols-outlined text-yellow-500 mt-0.5">info</span>
                            <p className="text-yellow-600 dark:text-yellow-500">
                                <strong>注意：</strong>转换后的PPT中每页都是图片，不包含可编辑的文本
                            </p>
                        </div>
                    </div>
                </div>

                {/* 使用提示 */}
                {!pdfFile && (
                    <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 p-8">
                        <div className="flex flex-col items-center text-center gap-4">
                            <span className="material-symbols-outlined text-6xl text-gray-400 dark:text-gray-500">
                                upload_file
                            </span>
                            <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                                    上传您的PDF文件开始转换
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    支持任意大小的PDF文件，转换在浏览器本地完成
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PdfToPptTool;
