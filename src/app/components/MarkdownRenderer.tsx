'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import python from 'react-syntax-highlighter/dist/cjs/languages/prism/python';
import javascript from 'react-syntax-highlighter/dist/cjs/languages/prism/javascript';
import typescript from 'react-syntax-highlighter/dist/cjs/languages/prism/typescript';

// 注册语言
SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('typescript', typescript);

// 修改 CodeProps 接口，使 children 可选
interface CodeProps {
  className?: string;
  children?: React.ReactNode;
  inline?: boolean;
  [key: string]: any;
}

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <div className="prose prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // 直接使用函数组件，移除 React.memo
          code: ({ className, children, inline, ...props }: CodeProps) => {
            // 内联代码 - 使用正常的code标签，不全宽显示
            if (inline) {
              return (
                <code 
                  className={`bg-gray-800 text-gray-200 px-1.5 py-0.5 rounded text-sm ${className || ''}`} 
                  {...props}
                >
                  {children}
                </code>
              );
            }

            // 获取语言
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            
            // 确保代码内容是字符串
            const codeString = String(children).replace(/\n$/, '');
            
            // 使用状态管理复制功能
            const [copied, setCopied] = useState(false);
            
            const handleCopy = () => {
              navigator.clipboard.writeText(codeString);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            };

            return (
              <div className="relative group rounded-md overflow-hidden">
                <button
                  onClick={handleCopy}
                  className="absolute right-2 top-2 p-1 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                >
                  {copied ? '已复制!' : '复制'}
                </button>
                <div className="max-w-full overflow-x-auto">
                  <SyntaxHighlighter
                    language={language || 'text'}
                    style={oneDark as any} // 使用类型断言解决类型错误
                    customStyle={{
                      margin: 0,
                      borderRadius: '0.375rem',
                      backgroundColor: '#282c34', 
                    }}
                  >
                    {codeString}
                  </SyntaxHighlighter>
                </div>
              </div>
            );
          },
          
          // 简化其他组件的类型处理
          a: ({ children, ...props }: any) => (
            <a target="_blank" rel="noopener noreferrer" {...props}>
              {children}
            </a>
          ),
          
          img: ({ alt, ...props }: any) => (
            <img className="max-w-full h-auto" alt={alt || ''} {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer; 