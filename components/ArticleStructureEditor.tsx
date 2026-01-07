'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface ArticleStructureEditorProps {
  initialData: any;
  onComplete: (structure: string) => void;
  onSaveArticle?: (articleData: any) => void;
}

export default function ArticleStructureEditor({ initialData, onComplete, onSaveArticle }: ArticleStructureEditorProps) {
  const [structure, setStructure] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingComment, setEditingComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const [selectedStart, setSelectedStart] = useState<number | null>(null);
  const [selectedEnd, setSelectedEnd] = useState<number | null>(null);
  const [partEditingInstruction, setPartEditingInstruction] = useState('');
  const [partEditingLoading, setPartEditingLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const generateStructure = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/generate-structure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(initialData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '記事構成の生成に失敗しました');
      }
      
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setStructure(data.structure || '');
    } catch (error: any) {
      console.error('Error generating structure:', error);
      setError(error.message || '記事構成の生成に失敗しました');
      alert(error.message || '記事構成の生成に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [initialData]);

  // initialDataから構造を読み込む（記事一覧から選択した場合など）
  useEffect(() => {
    if (initialData?.structure) {
      setStructure(initialData.structure);
    }
  }, [initialData?.structure]);

  // localStorageから保存されたデータを読み込む（自動保存データ）
  useEffect(() => {
    // initialDataに構造が既にある場合はスキップ（記事一覧から選択した場合）
    if (initialData?.structure) {
      return;
    }

    try {
      const savedData = localStorage.getItem('seo-article-data');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        // initialDataと一致する場合のみ読み込む
        if (!initialData || (parsed.mainKeyword === initialData.mainKeyword)) {
          if (parsed.structure && !structure) {
            setStructure(parsed.structure);
          }
        }
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
  }, []); // 初回マウント時のみ実行

  // コンポーネントがマウントされたときに自動的に記事構成を生成
  useEffect(() => {
    if (!structure && !loading && !initialData?.structure) {
      generateStructure();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 記事構成が変更されたときに自動保存（debounce付き）
  useEffect(() => {
    if (!structure) return;
    
    const timeoutId = setTimeout(() => {
      try {
        const dataToSave = {
          ...initialData,
          structure,
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem('seo-article-data', JSON.stringify(dataToSave));
      } catch (error) {
        console.error('Error auto-saving structure:', error);
      }
    }, 1000); // 1秒後に保存

    return () => clearTimeout(timeoutId);
  }, [structure, initialData]);

  // 保存のみ（記事名を付けて保存）
  const handleSave = () => {
    const articleName = prompt('記事名を入力してください:', initialData.mainKeyword || '無題の記事');
    if (!articleName) {
      return; // キャンセルされた場合
    }

    try {
      // 記事データ全体を保存
      const dataToSave = {
        ...initialData,
        structure,
        savedAt: new Date().toISOString(),
      };

      // 記事一覧に追加（同じ記事IDの場合は上書き保存）
      const articleId = initialData.articleId || `article-${Date.now()}`;
      const articleListItem = {
        id: articleId,
        name: articleName,
        title: '',
        mainKeyword: initialData.mainKeyword || '',
        savedAt: new Date().toISOString(),
        data: { ...dataToSave, articleId }, // articleIdも含める
      };

      // 記事一覧を読み込む
      const savedArticles = localStorage.getItem('seo-article-list');
      let articles: any[] = [];
      if (savedArticles) {
        articles = JSON.parse(savedArticles);
      }

      // 既存の記事を更新するか、新規追加（同じ記事IDの場合は上書き）
      const existingIndex = articles.findIndex(a => a.id === articleId);
      if (existingIndex >= 0) {
        articles[existingIndex] = articleListItem;
      } else {
        articles.push(articleListItem);
      }

      // 記事一覧を保存
      localStorage.setItem('seo-article-list', JSON.stringify(articles));

      // 一時保存データも保存（自動保存用）
      localStorage.setItem('seo-article-data', JSON.stringify(dataToSave));

      // 親コンポーネントに通知
      if (onSaveArticle) {
        onSaveArticle({ ...dataToSave, articleId });
      }

      setSaveMessage('保存しました！');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      alert('保存に失敗しました');
    }
  };

  // 次へ進む（タイトル生成画面に遷移）
  const handleNext = () => {
    onComplete(structure);
  };

  // テキスト選択を検知
  const handleTextSelection = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.substring(start, end);

    if (selected.trim().length > 0) {
      setSelectedText(selected);
      setSelectedStart(start);
      setSelectedEnd(end);
    } else {
      setSelectedText('');
      setSelectedStart(null);
      setSelectedEnd(null);
    }
  };

  // 選択部分の編集を実行
  const handleEditSelectedPart = useCallback(async () => {
    if (!selectedText || !partEditingInstruction.trim()) {
      alert('編集指示を入力してください');
      return;
    }

    setPartEditingLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/edit-structure-part', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedText,
          editingInstruction: partEditingInstruction,
          fullStructure: structure,
          initialData,
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
      if (selectedStart !== null && selectedEnd !== null && data.editedText) {
        const beforeText = structure.substring(0, selectedStart);
        const afterText = structure.substring(selectedEnd);
        const newStructure = beforeText + data.editedText + afterText;
        setStructure(newStructure);
        
        // 選択をクリア
        setSelectedText('');
        setSelectedStart(null);
        setSelectedEnd(null);
        setPartEditingInstruction('');
        
        // テキストエリアのフォーカスを維持
        if (textareaRef.current) {
          const newCursorPos = selectedStart + data.editedText.length;
          setTimeout(() => {
            textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
            textareaRef.current?.focus();
          }, 0);
        }
      }
    } catch (error: any) {
      console.error('Error editing selected part:', error);
      setError(error.message || '選択部分の編集に失敗しました');
      alert(error.message || '選択部分の編集に失敗しました');
    } finally {
      setPartEditingLoading(false);
    }
  }, [selectedText, partEditingInstruction, structure, initialData, selectedStart, selectedEnd]);

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4 text-black">記事構成の作成</h2>
      
      {loading && (
        <div className="mb-4 p-4 bg-blue-50 rounded">
          <p className="text-blue-800">記事構成を生成しています。しばらくお待ちください...</p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 rounded">
          <p className="text-red-800">エラー: {error}</p>
        </div>
      )}
      
      <div className="mb-4">
        <button
          onClick={generateStructure}
          disabled={loading}
          className="bg-green-500 text-white px-6 py-2 rounded font-semibold hover:bg-green-600 disabled:bg-gray-400 disabled:text-gray-200"
        >
          {loading ? '生成中...' : '記事構成を再生成する'}
        </button>
      </div>

      {structure && (
        <>
          <div className="mb-4">
            <label className="block mb-2 font-semibold text-black">記事構成全体への編集指示</label>
            <textarea
              value={editingComment}
              onChange={(e) => setEditingComment(e.target.value)}
              className="w-full p-2 border rounded text-black"
              rows={3}
              placeholder="記事構成全体に対する編集指示を入力"
            />
          </div>

          <div className="mb-4">
            <label className="block mb-2 font-semibold text-black">記事構成</label>
            <textarea
              ref={textareaRef}
              value={structure}
              onChange={(e) => setStructure(e.target.value)}
              onMouseUp={handleTextSelection}
              onSelect={handleTextSelection}
              className="w-full p-2 border rounded font-mono text-black"
              rows={20}
            />
            {selectedText && (
              <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm font-semibold text-black mb-2">
                  選択された部分:
                </p>
                <div className="mb-3 p-2 bg-white border border-yellow-300 rounded text-sm text-gray-700 font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
                  {selectedText}
                </div>
                <label className="block mb-2 text-sm font-semibold text-black">
                  選択部分への編集指示
                </label>
                <textarea
                  value={partEditingInstruction}
                  onChange={(e) => setPartEditingInstruction(e.target.value)}
                  className="w-full p-2 border rounded text-black text-sm"
                  rows={3}
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
                      setSelectedText('');
                      setSelectedStart(null);
                      setSelectedEnd(null);
                      setPartEditingInstruction('');
                      if (textareaRef.current) {
                        textareaRef.current.setSelectionRange(0, 0);
                      }
                    }}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded font-semibold hover:bg-gray-400 text-sm"
                  >
                    選択を解除
                  </button>
                </div>
              </div>
            )}
          </div>

          {saveMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
              <p className="text-green-800 text-sm">{saveMessage}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className="bg-green-500 text-white px-6 py-2 rounded font-semibold hover:bg-green-600"
            >
              保存する
            </button>
            <button
              onClick={handleNext}
              className="bg-blue-500 text-white px-6 py-2 rounded font-semibold hover:bg-blue-600"
            >
              次へ進む（タイトル生成）
            </button>
          </div>
        </>
      )}
    </div>
  );
}

