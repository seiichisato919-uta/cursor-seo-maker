'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface ArticleWriterProps {
  articleData: any;
  onSaveArticle?: (articleData: any) => void;
}

interface H2Block {
  id: string;
  h2Title: string;
  h2Level: 'H2' | 'H3' | 'H4'; // 見出しレベル
  content: string; // H2とその直下のH3/H4を含むブロック全体
  h3s: Array<{ title: string; level: 'H3' | 'H4' }>; // H3/H4見出しのリスト
  writtenContent: string; // 執筆された内容
  editingInstruction: string; // 執筆の指示
  htmlContent: string; // HTML変換後の内容
  attachedFiles: File[]; // 添付ファイル
}

export default function ArticleWriter({ articleData, onSaveArticle }: ArticleWriterProps) {
  // articleIdを確実に保持するためのstate
  const [currentArticleId, setCurrentArticleId] = useState<string>(articleData?.articleId || `article-${Date.now()}`);
  
  const [h2Blocks, setH2Blocks] = useState<H2Block[]>([]);
  const [structure, setStructure] = useState(articleData?.structure || '');
  const [title, setTitle] = useState(articleData?.title || '');
  const [intro, setIntro] = useState('');
  const [description, setDescription] = useState('');
  const [writingLoading, setWritingLoading] = useState<{ [key: string]: boolean }>({});
  const [selectedText, setSelectedText] = useState<{ blockId: string; text: string; start: number; end: number } | null>(null);
  const [partEditingInstruction, setPartEditingInstruction] = useState('');
  const [partEditingLoading, setPartEditingLoading] = useState(false);
  const [htmlConverting, setHtmlConverting] = useState<{ [key: string]: boolean }>({});
  const [introHtmlConverting, setIntroHtmlConverting] = useState(false);
  const [introHtmlContent, setIntroHtmlContent] = useState('');
  const [internalLinkLoading, setInternalLinkLoading] = useState(false);
  const [salesLocationLoading, setSalesLocationLoading] = useState(false);
  const [introSalesSummaryLoading, setIntroSalesSummaryLoading] = useState(false);
  const [supervisorCommentLoading, setSupervisorCommentLoading] = useState(false);
  const textareaRefs = useRef<{ [key: string]: HTMLTextAreaElement | null }>({});
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // articleDataからデータを読み込む（記事一覧から選択した場合など）
  useEffect(() => {
    if (articleData) {
      const articleId = articleData.articleId || `article-${Date.now()}`;
      setCurrentArticleId(articleId);
      
      // まず、localStorageから保存されたデータを読み込む（自動保存データ）
      try {
        const savedDataKey = `seo-article-data-${articleId}`;
        const savedData = localStorage.getItem(savedDataKey);
        if (savedData) {
          const parsed = JSON.parse(savedData);
          // 保存されたデータを優先的に使用
          if (parsed.title) setTitle(parsed.title);
          if (parsed.structure) setStructure(parsed.structure);
          if (parsed.intro) setIntro(parsed.intro);
          if (parsed.introHtmlContent) setIntroHtmlContent(parsed.introHtmlContent);
          if (parsed.description) setDescription(parsed.description);
          if (parsed.h2Blocks && parsed.h2Blocks.length > 0) {
            // writtenContentが含まれているブロックの数を確認
            const blocksWithContent = parsed.h2Blocks.filter((block: any) => block.writtenContent && block.writtenContent.trim().length > 0);
            setH2Blocks(parsed.h2Blocks);
            
            // デバッグログ（常に表示）
            console.log(`[Load] ✅ Loaded h2Blocks (${blocksWithContent.length} blocks with content) from ${savedDataKey}`);
            if (blocksWithContent.length > 0) {
              console.log(`[Load] Sample writtenContent length:`, blocksWithContent[0].writtenContent.length);
              console.log(`[Load] Sample writtenContent (first 200 chars):`, blocksWithContent[0].writtenContent.substring(0, 200));
            } else {
              console.warn(`[Load] ⚠️ No blocks with content found in saved data`);
            }
          } else {
            console.warn(`[Load] ⚠️ No h2Blocks found in saved data from ${savedDataKey}`);
          }
        } else {
          // localStorageにデータがない場合は、articleDataから読み込む
          console.log(`[Load] ⚠️ No saved data found in localStorage, using articleData`);
          if (articleData.title) setTitle(articleData.title);
          if (articleData.structure) setStructure(articleData.structure);
          if (articleData.intro) setIntro(articleData.intro);
          if (articleData.introHtmlContent) setIntroHtmlContent(articleData.introHtmlContent);
          if (articleData.description) setDescription(articleData.description);
          if (articleData.h2Blocks && articleData.h2Blocks.length > 0) {
            const blocksWithContent = articleData.h2Blocks.filter((block: any) => block.writtenContent && block.writtenContent.trim().length > 0);
            setH2Blocks(articleData.h2Blocks);
            console.log(`[Load] Loaded ${blocksWithContent.length} blocks with content from articleData`);
          } else {
            console.warn(`[Load] ⚠️ No h2Blocks found in articleData`);
          }
        }
      } catch (error) {
        console.error('Error loading saved data:', error);
        // エラーが発生した場合は、articleDataから読み込む
        if (articleData.title) setTitle(articleData.title);
        if (articleData.structure) setStructure(articleData.structure);
        if (articleData.intro) setIntro(articleData.intro);
        if (articleData.introHtmlContent) setIntroHtmlContent(articleData.introHtmlContent);
        if (articleData.description) setDescription(articleData.description);
        if (articleData.h2Blocks && articleData.h2Blocks.length > 0) {
          setH2Blocks(articleData.h2Blocks);
        }
      }
    } else {
      // articleDataがnullの場合でも、currentArticleIdを使って保存されたデータを読み込む
      try {
        const savedDataKey = `seo-article-data-${currentArticleId}`;
        const savedData = localStorage.getItem(savedDataKey);
        if (savedData) {
          const parsed = JSON.parse(savedData);
          if (parsed.title) setTitle(parsed.title);
          if (parsed.structure) setStructure(parsed.structure);
          if (parsed.intro) setIntro(parsed.intro);
          if (parsed.introHtmlContent) setIntroHtmlContent(parsed.introHtmlContent);
          if (parsed.description) setDescription(parsed.description);
          if (parsed.h2Blocks && parsed.h2Blocks.length > 0) {
            const blocksWithContent = parsed.h2Blocks.filter((block: any) => block.writtenContent && block.writtenContent.trim().length > 0);
            setH2Blocks(parsed.h2Blocks);
            if (process.env.NODE_ENV === 'development') {
              console.log(`[Load] Loaded h2Blocks (${blocksWithContent.length} blocks with content) from ${savedDataKey} (no articleData)`);
            }
          }
        }
      } catch (error) {
        console.error('Error loading saved data (no articleData):', error);
      }
    }
  }, [articleData, currentArticleId]);

  // タイトルが変更されたときに自動保存（debounce付き）
  useEffect(() => {
    const articleId = currentArticleId || articleData?.articleId || `article-${Date.now()}`;
    
    // articleIdが設定されていない場合は、新規IDを生成して設定
    if (!currentArticleId && !articleData?.articleId) {
      setCurrentArticleId(articleId);
    }
    
    if (!title && !articleData?.articleId && h2Blocks.length === 0) return;
    
    const timeoutId = setTimeout(() => {
      try {
        const dataToSave = {
          ...articleData,
          articleId,
          title,
          structure,
          h2Blocks: h2Blocks.map(block => ({
            ...block,
            writtenContent: block.writtenContent || '', // writtenContentを確実に含める
            attachedFiles: [], // ファイルは保存しない
          })),
          intro,
          introHtmlContent,
          description,
          savedAt: new Date().toISOString(),
        };
        
        const saveKey = `seo-article-data-${articleId}`;
        const jsonString = JSON.stringify(dataToSave);
        localStorage.setItem(saveKey, jsonString);
        
        // 保存確認
        const savedData = localStorage.getItem(saveKey);
        if (savedData) {
          console.log(`[Auto-save] ✅ Saved title change to ${saveKey}`);
        }
      } catch (error: any) {
        console.error('[Auto-save] ❌ Error auto-saving title:', error);
        if (error.name === 'QuotaExceededError' || error.message?.includes('quota')) {
          console.error('[Auto-save] Storage quota exceeded.');
        }
      }
    }, 2000); // 2秒後に保存

    return () => clearTimeout(timeoutId);
  }, [title, articleData, h2Blocks, intro, introHtmlContent, description, structure, currentArticleId]);

  // H2ブロックが変更されたときに自動保存（debounce付き）
  useEffect(() => {
    // currentArticleIdを使用（確実に設定されている）
    const articleId = currentArticleId || articleData?.articleId || `article-${Date.now()}`;
    
    // articleIdが設定されていない場合は、新規IDを生成して設定
    if (!currentArticleId && !articleData?.articleId) {
      setCurrentArticleId(articleId);
    }
    
    // 執筆内容があるブロックがある場合のみ保存
    const blocksWithContent = h2Blocks.filter(block => block.writtenContent && block.writtenContent.trim().length > 0);
    if (blocksWithContent.length === 0 && !title && !structure) {
      // 何も内容がない場合は保存しない
      return;
    }
    
    const timeoutId = setTimeout(() => {
      try {
        const dataToSave = {
          ...articleData,
          articleId,
          title,
          structure,
          h2Blocks: h2Blocks.map(block => ({
            ...block,
            writtenContent: block.writtenContent || '', // writtenContentを確実に含める
            attachedFiles: [], // ファイルは保存しない
          })),
          intro,
          introHtmlContent,
          description,
          savedAt: new Date().toISOString(),
        };
        
        // articleIdに基づいて保存
        const saveKey = `seo-article-data-${articleId}`;
        const jsonString = JSON.stringify(dataToSave);
        
        // 保存前にデータサイズを確認
        const dataSize = new Blob([jsonString]).size;
        const maxSize = 5 * 1024 * 1024; // 5MB制限
        
        if (dataSize > maxSize) {
          console.warn(`[Auto-save] Data size (${(dataSize / 1024 / 1024).toFixed(2)}MB) exceeds limit, skipping save`);
          return;
        }
        
        localStorage.setItem(saveKey, jsonString);
        
        // 保存されたデータを確認
        const savedData = localStorage.getItem(saveKey);
        if (savedData) {
          const parsed = JSON.parse(savedData);
          const savedBlocksWithContent = parsed.h2Blocks?.filter((b: any) => b.writtenContent && b.writtenContent.trim().length > 0) || [];
          console.log(`[Auto-save] ✅ Saved successfully: ${savedBlocksWithContent.length} blocks with content to ${saveKey}`);
          if (savedBlocksWithContent.length > 0) {
            console.log(`[Auto-save] Sample writtenContent length:`, savedBlocksWithContent[0].writtenContent.length);
          }
        } else {
          console.error(`[Auto-save] ❌ Failed to verify saved data for ${saveKey}`);
        }
      } catch (error: any) {
        console.error('[Auto-save] ❌ Error auto-saving h2Blocks:', error);
        // localStorageの容量制限エラーの場合
        if (error.name === 'QuotaExceededError' || error.message?.includes('quota')) {
          console.error('[Auto-save] Storage quota exceeded. Please delete old articles.');
          // アラートは頻繁に出ると煩わしいので、コンソールログのみ
        }
      }
    }, 2000); // 2秒後に保存（1秒から2秒に延長して、頻繁な保存を抑制）

    return () => clearTimeout(timeoutId);
  }, [h2Blocks, articleData, title, intro, introHtmlContent, description, structure, currentArticleId]);

  // 導入文とディスクリプションが変更されたときに自動保存（debounce付き）
  useEffect(() => {
    const articleId = currentArticleId || articleData?.articleId || `article-${Date.now()}`;
    
    // articleIdが設定されていない場合は、新規IDを生成して設定
    if (!currentArticleId && !articleData?.articleId) {
      setCurrentArticleId(articleId);
    }
    
    if (!intro && !description && !introHtmlContent) return;
    
    const timeoutId = setTimeout(() => {
      try {
        const dataToSave = {
          ...articleData,
          articleId,
          title,
          structure,
          h2Blocks: h2Blocks.map(block => ({
            ...block,
            writtenContent: block.writtenContent || '', // writtenContentを確実に含める
            attachedFiles: [], // ファイルは保存しない
          })),
          intro,
          introHtmlContent,
          description,
          savedAt: new Date().toISOString(),
        };
        
        const saveKey = `seo-article-data-${articleId}`;
        const jsonString = JSON.stringify(dataToSave);
        localStorage.setItem(saveKey, jsonString);
        
        // 保存確認
        const savedData = localStorage.getItem(saveKey);
        if (savedData) {
          console.log(`[Auto-save] ✅ Saved intro/description change to ${saveKey}`);
        }
      } catch (error: any) {
        console.error('[Auto-save] ❌ Error auto-saving intro/description:', error);
        if (error.name === 'QuotaExceededError' || error.message?.includes('quota')) {
          console.error('[Auto-save] Storage quota exceeded.');
        }
      }
    }, 2000); // 2秒後に保存

    return () => clearTimeout(timeoutId);
  }, [intro, introHtmlContent, description, articleData, title, h2Blocks, structure, currentArticleId]);

  // 記事構成を解析してH2ブロックに分割
  useEffect(() => {
    if (structure) {
      // 既存のh2BlocksのwrittenContentを保持しながら、新しいブロック構造を作成
      setH2Blocks(prevBlocks => {
        const newBlocks = parseStructureToH2Blocks(structure);
        
        // 既存のブロックのwrittenContentを新しいブロックにマージ
        const mergedBlocks = newBlocks.map(newBlock => {
          // 同じh2Titleを持つ既存のブロックを探す
          const existingBlock = prevBlocks.find(prev => prev.h2Title === newBlock.h2Title);
          if (existingBlock && existingBlock.writtenContent) {
            // 既存のwrittenContentを保持
            return {
              ...newBlock,
              writtenContent: existingBlock.writtenContent,
              editingInstruction: existingBlock.editingInstruction || newBlock.editingInstruction,
              htmlContent: existingBlock.htmlContent || newBlock.htmlContent,
            };
          }
          return newBlock;
        });
        
        console.log(`[Structure Parse] Merged ${mergedBlocks.length} blocks, preserving writtenContent from ${prevBlocks.filter(b => b.writtenContent).length} existing blocks`);
        
        return mergedBlocks;
      });
    }
  }, [structure]);

  // 記事構成をH2ブロックに分割する関数
  const parseStructureToH2Blocks = (structure: string): H2Block[] => {
    const lines = structure.split('\n');
    const blocks: H2Block[] = [];
    let currentBlock: H2Block | null = null;
    let currentH3s: Array<{ title: string; level: 'H3' | 'H4' }> = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // H2見出しを検出（## または H2: など）
      if (line.match(/^##\s+(.+)$/) || line.match(/^H2[:：]\s*(.+)$/i) || line.match(/^##\s*H2[:：]\s*(.+)$/i)) {
        // 前のブロックを保存
        if (currentBlock) {
          currentBlock.h3s = currentH3s;
          blocks.push(currentBlock);
        }
        
        // 新しいブロックを作成
        const h2Title = line.replace(/^##\s*H2[:：]\s*/i, '').replace(/^##\s*/, '').replace(/^H2[:：]\s*/i, '').trim();
        currentBlock = {
          id: `block-${blocks.length}`,
          h2Title,
          h2Level: 'H2',
          content: line + '\n',
          h3s: [],
          writtenContent: '',
          editingInstruction: '',
          htmlContent: '',
          attachedFiles: [],
        };
        currentH3s = [];
      } 
      // H3見出しを検出（### または H3: など）
      else if (line.match(/^###\s+(.+)$/) || line.match(/^H3[:：]\s*(.+)$/i) || line.match(/^-\s*(.+)$/)) {
        if (currentBlock) {
          const h3Title = line.replace(/^###\s*/, '').replace(/^H3[:：]\s*/i, '').replace(/^-\s*/, '').trim();
          currentH3s.push({ title: h3Title, level: 'H3' });
          currentBlock.content += line + '\n';
        }
      }
      // H4見出しを検出（#### または H4: など）
      else if (line.match(/^####\s+(.+)$/) || line.match(/^H4[:：]\s*(.+)$/i)) {
        if (currentBlock) {
          const h4Title = line.replace(/^####\s*/, '').replace(/^H4[:：]\s*/i, '').trim();
          currentH3s.push({ title: h4Title, level: 'H4' });
          currentBlock.content += line + '\n';
        }
      }
      // その他の行（説明文など）
      else if (line && currentBlock) {
        currentBlock.content += line + '\n';
      }
    }

    // 最後のブロックを保存
    if (currentBlock) {
      currentBlock.h3s = currentH3s;
      blocks.push(currentBlock);
    }

    return blocks;
  };

  // H2ブロックの執筆を実行
  const handleWriteBlock = useCallback(async (blockId: string) => {
    const block = h2Blocks.find(b => b.id === blockId);
    if (!block) return;

    setWritingLoading({ ...writingLoading, [blockId]: true });

    try {
      // 添付ファイルをBase64に変換
      const fileDataPromises = block.attachedFiles.map(async (file) => {
        return new Promise<{ name: string; content: string; type: string }>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            resolve({
              name: file.name,
              content: reader.result as string,
              type: file.type,
            });
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      const fileData = await Promise.all(fileDataPromises);

      // 削除されたH3を除外（現在のh3sのみを送信）
      const currentH3s = block.h3s.map(h => h.title).filter(title => title.trim().length > 0);

      const response = await fetch('/api/generate-writing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          h2Block: block.h2Title,
          h3s: currentH3s, // 現在存在するH3のみを送信
          keyword: articleData.mainKeyword,
          targetReader: articleData.targetReader,
          searchIntent: articleData.searchIntent,
          structure: structure,
          mediaExample: articleData.mediaExample,
          editingInstruction: block.editingInstruction,
          attachedFiles: fileData,
        }),
      });

      // レスポンスのContent-Typeを確認
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text.substring(0, 500));
        throw new Error(`サーバーエラーが発生しました。レスポンスがJSON形式ではありません。ステータス: ${response.status}`);
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `記事の執筆に失敗しました（ステータス: ${response.status}）`);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      // 執筆された内容を更新
      setH2Blocks(prevBlocks => {
        const updatedBlocks = prevBlocks.map(b =>
          b.id === blockId ? { ...b, writtenContent: data.content || '' } : b
        );
        
        // 執筆完了後、即座に保存（自動保存を待たない）
        try {
          const articleId = articleData.articleId || currentArticleId || `article-${Date.now()}`;
          const blocksWithContent = updatedBlocks.filter(block => block.writtenContent && block.writtenContent.trim().length > 0);
          
          const dataToSave = {
            ...articleData,
            articleId,
            title,
            structure,
            h2Blocks: updatedBlocks.map(block => ({
              ...block,
              writtenContent: block.writtenContent || '',
              attachedFiles: [], // ファイルは保存しない
            })),
            intro,
            introHtmlContent,
            description,
            savedAt: new Date().toISOString(),
          };
          
          const saveKey = `seo-article-data-${articleId}`;
          localStorage.setItem(saveKey, JSON.stringify(dataToSave));
          console.log(`[Write] Immediately saved block ${blockId} with ${data.content?.length || 0} characters to ${saveKey}`);
        } catch (saveError) {
          console.error('[Write] Error saving immediately after writing:', saveError);
        }
        
        return updatedBlocks;
      });
    } catch (error: any) {
      console.error('Error writing block:', error);
      alert(error.message || '記事の執筆に失敗しました');
    } finally {
      setWritingLoading({ ...writingLoading, [blockId]: false });
    }
  }, [h2Blocks, articleData, writingLoading]);

  // テキスト選択を検知
  const handleTextSelection = (blockId: string) => {
    const textarea = textareaRefs.current[blockId];
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.substring(start, end);

    if (selected.trim().length > 0) {
      setSelectedText({ blockId, text: selected, start, end });
    } else {
      setSelectedText(null);
    }
  };

  // 選択部分の編集を実行
  const handleEditSelectedPart = useCallback(async () => {
    if (!selectedText || !partEditingInstruction.trim()) {
      alert('編集指示を入力してください');
      return;
    }

    setPartEditingLoading(true);

    try {
      const block = h2Blocks.find(b => b.id === selectedText.blockId);
      if (!block) return;

      // 選択部分の編集APIを呼び出す
      const response = await fetch('/api/edit-writing-part', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedText: selectedText.text,
          editingInstruction: partEditingInstruction,
          fullContent: block.writtenContent,
          blockData: {
            h2Title: block.h2Title,
            h3s: block.h3s.map(h => h.title),
          },
          articleData: {
            mainKeyword: articleData.mainKeyword,
            targetReader: articleData.targetReader,
            searchIntent: articleData.searchIntent,
            structure: structure,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '選択部分の編集に失敗しました');
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      // 編集された部分で元の選択部分を置き換える
      if (data.editedText) {
        const beforeText = block.writtenContent.substring(0, selectedText.start);
        const afterText = block.writtenContent.substring(selectedText.end);
        const newContent = beforeText + data.editedText + afterText;
        
        setH2Blocks(prevBlocks =>
          prevBlocks.map(b =>
            b.id === selectedText.blockId ? { ...b, writtenContent: newContent } : b
          )
        );
        
        // 選択をクリア
        setSelectedText(null);
        setPartEditingInstruction('');
        
        // テキストエリアのフォーカスを維持
        if (textareaRefs.current[selectedText.blockId]) {
          const newCursorPos = selectedText.start + data.editedText.length;
          setTimeout(() => {
            textareaRefs.current[selectedText.blockId]?.setSelectionRange(newCursorPos, newCursorPos);
            textareaRefs.current[selectedText.blockId]?.focus();
          }, 0);
        }
      }
    } catch (error: any) {
      console.error('Error editing selected part:', error);
      alert(error.message || '選択部分の編集に失敗しました');
    } finally {
      setPartEditingLoading(false);
    }
  }, [selectedText, partEditingInstruction, h2Blocks, articleData, structure]);

  // HTMLコードだけを抽出する関数
  const extractHtmlCode = (responseText: string): string => {
    // HTMLコードブロック（```html ... ```）を抽出
    const htmlBlockMatch = responseText.match(/```html\s*([\s\S]*?)\s*```/);
    if (htmlBlockMatch) {
      return htmlBlockMatch[1].trim();
    }
    
    // HTMLコードブロック（``` ... ```）を抽出（html指定なしの場合）
    const codeBlockMatch = responseText.match(/```\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      return codeBlockMatch[1].trim();
    }
    
    // HTMLタグが含まれている場合は、その部分を抽出
    const htmlTagMatch = responseText.match(/(<!--[\s\S]*?-->[\s\S]*?)(?:# WordPress|## ✅|## 📝|---|$)/);
    if (htmlTagMatch) {
      return htmlTagMatch[1].trim();
    }
    
    // 上記のパターンに一致しない場合は、元のテキストを返す
    return responseText.trim();
  };

  // HTML変換を実行
  const handleConvertToHtml = useCallback(async (blockId: string) => {
    const block = h2Blocks.find(b => b.id === blockId);
    if (!block || !block.writtenContent) {
      alert('執筆内容がありません');
      return;
    }

    setHtmlConverting(prev => ({ ...prev, [blockId]: true }));

    try {
      const response = await fetch('/api/convert-to-wordpress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          article: block.writtenContent,
          content: block.writtenContent,
          structure: block.content,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'HTML変換に失敗しました');
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      // HTMLコードだけを抽出
      const rawHtml = data.html || data.wordpressHtml || '';
      const extractedHtml = extractHtmlCode(rawHtml);

      // HTML変換後の内容を更新
      setH2Blocks(prevBlocks =>
        prevBlocks.map(b =>
          b.id === blockId ? { ...b, htmlContent: extractedHtml } : b
        )
      );
    } catch (error: any) {
      console.error('Error converting to HTML:', error);
      alert(error.message || 'HTML変換に失敗しました');
    } finally {
      setHtmlConverting(prev => ({ ...prev, [blockId]: false }));
    }
  }, [h2Blocks]);

  // 導入文のHTML変換を実行
  const handleConvertIntroToHtml = useCallback(async () => {
    if (!intro || intro.trim().length === 0) {
      alert('導入文がありません');
      return;
    }

    setIntroHtmlConverting(true);

    try {
      const response = await fetch('/api/convert-to-wordpress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          article: intro,
          content: intro,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'HTML変換に失敗しました');
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      // HTMLコードだけを抽出
      const rawHtml = data.html || data.wordpressHtml || '';
      const extractedHtml = extractHtmlCode(rawHtml);
      setIntroHtmlContent(extractedHtml);
    } catch (error: any) {
      console.error('Error converting intro to HTML:', error);
      alert(error.message || 'HTML変換に失敗しました');
    } finally {
      setIntroHtmlConverting(false);
    }
  }, [intro]);

  // HTMLをクリップボードにコピーする関数
  const handleCopyHtml = useCallback(async (htmlContent: string) => {
    try {
      await navigator.clipboard.writeText(htmlContent);
      alert('HTMLをクリップボードにコピーしました');
    } catch (error) {
      console.error('Failed to copy HTML:', error);
      alert('HTMLのコピーに失敗しました');
    }
  }, []);

  // 内部リンクを提案してもらう
  const handleGenerateInternalLinks = useCallback(async () => {
    setInternalLinkLoading(true);
    console.log('[Internal Links] Starting internal link generation...');
    try {
      // 執筆内容があるH2ブロックのみを送信
      // 既に内部リンクが含まれているブロックはスキップ
      const blocksWithContent = h2Blocks.filter(block => {
        if (!block.writtenContent || block.writtenContent.trim().length === 0) {
          return false;
        }
        // 既に内部リンクが含まれている場合はスキップ
        const hasInternalLink = block.writtenContent.includes('参考記事：') || block.writtenContent.includes('参考記事:');
        return !hasInternalLink;
      });
      console.log(`[Internal Links] Found ${blocksWithContent.length} blocks with content (excluding already processed blocks)`);
      
      if (blocksWithContent.length === 0) {
        alert('すべてのブロックに内部リンクが追加済みです。または、執筆内容がありません。');
        setInternalLinkLoading(false);
        return;
      }

      console.log('[Internal Links] Sending request to API...');
      const response = await fetch('/api/generate-internal-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          h2Blocks: blocksWithContent.map(block => ({
            id: block.id,
            h2Title: block.h2Title,
            h3s: block.h3s,
            writtenContent: block.writtenContent,
          })),
        }),
      });

      // レスポンスのContent-Typeを確認
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text.substring(0, 500));
        throw new Error(`サーバーエラーが発生しました。レスポンスがJSON形式ではありません。ステータス: ${response.status}`);
      }

      const data = await response.json();
      console.log('[Internal Links] Received API response:', {
        ok: response.ok,
        status: response.status,
        hasH2BlocksWithLinks: !!data.h2BlocksWithLinks,
        h2BlocksWithLinksKeys: data.h2BlocksWithLinks ? Object.keys(data.h2BlocksWithLinks) : [],
        dataKeys: Object.keys(data),
      });
      
      if (!response.ok) {
        throw new Error(data.error || `内部リンクの生成に失敗しました（ステータス: ${response.status}）`);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      // H2ブロックごとに内部リンクが挿入された内容を取得
      if (data.h2BlocksWithLinks) {
        // デバッグログを追加
        console.log('[Internal Links] Received h2BlocksWithLinks:', data.h2BlocksWithLinks);
        Object.keys(data.h2BlocksWithLinks).forEach(blockId => {
          const content = data.h2BlocksWithLinks[blockId];
          const hasInternalLink = content.includes('参考記事：') || content.includes('参考記事:');
          console.log(`[Internal Links] Block ${blockId} - Content length: ${content.length}`);
          console.log(`[Internal Links] Block ${blockId} - Has internal link: ${hasInternalLink}`);
          console.log(`[Internal Links] Block ${blockId} - Content preview (first 500 chars):`, content.substring(0, 500));
        });
        
        // 各H2ブロックの執筆内容を更新
        setH2Blocks(prevBlocks => {
          const updatedBlocks = prevBlocks.map(block => {
            const updatedContent = data.h2BlocksWithLinks[block.id];
            if (updatedContent) {
              console.log(`[Internal Links] Updating block ${block.id} with new content`);
              return { ...block, writtenContent: updatedContent };
            }
            console.log(`[Internal Links] Block ${block.id} - No updated content found`);
            return block;
          });
          
          // 内部リンク追加後、即座に保存（自動保存を待たない）
          try {
            const articleId = articleData.articleId || currentArticleId || `article-${Date.now()}`;
            const blocksWithContent = updatedBlocks.filter(block => block.writtenContent && block.writtenContent.trim().length > 0);
            
            const dataToSave = {
              ...articleData,
              articleId,
              title,
              structure,
              h2Blocks: updatedBlocks.map(block => ({
                ...block,
                writtenContent: block.writtenContent || '',
                attachedFiles: [], // ファイルは保存しない
              })),
              intro,
              introHtmlContent,
              description,
              savedAt: new Date().toISOString(),
            };
            
            const saveKey = `seo-article-data-${articleId}`;
            localStorage.setItem(saveKey, JSON.stringify(dataToSave));
            console.log(`[Internal Links] Immediately saved ${blocksWithContent.length} blocks with content to ${saveKey}`);
          } catch (saveError) {
            console.error('[Internal Links] Error saving immediately after adding links:', saveError);
          }
          
          return updatedBlocks;
        });
        
        // 残りのブロックがある場合は、次のブロックを処理する
        const processedBlockIds = Object.keys(data.h2BlocksWithLinks);
        const remainingBlocks = blocksWithContent.filter(block => !processedBlockIds.includes(block.id));
        
        if (remainingBlocks.length > 0) {
          console.log(`Processed ${processedBlockIds.length} blocks, ${remainingBlocks.length} remaining. Please click the button again to process remaining blocks.`);
          alert(`${processedBlockIds.length}個のブロックに内部リンクを追加しました。\n残り${remainingBlocks.length}個のブロックがあります。\n「内部リンクを提案してもらう」ボタンを再度押して、残りのブロックを処理してください。`);
        } else {
          alert('すべてのブロックに内部リンクを追加しました！');
        }
      } else if (data.articleWithLinks || data.internalLinks) {
        // 後方互換性：記事全体が返された場合
        alert('内部リンクが生成されましたが、H2ブロックごとの処理が必要です。');
      } else {
        alert('内部リンクの提案が生成されませんでした');
      }
    } catch (error: any) {
      console.error('Error generating internal links:', error);
      alert(error.message || '内部リンクの生成に失敗しました');
    } finally {
      setInternalLinkLoading(false);
    }
  }, [h2Blocks]);

  // 特定のH2ブロックに対して内部リンクを提案してもらう
  const handleGenerateInternalLinksForBlock = useCallback(async (blockId: string) => {
    const block = h2Blocks.find(b => b.id === blockId);
    console.log(`[Internal Links] Button clicked for block ${blockId}`, {
      blockFound: !!block,
      hasContent: !!(block?.writtenContent),
      contentLength: block?.writtenContent?.length || 0,
      contentPreview: block?.writtenContent?.substring(0, 100) || 'N/A',
    });
    
    if (!block || !block.writtenContent || block.writtenContent.trim().length === 0) {
      alert('執筆内容がありません。まず記事を執筆してください。');
      return;
    }
    
    // 既に内部リンクが含まれている場合はスキップ
    const hasInternalLink = block.writtenContent.includes('参考記事：') || block.writtenContent.includes('参考記事:');
    if (hasInternalLink) {
      alert('このブロックには既に内部リンクが追加されています。');
      return;
    }
    
    setInternalLinkLoading(true);
    console.log(`[Internal Links] Starting internal link generation for block ${blockId}...`);
    try {
      const response = await fetch('/api/generate-internal-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          h2Blocks: [{
            id: block.id,
            h2Title: block.h2Title,
            h3s: block.h3s,
            writtenContent: block.writtenContent,
          }],
        }),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text.substring(0, 500));
        throw new Error(`サーバーエラーが発生しました。レスポンスがJSON形式ではありません。ステータス: ${response.status}`);
      }

      const data = await response.json();
      console.log(`[Internal Links] Received API response for block ${blockId}:`, {
        ok: response.ok,
        status: response.status,
        hasH2BlocksWithLinks: !!data.h2BlocksWithLinks,
      });
      
      // API側のログ情報をフロントエンドでも確認できるように
      if (data.debugInfo) {
        console.log(`[Internal Links] API Debug Info:`, data.debugInfo);
      }
      
      if (!response.ok) {
        throw new Error(data.error || `内部リンクの生成に失敗しました（ステータス: ${response.status}）`);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.h2BlocksWithLinks && data.h2BlocksWithLinks[blockId]) {
        const updatedContent = data.h2BlocksWithLinks[blockId];
        const originalContent = block.writtenContent || '';
        
        // デバッグログ：APIレスポンスの内容を確認
        console.log(`[Internal Links] Block ${blockId} - Original content length: ${originalContent.length}`);
        console.log(`[Internal Links] Block ${blockId} - Updated content length: ${updatedContent.length}`);
        console.log(`[Internal Links] Block ${blockId} - Updated content preview (first 500 chars):`, updatedContent.substring(0, 500));
        console.log(`[Internal Links] Block ${blockId} - Updated content contains "参考記事：": ${updatedContent.includes('参考記事：')}`);
        console.log(`[Internal Links] Block ${blockId} - Updated content contains "参考記事:": ${updatedContent.includes('参考記事:')}`);
        console.log(`[Internal Links] Block ${blockId} - Content changed: ${updatedContent !== originalContent}`);
        
        // 内部リンクが含まれているか確認
        const hasInternalLink = updatedContent.includes('参考記事：') || updatedContent.includes('参考記事:');
        if (!hasInternalLink) {
          console.warn(`[Internal Links] Block ${blockId} - WARNING: API returned content but no internal links found!`);
          console.warn(`[Internal Links] Block ${blockId} - This might mean Gemini API did not generate internal links.`);
        }
        
        console.log(`[Internal Links] Updating block ${blockId} with new content`);
        
        setH2Blocks(prevBlocks => {
          const updatedBlocks = prevBlocks.map(b =>
            b.id === blockId ? { ...b, writtenContent: updatedContent } : b
          );
          
          // 内部リンク追加後、即座に保存
          try {
            const articleId = articleData.articleId || currentArticleId || `article-${Date.now()}`;
            const dataToSave = {
              ...articleData,
              articleId,
              title,
              structure,
              h2Blocks: updatedBlocks.map(block => ({
                ...block,
                writtenContent: block.writtenContent || '',
                attachedFiles: [],
              })),
              intro,
              introHtmlContent,
              description,
              savedAt: new Date().toISOString(),
            };
            const saveKey = `seo-article-data-${articleId}`;
            localStorage.setItem(saveKey, JSON.stringify(dataToSave));
            console.log(`[Internal Links] Immediately saved block ${blockId} to ${saveKey}`);
          } catch (saveError) {
            console.error('[Internal Links] Error saving:', saveError);
          }
          
          return updatedBlocks;
        });
        
        alert('内部リンクを追加しました。');
      } else {
        alert('内部リンクの提案が生成されませんでした');
      }
    } catch (error: any) {
      console.error('Error generating internal links:', error);
      alert(error.message || '内部リンクの生成に失敗しました');
    } finally {
      setInternalLinkLoading(false);
    }
  }, [h2Blocks, articleData, currentArticleId, title, structure, intro, introHtmlContent, description]);

  // セールス箇所を提案してもらう
  const handleGenerateSalesLocations = useCallback(async () => {
    setSalesLocationLoading(true);
    try {
      // 執筆内容があるH2ブロックのみを送信
      // 既に「※ここにセールス文を書く」が含まれているブロックはスキップ
      const blocksWithContent = h2Blocks.filter(block => {
        if (!block.writtenContent || block.writtenContent.trim().length === 0) {
          return false;
        }
        // 既にセールスマーカーが含まれている場合はスキップ
        const hasSalesMarker = block.writtenContent.includes('※ここにセールス文を書く');
        return !hasSalesMarker;
      });
      console.log(`[Sales Locations] Found ${blocksWithContent.length} blocks with content (excluding already processed blocks)`);
      
      if (blocksWithContent.length === 0) {
        alert('すべてのブロックにセールス箇所が追加済みです。または、執筆内容がありません。');
        setSalesLocationLoading(false);
        return;
      }

      const response = await fetch('/api/generate-sales-locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          h2Blocks: blocksWithContent.map(block => ({
            id: block.id,
            h2Title: block.h2Title,
            h3s: block.h3s,
            writtenContent: block.writtenContent,
          })),
          productUrl: articleData?.productUrl,
          articleTopic: articleData?.mainKeyword,
        }),
      });

      // レスポンスのContent-Typeを確認
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text.substring(0, 500));
        throw new Error(`サーバーエラーが発生しました。レスポンスがJSON形式ではありません。ステータス: ${response.status}`);
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `セールス箇所の生成に失敗しました（ステータス: ${response.status}）`);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      // H2ブロックごとに「※ここにセールス文を書く」が挿入された内容を取得
      if (data.h2BlocksWithSalesMarkers) {
        // デバッグログを追加
        console.log('[Sales Locations] Received h2BlocksWithSalesMarkers:', data.h2BlocksWithSalesMarkers);
        Object.keys(data.h2BlocksWithSalesMarkers).forEach(blockId => {
          const content = data.h2BlocksWithSalesMarkers[blockId];
          const hasSalesMarker = content.includes('※ここにセールス文を書く');
          console.log(`[Sales Locations] Block ${blockId} - Content length: ${content.length}`);
          console.log(`[Sales Locations] Block ${blockId} - Has sales marker: ${hasSalesMarker}`);
          console.log(`[Sales Locations] Block ${blockId} - Content preview (first 500 chars):`, content.substring(0, 500));
        });
        
        // 各H2ブロックの執筆内容を更新
        setH2Blocks(prevBlocks => {
          const updatedBlocks = prevBlocks.map(block => {
            const updatedContent = data.h2BlocksWithSalesMarkers[block.id];
            if (updatedContent) {
              console.log(`[Sales Locations] Updating block ${block.id} with new content`);
              return { ...block, writtenContent: updatedContent };
            }
            console.log(`[Sales Locations] Block ${block.id} - No updated content found`);
            return block;
          });
          
          // セールス箇所追加後、即座に保存（自動保存を待たない）
          try {
            const articleId = articleData.articleId || currentArticleId || `article-${Date.now()}`;
            const blocksWithContent = updatedBlocks.filter(block => block.writtenContent && block.writtenContent.trim().length > 0);
            
            const dataToSave = {
              ...articleData,
              articleId,
              title,
              structure,
              h2Blocks: updatedBlocks.map(block => ({
                ...block,
                writtenContent: block.writtenContent || '',
                attachedFiles: [], // ファイルは保存しない
              })),
              intro,
              introHtmlContent,
              description,
              savedAt: new Date().toISOString(),
            };
            
            const saveKey = `seo-article-data-${articleId}`;
            localStorage.setItem(saveKey, JSON.stringify(dataToSave));
            console.log(`[Sales Locations] Immediately saved ${blocksWithContent.length} blocks with content to ${saveKey}`);
          } catch (saveError) {
            console.error('[Sales Locations] Error saving immediately after adding markers:', saveError);
          }
          
          return updatedBlocks;
        });
        
        // 残りのブロックがある場合は、次のブロックを処理する
        const processedBlockIds = Object.keys(data.h2BlocksWithSalesMarkers);
        const remainingBlocks = blocksWithContent.filter(block => !processedBlockIds.includes(block.id));
        
        if (remainingBlocks.length > 0) {
          console.log(`Processed ${processedBlockIds.length} blocks, ${remainingBlocks.length} remaining. Please click the button again to process remaining blocks.`);
          alert(`${processedBlockIds.length}個のブロックにセールス箇所を追加しました。\n残り${remainingBlocks.length}個のブロックがあります。\n「セールス箇所を提案してもらう」ボタンを再度押して、残りのブロックを処理してください。`);
        } else {
          alert('すべてのブロックにセールス箇所を追加しました！');
        }
      } else if (data.salesLocations) {
        // 後方互換性：記事全体が返された場合
        alert('セールス箇所が生成されましたが、H2ブロックごとの処理が必要です。');
      } else {
        alert('セールス箇所の提案が生成されませんでした');
      }
    } catch (error: any) {
      console.error('[Sales Locations] Error generating sales locations:', error);
      console.error('[Sales Locations] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      const errorMessage = error.message || 'セールス箇所の生成に失敗しました';
      alert(`エラー: ${errorMessage}\n\nブラウザのコンソール（F12）で詳細を確認してください。`);
    } finally {
      setSalesLocationLoading(false);
    }
  }, [h2Blocks, articleData]);

  // 特定のH2ブロックに対してセールス箇所を提案してもらう
  const handleGenerateSalesLocationsForBlock = useCallback(async (blockId: string) => {
    const block = h2Blocks.find(b => b.id === blockId);
    console.log(`[Sales Locations] Button clicked for block ${blockId}`, {
      blockFound: !!block,
      hasContent: !!(block?.writtenContent),
      contentLength: block?.writtenContent?.length || 0,
      contentPreview: block?.writtenContent?.substring(0, 100) || 'N/A',
    });
    
    if (!block || !block.writtenContent || block.writtenContent.trim().length === 0) {
      alert('執筆内容がありません。まず記事を執筆してください。');
      return;
    }
    
    // 既にセールスマーカーが含まれている場合はスキップ
    const hasSalesMarker = block.writtenContent.includes('※ここにセールス文を書く');
    if (hasSalesMarker) {
      alert('このブロックには既にセールス箇所が追加されています。');
      return;
    }
    
    // 記事全体で既に2箇所以上ある場合はスキップ
    const allBlocks = h2Blocks || [];
    const totalSalesMarkers = allBlocks.reduce((count: number, b: H2Block) => {
      if (b.writtenContent && b.writtenContent.includes('※ここにセールス文を書く')) {
        return count + (b.writtenContent.match(/※ここにセールス文を書く/g) || []).length;
      }
      return count;
    }, 0);
    
    if (totalSalesMarkers >= 2) {
      alert('記事全体で既に2箇所以上のセールス箇所が追加されています。');
      setSalesLocationLoading(false);
      return;
    }
    
    setSalesLocationLoading(true);
    try {
      const response = await fetch('/api/generate-sales-locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          h2Blocks: [{
            id: block.id,
            h2Title: block.h2Title,
            h3s: block.h3s,
            writtenContent: block.writtenContent,
          }],
          productUrl: articleData?.productUrl,
          articleTopic: articleData?.mainKeyword,
        }),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text.substring(0, 500));
        throw new Error(`サーバーエラーが発生しました。レスポンスがJSON形式ではありません。ステータス: ${response.status}`);
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `セールス箇所の生成に失敗しました（ステータス: ${response.status}）`);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.h2BlocksWithSalesMarkers && data.h2BlocksWithSalesMarkers[blockId]) {
        const updatedContent = data.h2BlocksWithSalesMarkers[blockId];
        console.log(`[Sales Locations] Updating block ${blockId} with new content`);
        
        setH2Blocks(prevBlocks => {
          const updatedBlocks = prevBlocks.map(b =>
            b.id === blockId ? { ...b, writtenContent: updatedContent } : b
          );
          
          // セールス箇所追加後、即座に保存
          try {
            const articleId = articleData.articleId || currentArticleId || `article-${Date.now()}`;
            const dataToSave = {
              ...articleData,
              articleId,
              title,
              structure,
              h2Blocks: updatedBlocks.map(block => ({
                ...block,
                writtenContent: block.writtenContent || '',
                attachedFiles: [],
              })),
              intro,
              introHtmlContent,
              description,
              savedAt: new Date().toISOString(),
            };
            const saveKey = `seo-article-data-${articleId}`;
            localStorage.setItem(saveKey, JSON.stringify(dataToSave));
            console.log(`[Sales Locations] Immediately saved block ${blockId} to ${saveKey}`);
          } catch (saveError) {
            console.error('[Sales Locations] Error saving:', saveError);
          }
          
          return updatedBlocks;
        });
        
        alert('セールス箇所を追加しました。');
      } else {
        alert('セールス箇所の提案が生成されませんでした');
      }
    } catch (error: any) {
      console.error('Error generating sales locations:', error);
      alert(error.message || 'セールス箇所の生成に失敗しました');
    } finally {
      setSalesLocationLoading(false);
    }
  }, [h2Blocks, articleData, currentArticleId, title, structure, intro, introHtmlContent, description]);

  // 導入文・セールス文・まとめ文・ディスクリプションを執筆する
  const handleGenerateIntroSalesSummaryDesc = useCallback(async () => {
    setIntroSalesSummaryLoading(true);
    try {
      const fullArticle = h2Blocks
        .map(block => {
          let content = `## ${block.h2Title}\n`;
          block.h3s.forEach(h3 => {
            content += `### ${h3.title}\n`;
          });
          content += block.writtenContent;
          return content;
        })
        .join('\n\n');

      const response = await fetch('/api/generate-intro-sales-summary-desc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          article: fullArticle,
          h2Blocks: h2Blocks.map(block => ({
            id: block.id,
            h2Title: block.h2Title,
            h3s: block.h3s,
            writtenContent: block.writtenContent,
          })),
          articleData: articleData,
          keyword: articleData?.mainKeyword,
          title: title,
          productUrl: articleData?.productUrl,
          introReaderWorry: articleData?.introReaderWorry,
          descriptionKeywords: articleData?.descriptionKeywords,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '導入文・セールス文・まとめ文・ディスクリプションの生成に失敗しました');
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      // 生成された内容を各フィールドに設定
      // 1. 導入文を「導入文」の執筆欄に設定
      if (data.intro) {
        setIntro(data.intro);
      }
      
      // 2. セールス文を「※ここにセールス文を書く」の箇所に挿入（既存の文章は改変しない）
      if (data.sales && Array.isArray(data.sales)) {
        setH2Blocks(prevBlocks =>
          prevBlocks.map(block => {
            const salesData = data.sales.find((s: any) => s.blockId === block.id);
            if (salesData && block.writtenContent.includes('※ここにセールス文を書く')) {
              // 「※ここにセールス文を書く」をセールス文に置き換える（既存の文章は保持）
              // salesData.contentにはセールス文の内容のみが含まれているはず
              const updatedContent = block.writtenContent.replace(/※ここにセールス文を書く/g, salesData.content.trim());
              return { ...block, writtenContent: updatedContent };
            }
            return block;
          })
        );
      }
      
      // 3. まとめ文を「H2: まとめ」の執筆欄に設定
      if (data.summary) {
        setH2Blocks(prevBlocks =>
          prevBlocks.map(block => {
            if (block.h2Title && (block.h2Title.includes('まとめ') || block.h2Title.includes('まとめ'))) {
              return { ...block, writtenContent: data.summary };
            }
            return block;
          })
        );
      }
      
      // 4. ディスクリプションを「ディスクリプション」の執筆欄に設定
      if (data.description) {
        setDescription(data.description);
      }

      alert('導入文・セールス文・まとめ文・ディスクリプションが生成されました。');
    } catch (error: any) {
      console.error('Error generating intro/sales/summary/desc:', error);
      alert(error.message || '導入文・セールス文・まとめ文・ディスクリプションの生成に失敗しました');
    } finally {
      setIntroSalesSummaryLoading(false);
    }
  }, [h2Blocks, articleData, title]);

  // 監修者の吹き出しを執筆する
  const handleGenerateSupervisorComments = useCallback(async () => {
    setSupervisorCommentLoading(true);
    try {
      // 執筆内容があるH2ブロックのみを送信
      // 既に「<佐藤誠一吹き出し>」が含まれているブロックはスキップ
      // 「導入文」「ディスクリプション」「まとめ」ブロックもスキップ
      const blocksWithContent = h2Blocks.filter(block => {
        if (!block.writtenContent || block.writtenContent.trim().length === 0) {
          return false;
        }
        // 「導入文」「ディスクリプション」「まとめ」には監修者の吹き出しを書かない
        const h2Title = block.h2Title || '';
        const isIntroBlock = h2Title.includes('導入') || h2Title.includes('導入文');
        const isDescriptionBlock = h2Title.includes('ディスクリプション') || h2Title.includes('description');
        const isSummaryBlock = h2Title.includes('まとめ');
        if (isIntroBlock || isDescriptionBlock || isSummaryBlock) {
          return false;
        }
        // 既に監修者の吹き出しが含まれている場合はスキップ
        const hasSupervisorComment = block.writtenContent.includes('<佐藤誠一吹き出し>');
        return !hasSupervisorComment;
      });
      console.log(`[Supervisor Comments] Found ${blocksWithContent.length} blocks with content (excluding already processed blocks)`);
      
      if (blocksWithContent.length === 0) {
        alert('すべてのブロックに監修者の吹き出しが追加済みです。または、執筆内容がありません。');
        setSupervisorCommentLoading(false);
        return;
      }
      
      const response = await fetch('/api/generate-supervisor-comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          h2Blocks: blocksWithContent.map(block => ({
            id: block.id,
            h2Title: block.h2Title,
            h3s: block.h3s,
            writtenContent: block.writtenContent,
          })),
        }),
      });

      // レスポンスのContent-Typeを確認
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text.substring(0, 500));
        throw new Error(`サーバーエラーが発生しました。レスポンスがJSON形式ではありません。ステータス: ${response.status}`);
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `監修者の吹き出しの生成に失敗しました（ステータス: ${response.status}）`);
      }
      if (data.error) {
        throw new Error(data.error);
      }

      // H2ブロックごとに更新
      if (data.h2BlocksWithComments) {
        // デバッグログを追加
        console.log('[Supervisor Comments] Received h2BlocksWithComments:', data.h2BlocksWithComments);
        Object.keys(data.h2BlocksWithComments).forEach(blockId => {
          const content = data.h2BlocksWithComments[blockId];
          const hasSupervisorComment = content.includes('<佐藤誠一吹き出し>');
          console.log(`[Supervisor Comments] Block ${blockId} - Content length: ${content.length}`);
          console.log(`[Supervisor Comments] Block ${blockId} - Has supervisor comment: ${hasSupervisorComment}`);
          console.log(`[Supervisor Comments] Block ${blockId} - Content preview (first 500 chars):`, content.substring(0, 500));
        });
        
        setH2Blocks(prevBlocks => {
          const updatedBlocks = prevBlocks.map(block => {
            const updatedContent = data.h2BlocksWithComments[block.id];
            if (updatedContent !== undefined) {
              console.log(`[Supervisor Comments] Updating block ${block.id} with new content`);
              return { ...block, writtenContent: updatedContent };
            }
            console.log(`[Supervisor Comments] Block ${block.id} - No updated content found`);
            return block;
          });
          
          // 監修者の吹き出し追加後、即座に保存（自動保存を待たない）
          try {
            const articleId = articleData.articleId || currentArticleId || `article-${Date.now()}`;
            const blocksWithContent = updatedBlocks.filter(block => block.writtenContent && block.writtenContent.trim().length > 0);
            
            const dataToSave = {
              ...articleData,
              articleId,
              title,
              structure,
              h2Blocks: updatedBlocks.map(block => ({
                ...block,
                writtenContent: block.writtenContent || '',
                attachedFiles: [], // ファイルは保存しない
              })),
              intro,
              introHtmlContent,
              description,
              savedAt: new Date().toISOString(),
            };
            
            const saveKey = `seo-article-data-${articleId}`;
            localStorage.setItem(saveKey, JSON.stringify(dataToSave));
            console.log(`[Supervisor Comments] Immediately saved ${blocksWithContent.length} blocks with content to ${saveKey}`);
          } catch (saveError) {
            console.error('[Supervisor Comments] Error saving immediately after adding comments:', saveError);
          }
          
          return updatedBlocks;
        });
        
        // 残りのブロックがある場合は、次のブロックを処理する
        const processedBlockIds = Object.keys(data.h2BlocksWithComments);
        const allBlocks = h2Blocks.filter(block => {
          if (!block.writtenContent || block.writtenContent.trim().length === 0) {
            return false;
          }
          const h2Title = block.h2Title || '';
          const isIntroBlock = h2Title.includes('導入') || h2Title.includes('導入文');
          const isDescriptionBlock = h2Title.includes('ディスクリプション') || h2Title.includes('description');
          const isSummaryBlock = h2Title.includes('まとめ');
          if (isIntroBlock || isDescriptionBlock || isSummaryBlock) {
            return false;
          }
          return true;
        });
        const remainingBlocks = allBlocks.filter(block => !processedBlockIds.includes(block.id) && !block.writtenContent.includes('<佐藤誠一吹き出し>'));
        
        if (remainingBlocks.length > 0) {
          console.log(`Processed ${processedBlockIds.length} blocks, ${remainingBlocks.length} remaining. Please click the button again to process remaining blocks.`);
          alert(`${processedBlockIds.length}個のブロックに監修者の吹き出しを追加しました。\n残り${remainingBlocks.length}個のブロックがあります。\n「監修者の吹き出しを執筆する」ボタンを再度押して、残りのブロックを処理してください。`);
        } else {
          alert('すべてのブロックに監修者の吹き出しを追加しました！');
        }
      } else {
        alert('監修者の吹き出しが生成されました: ' + (data.comments || 'コメントが生成されませんでした'));
      }
    } catch (error: any) {
      console.error('Error generating supervisor comments:', error);
      alert(error.message || '監修者の吹き出しの生成に失敗しました');
    } finally {
      setSupervisorCommentLoading(false);
    }
  }, [h2Blocks]);

  // 特定のH2ブロックに対して監修者の吹き出しを執筆する
  const handleGenerateSupervisorCommentsForBlock = useCallback(async (blockId: string) => {
    const block = h2Blocks.find(b => b.id === blockId);
    console.log(`[Supervisor Comments] Button clicked for block ${blockId}`, {
      blockFound: !!block,
      hasContent: !!(block?.writtenContent),
      contentLength: block?.writtenContent?.length || 0,
      contentPreview: block?.writtenContent?.substring(0, 100) || 'N/A',
    });
    
    if (!block || !block.writtenContent || block.writtenContent.trim().length === 0) {
      alert('執筆内容がありません。まず記事を執筆してください。');
      return;
    }
    
    // 「導入文」「ディスクリプション」「まとめ」には監修者の吹き出しを書かない
    const h2Title = block.h2Title || '';
    const isIntroBlock = h2Title.includes('導入') || h2Title.includes('導入文');
    const isDescriptionBlock = h2Title.includes('ディスクリプション') || h2Title.includes('description');
    const isSummaryBlock = h2Title.includes('まとめ');
    if (isIntroBlock || isDescriptionBlock || isSummaryBlock) {
      alert('このブロックには監修者の吹き出しを追加できません。');
      return;
    }
    
    // 既に監修者の吹き出しが含まれている場合はスキップ
    const hasSupervisorComment = block.writtenContent.includes('<佐藤誠一吹き出し>');
    if (hasSupervisorComment) {
      alert('このブロックには既に監修者の吹き出しが追加されています。');
      return;
    }
    
    setSupervisorCommentLoading(true);
    try {
      const response = await fetch('/api/generate-supervisor-comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          h2Blocks: [{
            id: block.id,
            h2Title: block.h2Title,
            h3s: block.h3s,
            writtenContent: block.writtenContent,
          }],
        }),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text.substring(0, 500));
        throw new Error(`サーバーエラーが発生しました。レスポンスがJSON形式ではありません。ステータス: ${response.status}`);
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `監修者の吹き出しの生成に失敗しました（ステータス: ${response.status}）`);
      }
      if (data.error) {
        throw new Error(data.error);
      }

      if (data.h2BlocksWithComments && data.h2BlocksWithComments[blockId]) {
        const updatedContent = data.h2BlocksWithComments[blockId];
        console.log(`[Supervisor Comments] Updating block ${blockId} with new content`);
        
        setH2Blocks(prevBlocks => {
          const updatedBlocks = prevBlocks.map(b =>
            b.id === blockId ? { ...b, writtenContent: updatedContent } : b
          );
          
          // 監修者の吹き出し追加後、即座に保存
          try {
            const articleId = articleData.articleId || currentArticleId || `article-${Date.now()}`;
            const dataToSave = {
              ...articleData,
              articleId,
              title,
              structure,
              h2Blocks: updatedBlocks.map(block => ({
                ...block,
                writtenContent: block.writtenContent || '',
                attachedFiles: [],
              })),
              intro,
              introHtmlContent,
              description,
              savedAt: new Date().toISOString(),
            };
            const saveKey = `seo-article-data-${articleId}`;
            localStorage.setItem(saveKey, JSON.stringify(dataToSave));
            console.log(`[Supervisor Comments] Immediately saved block ${blockId} to ${saveKey}`);
          } catch (saveError) {
            console.error('[Supervisor Comments] Error saving:', saveError);
          }
          
          return updatedBlocks;
        });
        
        alert('監修者の吹き出しを追加しました。');
      } else {
        alert('監修者の吹き出しが生成されませんでした');
      }
    } catch (error: any) {
      console.error('[Supervisor Comments] Error generating supervisor comments:', error);
      console.error('[Supervisor Comments] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      const errorMessage = error.message || '監修者の吹き出しの生成に失敗しました';
      alert(`エラー: ${errorMessage}\n\nブラウザのコンソール（F12）で詳細を確認してください。`);
    } finally {
      setSupervisorCommentLoading(false);
    }
  }, [h2Blocks, articleData, currentArticleId, title, structure, intro, introHtmlContent, description]);

  // 保存機能（記事名を付けて保存）
  const handleSave = () => {
    const articleName = prompt('記事名を入力してください:', title || articleData.mainKeyword || '無題の記事');
    if (!articleName) {
      return; // キャンセルされた場合
    }

    try {
      // 記事一覧に追加（同じ記事IDの場合は上書き保存）
      const articleId = articleData.articleId || currentArticleId || `article-${Date.now()}`;
      
      // writtenContentを含めて確実に保存
      const dataToSave = {
        ...articleData,
        articleId,
        title,
        structure,
        h2Blocks: h2Blocks.map(block => ({
          ...block,
          writtenContent: block.writtenContent || '', // writtenContentを確実に含める
          attachedFiles: [], // ファイルは保存しない（Fileオブジェクトはシリアライズできない）
        })),
        intro,
        introHtmlContent,
        description,
        savedAt: new Date().toISOString(),
      };
      
      // writtenContentが含まれているブロックの数を確認
      const blocksWithContent = h2Blocks.filter(block => block.writtenContent && block.writtenContent.trim().length > 0);
      console.log(`[Save] Saving article with ${blocksWithContent.length} blocks with content`);
      console.log(`[Save] Article ID: ${articleId}`);
      console.log(`[Save] Sample writtenContent length:`, h2Blocks[0]?.writtenContent?.length || 0);
      console.log(`[Save] Sample writtenContent (first 200 chars):`, h2Blocks[0]?.writtenContent?.substring(0, 200) || '');
      
      const articleListItem = {
        id: articleId,
        name: articleName,
        title: title || '',
        mainKeyword: articleData.mainKeyword || '',
        savedAt: new Date().toISOString(),
        data: { ...dataToSave, articleId }, // articleIdも含める
      };

      // 記事一覧を読み込む
      const savedArticles = localStorage.getItem('seo-article-list');
      let articles: any[] = [];
      if (savedArticles) {
        try {
          articles = JSON.parse(savedArticles);
        } catch (parseError) {
          console.error('Error parsing saved articles:', parseError);
          articles = [];
        }
      }

      // 既存の記事を更新するか、新規追加（同じ記事IDの場合は上書き）
      const existingIndex = articles.findIndex(a => a.id === articleId);
      if (existingIndex >= 0) {
        articles[existingIndex] = articleListItem;
        console.log(`[Save] Updated existing article at index ${existingIndex}`);
      } else {
        articles.push(articleListItem);
        console.log(`[Save] Added new article to list`);
      }

      // 記事一覧を保存
      try {
        localStorage.setItem('seo-article-list', JSON.stringify(articles));
        console.log(`[Save] Saved article list with ${articles.length} articles`);
      } catch (listError: any) {
        console.error('[Save] Error saving article list:', listError);
        if (listError.name === 'QuotaExceededError') {
          alert('保存領域が不足しています。古い記事を削除してください。');
          return;
        }
      }

      // articleIdに基づいて保存（自動保存用）
      try {
        localStorage.setItem(`seo-article-data-${articleId}`, JSON.stringify(dataToSave));
        console.log(`[Save] Saved article data to seo-article-data-${articleId}`);
        
        // 保存されたデータを確認
        const savedDataCheck = localStorage.getItem(`seo-article-data-${articleId}`);
        if (savedDataCheck) {
          const parsed = JSON.parse(savedDataCheck);
          const savedBlocksWithContent = parsed.h2Blocks?.filter((b: any) => b.writtenContent && b.writtenContent.trim().length > 0) || [];
          console.log(`[Save] Verified: Saved data contains ${savedBlocksWithContent.length} blocks with content`);
        }
      } catch (dataError: any) {
        console.error('[Save] Error saving article data:', dataError);
        if (dataError.name === 'QuotaExceededError') {
          alert('保存領域が不足しています。古い記事を削除してください。');
          return;
        }
      }

      // 親コンポーネントに通知
      if (onSaveArticle) {
        onSaveArticle({ ...dataToSave, articleId });
      }

      alert(`保存しました！\n記事ID: ${articleId}\n保存されたブロック数: ${blocksWithContent.length}`);
    } catch (error: any) {
      console.error('Error saving:', error);
      alert(`保存に失敗しました: ${error.message || '不明なエラー'}`);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4 text-black">記事執筆</h2>

      {!articleData?.structure && (
        <div className="mb-4 p-4 bg-yellow-50 rounded">
          <p className="text-yellow-800">記事構成が設定されていません。</p>
        </div>
      )}

      {articleData?.structure && h2Blocks.length === 0 && (
        <div className="mb-4 p-4 bg-blue-50 rounded">
          <p className="text-blue-800">記事構成を解析中...</p>
        </div>
      )}

      {/* 記事タイトル */}
      <div className="mb-6">
        <label className="block mb-2 font-semibold text-black">記事タイトル（編集可能）</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-3 border rounded text-black text-xl font-bold"
          placeholder="記事タイトルを入力"
        />
      </div>

      {/* 導入文とディスクリプション */}
      <div className="mb-6 space-y-4">
        <div>
          <label className="block mb-2 font-semibold text-black">導入文</label>
          <textarea
            value={intro}
            onChange={(e) => setIntro(e.target.value)}
            className="w-full p-2 border rounded text-black"
            rows={5}
            placeholder="導入文を入力"
          />
          {/* 導入文のHTML変換ボタン */}
          {intro && intro.trim().length > 0 && (
            <div className="mt-2">
              <button
                onClick={handleConvertIntroToHtml}
                disabled={introHtmlConverting}
                className="bg-purple-500 text-white px-4 py-2 rounded font-semibold hover:bg-purple-600 disabled:bg-gray-400 disabled:text-gray-200"
              >
                {introHtmlConverting ? 'HTMLに変換中…' : 'HTMLに変換する'}
              </button>
              {introHtmlContent && (
                <button
                  onClick={() => handleCopyHtml(introHtmlContent)}
                  className="ml-2 bg-green-500 text-white px-4 py-2 rounded font-semibold hover:bg-green-600"
                >
                  HTMLをコピーする
                </button>
              )}
            </div>
          )}
          {/* 導入文のHTML変換後の内容表示 */}
          {introHtmlContent && (
            <div className="mt-3">
              <label className="block mb-2 font-semibold text-black">HTML変換後の内容</label>
              <textarea
                value={introHtmlContent}
                onChange={(e) => setIntroHtmlContent(e.target.value)}
                className="w-full p-2 border rounded font-mono text-black"
                rows={10}
              />
            </div>
          )}
        </div>

        <div>
          <label className="block mb-2 font-semibold text-black">ディスクリプション</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border rounded text-black"
            rows={3}
            placeholder="ディスクリプションを入力"
          />
        </div>
      </div>

      {/* H2ブロックごとの執筆画面 */}
      {h2Blocks.map((block) => (
        <div key={block.id} className="mb-6 p-4 border rounded-lg">
          {/* H2見出しの編集欄 */}
          <div className="mb-3">
            <label className="block mb-2 font-semibold text-black">H2見出し（編集可能）</label>
            <input
              type="text"
              value={`${block.h2Level}: ${block.h2Title}`}
              onChange={(e) => {
                const value = e.target.value;
                // "H2: "や"H3: "などのプレフィックスを除去
                const match = value.match(/^(H[234])[:：]\s*(.+)$/i);
                if (match) {
                  const level = match[1].toUpperCase() as 'H2' | 'H3' | 'H4';
                  const title = match[2].trim();
                  setH2Blocks(prevBlocks =>
                    prevBlocks.map(b =>
                      b.id === block.id ? { ...b, h2Title: title, h2Level: level } : b
                    )
                  );
                } else {
                  // プレフィックスがない場合はH2として扱う
                  setH2Blocks(prevBlocks =>
                    prevBlocks.map(b =>
                      b.id === block.id ? { ...b, h2Title: value.trim(), h2Level: 'H2' } : b
                    )
                  );
                }
              }}
              className="w-full p-2 border rounded text-black text-xl font-bold"
              placeholder="H2: 見出しタイトル"
            />
          </div>
          
          {/* H3/H4見出しの編集欄 */}
          {block.h3s.length > 0 && (
            <div className="mb-3">
              <label className="block mb-2 font-semibold text-black">H3/H4見出し（編集可能）</label>
              <div className="space-y-2">
                {block.h3s.map((h, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={`${h.level}: ${h.title}`}
                      onChange={(e) => {
                        const value = e.target.value;
                        // "H3: "や"H4: "などのプレフィックスを除去
                        const match = value.match(/^(H[34])[:：]\s*(.+)$/i);
                        if (match) {
                          const level = match[1].toUpperCase() as 'H3' | 'H4';
                          const title = match[2].trim();
                          setH2Blocks(prevBlocks =>
                            prevBlocks.map(b =>
                              b.id === block.id
                                ? {
                                    ...b,
                                    h3s: b.h3s.map((item, i) =>
                                      i === index ? { ...item, level, title } : item
                                    ),
                                  }
                                : b
                            )
                          );
                        } else {
                          // プレフィックスがない場合は現在のレベルを維持
                          setH2Blocks(prevBlocks =>
                            prevBlocks.map(b =>
                              b.id === block.id
                                ? {
                                    ...b,
                                    h3s: b.h3s.map((item, i) =>
                                      i === index ? { ...item, title: value.trim() } : item
                                    ),
                                  }
                                : b
                            )
                          );
                        }
                      }}
                      className="flex-1 p-2 border rounded text-black text-sm"
                      placeholder={`${h.level}: 見出しタイトル`}
                    />
                    <button
                      onClick={() => {
                        setH2Blocks(prevBlocks =>
                          prevBlocks.map(b =>
                            b.id === block.id
                              ? {
                                  ...b,
                                  h3s: b.h3s.filter((_, i) => i !== index),
                                  // H3を削除した場合、そのH3に関連する執筆内容もクリアする必要はない
                                  // （H3のタイトルが変わっただけなので、既存の執筆内容は保持）
                                }
                              : b
                          )
                        );
                      }}
                      className="px-3 py-2 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                    >
                      削除
                    </button>
                  </div>
                ))}
              </div>
              {/* H3/H4見出しを追加するボタン */}
              <button
                onClick={() => {
                  setH2Blocks(prevBlocks =>
                    prevBlocks.map(b =>
                      b.id === block.id
                        ? {
                            ...b,
                            h3s: [...b.h3s, { title: '', level: 'H3' as const }],
                          }
                        : b
                    )
                  );
                }}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
              >
                + H3見出しを追加
              </button>
            </div>
          )}
          {/* H3/H4見出しがない場合の追加ボタン */}
          {block.h3s.length === 0 && (
            <div className="mb-3">
              <button
                onClick={() => {
                  setH2Blocks(prevBlocks =>
                    prevBlocks.map(b =>
                      b.id === block.id
                        ? {
                            ...b,
                            h3s: [{ title: '', level: 'H3' as const }],
                          }
                        : b
                    )
                  );
                }}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                + H3見出しを追加
              </button>
            </div>
          )}

          {/* 添付ファイル欄 */}
          <div className="mb-3">
            <label className="block mb-2 text-sm font-semibold text-black">
              添付ファイル（執筆の参考資料）
            </label>
            <input
              ref={(el) => { fileInputRefs.current[block.id] = el; }}
              type="file"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                setH2Blocks(prevBlocks =>
                  prevBlocks.map(b =>
                    b.id === block.id ? { ...b, attachedFiles: files } : b
                  )
                );
              }}
              className="w-full p-2 border rounded text-black text-sm"
            />
            {block.attachedFiles.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-gray-600 mb-1">添付済みファイル:</p>
                <ul className="list-disc list-inside text-sm text-gray-600">
                  {block.attachedFiles.map((file, index) => (
                    <li key={index}>
                      {file.name} ({(file.size / 1024).toFixed(1)} KB)
                      <button
                        onClick={() => {
                          setH2Blocks(prevBlocks =>
                            prevBlocks.map(b =>
                              b.id === block.id
                                ? { ...b, attachedFiles: b.attachedFiles.filter((_, i) => i !== index) }
                                : b
                            )
                          );
                          if (fileInputRefs.current[block.id]) {
                            fileInputRefs.current[block.id]!.value = '';
                          }
                        }}
                        className="ml-2 text-red-600 hover:text-red-800 text-xs"
                      >
                        削除
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* 執筆の指示欄 */}
          <div className="mb-3">
            <label className="block mb-2 text-sm font-semibold text-black">
              このH2ブロックへの執筆指示
            </label>
            <textarea
              value={block.editingInstruction}
              onChange={(e) => {
                setH2Blocks(prevBlocks =>
                  prevBlocks.map(b =>
                    b.id === block.id ? { ...b, editingInstruction: e.target.value } : b
                  )
                );
              }}
              className="w-full p-2 border rounded text-black text-sm"
              rows={2}
              placeholder="このH2ブロックの執筆に関する指示を入力"
            />
          </div>

          {/* 執筆ボタンとその他のボタン */}
          <div className="mb-3 flex flex-wrap gap-2">
            <button
              onClick={() => handleWriteBlock(block.id)}
              disabled={writingLoading[block.id]}
              className="bg-blue-500 text-white px-4 py-2 rounded font-semibold hover:bg-blue-600 disabled:bg-gray-400 disabled:text-gray-200"
            >
              {writingLoading[block.id] ? '執筆中...' : '執筆する'}
            </button>
            
            {/* 「まとめ」ブロックにはボタンを表示しない */}
            {!block.h2Title.includes('まとめ') && (
              <>
                {/* 内部リンクを提案してもらうボタン */}
                <button
                  onClick={() => handleGenerateInternalLinksForBlock(block.id)}
                  disabled={internalLinkLoading || !block.writtenContent || block.writtenContent.trim().length === 0}
                  className="bg-green-500 text-white px-4 py-2 rounded font-semibold hover:bg-green-600 disabled:bg-gray-400 disabled:text-gray-200 text-sm"
                >
                  {internalLinkLoading ? '内部リンク提案中...' : '内部リンクを提案してもらう'}
                </button>
                
                {/* セールス箇所を提案してもらうボタン */}
                <button
                  onClick={() => handleGenerateSalesLocationsForBlock(block.id)}
                  disabled={salesLocationLoading || !block.writtenContent || block.writtenContent.trim().length === 0}
                  className="bg-purple-500 text-white px-4 py-2 rounded font-semibold hover:bg-purple-600 disabled:bg-gray-400 disabled:text-gray-200 text-sm"
                >
                  {salesLocationLoading ? 'セールス箇所提案中...' : 'セールス箇所を提案してもらう'}
                </button>
                
                {/* 監修者の吹き出しを執筆するボタン */}
                <button
                  onClick={() => handleGenerateSupervisorCommentsForBlock(block.id)}
                  disabled={supervisorCommentLoading || !block.writtenContent || block.writtenContent.trim().length === 0}
                  className="bg-orange-500 text-white px-4 py-2 rounded font-semibold hover:bg-orange-600 disabled:bg-gray-400 disabled:text-gray-200 text-sm"
                >
                  {supervisorCommentLoading ? '監修者の吹き出し執筆中...' : '監修者の吹き出しを執筆する'}
                </button>
              </>
            )}
          </div>

          {/* 執筆欄 */}
          <div className="mb-3">
            <label className="block mb-2 font-semibold text-black">執筆内容</label>
            <textarea
              ref={(el) => { textareaRefs.current[block.id] = el; }}
              value={block.writtenContent}
              onChange={(e) => {
                setH2Blocks(prevBlocks =>
                  prevBlocks.map(b =>
                    b.id === block.id ? { ...b, writtenContent: e.target.value } : b
                  )
                );
              }}
              onMouseUp={() => handleTextSelection(block.id)}
              onSelect={() => handleTextSelection(block.id)}
              className="w-full p-2 border rounded font-mono text-black"
              rows={10}
              placeholder="執筆内容がここに表示されます"
            />

            {/* 選択部分の編集機能 */}
            {selectedText && selectedText.blockId === block.id && (
              <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm font-semibold text-black mb-2">
                  選択された部分:
                </p>
                <div className="mb-3 p-2 bg-white border border-yellow-300 rounded text-sm text-gray-700 font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
                  {selectedText.text}
                </div>
                <label className="block mb-2 text-sm font-semibold text-black">
                  選択部分への編集指示
                </label>
                <textarea
                  value={partEditingInstruction}
                  onChange={(e) => setPartEditingInstruction(e.target.value)}
                  className="w-full p-2 border rounded text-black text-sm"
                  rows={2}
                  placeholder="選択した部分に対する編集指示を入力してください"
                />
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={handleEditSelectedPart}
                    disabled={partEditingLoading || !partEditingInstruction.trim()}
                    className="bg-yellow-500 text-white px-4 py-2 rounded font-semibold hover:bg-yellow-600 disabled:bg-gray-400 disabled:text-gray-200 text-sm"
                  >
                    {partEditingLoading ? '編集中...' : '選択部分を編集する'}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedText(null);
                      setPartEditingInstruction('');
                    }}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded font-semibold hover:bg-gray-400 text-sm"
                  >
                    選択を解除
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* HTML変換ボタン */}
          {block.writtenContent && (
            <div className="mb-3">
              <button
                onClick={() => handleConvertToHtml(block.id)}
                disabled={htmlConverting[block.id]}
                className="bg-purple-500 text-white px-4 py-2 rounded font-semibold hover:bg-purple-600 disabled:bg-gray-400 disabled:text-gray-200"
              >
                {htmlConverting[block.id] ? 'HTMLに変換中…' : 'HTMLに変換する'}
              </button>
              {block.htmlContent && (
                <button
                  onClick={() => handleCopyHtml(block.htmlContent)}
                  className="ml-2 bg-green-500 text-white px-4 py-2 rounded font-semibold hover:bg-green-600"
                >
                  HTMLをコピーする
                </button>
              )}
            </div>
          )}

          {/* HTML変換後の内容表示 */}
          {block.htmlContent && (
            <div className="mb-3">
              <label className="block mb-2 font-semibold text-black">HTML変換後の内容</label>
              <textarea
                value={block.htmlContent}
                onChange={(e) => {
                  setH2Blocks(prevBlocks =>
                    prevBlocks.map(b =>
                      b.id === block.id ? { ...b, htmlContent: e.target.value } : b
                    )
                  );
                }}
                className="w-full p-2 border rounded font-mono text-black"
                rows={10}
              />
            </div>
          )}
        </div>
      ))}

      {/* 各種ボタン */}
      <div className="mb-4 flex gap-2 flex-wrap">
        <button
          onClick={handleGenerateIntroSalesSummaryDesc}
          disabled={introSalesSummaryLoading}
          className="bg-purple-500 text-white px-4 py-2 rounded font-semibold hover:bg-purple-600 disabled:bg-gray-400 disabled:text-gray-200 transition-colors"
        >
          {introSalesSummaryLoading ? '導入文・セールス文・まとめ文・ディスクリプションを執筆中…' : '導入文・セールス文・まとめ文・ディスクリプションを執筆する'}
        </button>
        <button
          onClick={handleSave}
          className="bg-green-500 text-white px-4 py-2 rounded font-semibold hover:bg-green-600 transition-colors"
        >
          保存する
        </button>
      </div>
    </div>
  );
}
