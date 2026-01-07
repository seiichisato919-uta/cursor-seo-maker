'use client';

import { useState, useEffect } from 'react';

interface TitleGeneratorProps {
  articleData: any;
  onComplete: (title: string) => void;
  onSaveArticle?: (articleData: any) => void;
}

export default function TitleGenerator({ articleData, onComplete, onSaveArticle }: TitleGeneratorProps) {
  const [titles, setTitles] = useState<string[]>([]);
  const [selectedTitle, setSelectedTitle] = useState('');
  const [loading, setLoading] = useState(false);

  // articleDataからタイトルを読み込む（記事一覧から選択した場合など）
  useEffect(() => {
    if (articleData?.title) {
      setSelectedTitle(articleData.title);
    }
    if (articleData?.titles && Array.isArray(articleData.titles)) {
      setTitles(articleData.titles);
    }
  }, [articleData?.title, articleData?.titles]);

  // localStorageから保存されたデータを読み込む（自動保存データ）
  useEffect(() => {
    // articleDataにタイトルが既にある場合はスキップ（記事一覧から選択した場合）
    if (articleData?.title) {
      return;
    }

    try {
      const savedData = localStorage.getItem('seo-article-data');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        // articleDataと一致する場合のみ読み込む
        if (!articleData || (parsed.mainKeyword === articleData.mainKeyword)) {
          if (parsed.title && !selectedTitle) {
            setSelectedTitle(parsed.title);
          }
          if (parsed.titles && Array.isArray(parsed.titles) && titles.length === 0) {
            setTitles(parsed.titles);
          }
        }
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
  }, []); // 初回マウント時のみ実行

  // タイトルが変更されたときに自動保存（debounce付き）
  useEffect(() => {
    if (!selectedTitle) return;
    
    const timeoutId = setTimeout(() => {
      try {
        const dataToSave = {
          ...articleData,
          title: selectedTitle,
          titles,
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem('seo-article-data', JSON.stringify(dataToSave));
      } catch (error) {
        console.error('Error auto-saving title:', error);
      }
    }, 1000); // 1秒後に保存

    return () => clearTimeout(timeoutId);
  }, [selectedTitle, titles, articleData]);

  // タイトル候補が生成されたときに自動保存
  useEffect(() => {
    if (titles.length === 0) return;
    
    try {
      const dataToSave = {
        ...articleData,
        titles,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem('seo-article-data', JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Error auto-saving titles:', error);
    }
  }, [titles, articleData]);

  const generateTitles = async () => {
    setLoading(true);
    setTitles([]);
    setSelectedTitle('');
    
    // 入力データの検証
    if (!articleData?.mainKeyword || !articleData?.structure) {
      alert('メインキーワードと記事構成が必要です。');
      setLoading(false);
      return;
    }
    
    try {
      console.log('タイトル生成開始:', {
        keyword: articleData.mainKeyword,
        targetReader: articleData.targetReader,
        structureLength: articleData.structure?.length || 0
      });
      
      const response = await fetch('/api/generate-titles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: articleData.mainKeyword,
          targetReader: articleData.targetReader,
          structure: articleData.structure,
        }),
      });
      
      const data = await response.json();
      
      console.log('API Response:', {
        ok: response.ok,
        status: response.status,
        titlesCount: data.titles?.length || 0,
        error: data.error
      });
      
      if (!response.ok) {
        throw new Error(data.error || `タイトルの生成に失敗しました (ステータス: ${response.status})`);
      }
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      if (!data.titles || data.titles.length === 0) {
        const errorMsg = data.rawResponse 
          ? `タイトルが生成されませんでした。\n\nレスポンス:\n${data.rawResponse.substring(0, 500)}`
          : 'タイトルが生成されませんでした。記事構成を確認してください。';
        throw new Error(errorMsg);
      }
      
      setTitles(data.titles);
      
      // 30個未満の場合は警告を表示（ただしエラーにはしない）
      if (data.titles.length < 30) {
        alert(`警告: ${data.titles.length}個のタイトルが生成されました。30個未満です。`);
      } else {
        alert(`成功: ${data.titles.length}個のタイトルが生成されました。`);
      }
    } catch (error: any) {
      console.error('Error generating titles:', error);
      const errorMessage = error.message || 'タイトルの生成に失敗しました';
      alert(`エラー: ${errorMessage}\n\nブラウザのコンソールを確認してください。`);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = () => {
    if (selectedTitle) {
      onComplete(selectedTitle);
    }
  };

  // 保存機能（記事名を付けて保存）
  const handleSave = () => {
    if (!selectedTitle) {
      alert('タイトルを選択または入力してください。');
      return;
    }

    const articleName = prompt('記事名を入力してください:', selectedTitle || articleData.mainKeyword || '無題の記事');
    if (!articleName) {
      return; // キャンセルされた場合
    }

    try {
      const dataToSave = {
        ...articleData,
        title: selectedTitle,
        titles,
        savedAt: new Date().toISOString(),
      };

      // 記事一覧に追加（同じ記事IDの場合は上書き保存）
      const articleId = articleData.articleId || `article-${Date.now()}`;
      const articleListItem = {
        id: articleId,
        name: articleName,
        title: selectedTitle,
        mainKeyword: articleData.mainKeyword || '',
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

      alert('保存しました！');
    } catch (error) {
      console.error('Error saving:', error);
      alert('保存に失敗しました');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">タイトル生成</h2>
      
      <div className="mb-4">
        <button
          onClick={generateTitles}
          disabled={loading}
          className="bg-green-500 text-white px-6 py-2 rounded font-semibold hover:bg-green-600 disabled:bg-gray-400 disabled:text-gray-200"
        >
          {loading ? '生成中...' : 'タイトルを生成する'}
        </button>
      </div>

      {titles.length > 0 && (
        <>
          <div className="mb-4">
            <label className="block mb-2 font-semibold">タイトル候補</label>
            <div className="space-y-2">
              {titles.map((title, index) => (
                <label key={index} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="title"
                    value={title}
                    checked={selectedTitle === title}
                    onChange={(e) => setSelectedTitle(e.target.value)}
                  />
                  <span className="text-gray-800">{title}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block mb-2 font-semibold">または、手動でタイトルを入力</label>
            <input
              type="text"
              value={selectedTitle}
              onChange={(e) => setSelectedTitle(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="タイトルを入力"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className="bg-green-500 text-white px-6 py-2 rounded font-semibold hover:bg-green-600"
            >
              保存する
            </button>
            <button
              onClick={handleSelect}
              disabled={!selectedTitle}
              className="bg-blue-500 text-white px-6 py-2 rounded font-semibold hover:bg-blue-600 disabled:bg-gray-400 disabled:text-gray-200"
            >
              タイトルを確定する
            </button>
          </div>
        </>
      )}
    </div>
  );
}

