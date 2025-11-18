import React, { useState, useCallback, useEffect, useRef } from 'react';

const JsonFormatterTool: React.FC = () => {
    const [inputText, setInputText] = useState<string>('');
    const [formattedText, setFormattedText] = useState<string>('');
    const [copySuccess, setCopySuccess] = useState<boolean>(false);
    const [isNotificationFadingOut, setIsNotificationFadingOut] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [indentSize, setIndentSize] = useState<number>(2);

    const formatTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // 自动格式化函数
    const performFormat = useCallback((text: string, indent: number) => {
        if (!text.trim()) {
            setFormattedText('');
            setError(null);
            return;
        }

        try {
            // 解析并格式化 JSON
            const parsed = JSON.parse(text);
            const formatted = JSON.stringify(parsed, null, indent);
            setFormattedText(formatted);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'JSON 格式错误');
            setFormattedText('');
        }
    }, []);

    // 输入文本或缩进大小变化时,延迟格式化
    useEffect(() => {
        if (formatTimeoutRef.current) {
            clearTimeout(formatTimeoutRef.current);
        }

        if (inputText.trim()) {
            formatTimeoutRef.current = setTimeout(() => {
                performFormat(inputText, indentSize);
            }, 300);
        } else {
            setFormattedText('');
            setError(null);
        }

        return () => {
            if (formatTimeoutRef.current) {
                clearTimeout(formatTimeoutRef.current);
            }
        };
    }, [inputText, indentSize, performFormat]);

    const handleCopy = useCallback(() => {
        if (!formattedText) return;
        navigator.clipboard.writeText(formattedText).then(() => {
            setCopySuccess(true);
            setIsNotificationFadingOut(false);
            // 1.7秒后开始淡出动画
            setTimeout(() => {
                setIsNotificationFadingOut(true);
            }, 1700);
            // 2秒后完全隐藏
            setTimeout(() => {
                setCopySuccess(false);
                setIsNotificationFadingOut(false);
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    }, [formattedText]);

    const handleCompress = useCallback(() => {
        if (!inputText.trim()) return;
        try {
            const parsed = JSON.parse(inputText);
            const compressed = JSON.stringify(parsed);
            setFormattedText(compressed);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'JSON 格式错误');
        }
    }, [inputText]);

    return (
        <div className="flex w-full flex-col items-center px-4 py-10 sm:px-6 lg:px-8">
            <div className="flex w-full max-w-6xl flex-col items-center gap-2 text-center mb-8">
                <p className="text-3xl font-black leading-tight tracking-tighter text-gray-900 dark:text-white sm:text-4xl">JSON 格式化工具</p>
                <p className="text-base font-normal text-gray-500 dark:text-gray-400">粘贴 JSON 数据,自动格式化或压缩。</p>
            </div>

            {/* 全局通知 - 固定在顶部中央 */}
            {copySuccess && (
                <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-50 ${isNotificationFadingOut ? 'animate-fade-out-up' : 'animate-fade-in-down'}`}>
                    <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
                        <span className="material-symbols-outlined text-xl">check_circle</span>
                        <span className="font-medium">已复制到剪贴板!</span>
                    </div>
                </div>
            )}

            <div className="w-full max-w-6xl rounded-xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-800/20 shadow-sm">
                <div className="grid grid-cols-1 lg:grid-cols-2">
                    {/* 左侧：原始 JSON */}
                    <div className="relative flex flex-col p-4 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-700/50">
                        <div className="flex items-center justify-between mb-3 min-h-[36px]">
                            <h3 className="text-gray-900 dark:text-white text-base font-semibold leading-normal flex items-center gap-2">
                                <span className="material-symbols-outlined text-xl">data_object</span>
                                原始 JSON
                            </h3>
                            <span className="text-xs text-gray-400 dark:text-gray-500">{inputText.length} 字符</span>
                        </div>
                        <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            className="flex-1 resize-none rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-gray-100 focus:outline-0 focus:ring-2 focus:ring-primary/20 focus:border-primary min-h-[400px] placeholder:text-gray-400 dark:placeholder:text-gray-500 p-4 text-sm leading-relaxed font-mono"
                            placeholder='在此处粘贴 JSON 数据...'
                        ></textarea>
                    </div>

                    {/* 右侧：格式化后的 JSON */}
                    <div className="relative flex flex-col p-4 bg-gray-50/50 dark:bg-gray-800/30">
                        <div className="flex justify-between items-start mb-3 min-h-[36px] gap-2">
                            <h3 className="text-gray-900 dark:text-white text-base font-semibold leading-normal flex items-center gap-2">
                                <span className="material-symbols-outlined text-xl">auto_awesome</span>
                                格式化后
                            </h3>
                            <div className="flex items-center gap-2">
                                <select
                                    value={indentSize}
                                    onChange={(e) => setIndentSize(Number(e.target.value))}
                                    className="text-xs px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                >
                                    <option value={2}>2 空格</option>
                                    <option value={4}>4 空格</option>
                                    <option value={8}>Tab</option>
                                </select>
                                <button
                                    onClick={handleCompress}
                                    disabled={!inputText}
                                    className="flex items-center gap-1 px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded text-xs font-medium hover:bg-orange-200 dark:hover:bg-orange-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                                >
                                    <span className="material-symbols-outlined text-sm">compress</span>
                                    压缩
                                </button>
                                <button
                                    onClick={handleCopy}
                                    disabled={!formattedText}
                                    className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded text-xs font-medium hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                                >
                                    <span className="material-symbols-outlined text-sm">content_copy</span>
                                    复制
                                </button>
                            </div>
                        </div>
                        {error && (
                            <div className="mb-2 p-2 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded text-xs text-red-600 dark:text-red-400">
                                <span className="material-symbols-outlined text-sm align-middle mr-1">error</span>
                                {error}
                            </div>
                        )}
                        <div className="relative bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 min-h-[400px] p-4 text-sm overflow-auto">
                            {formattedText ? (
                                <pre className="leading-relaxed text-gray-900 dark:text-gray-100 font-mono text-xs">{formattedText}</pre>
                            ) : !error ? (
                                <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
                                    <div className="text-center">
                                        <span className="material-symbols-outlined text-5xl mb-2 block opacity-50">code</span>
                                        <p className="text-sm">格式化后的 JSON 将显示在此处</p>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JsonFormatterTool;
