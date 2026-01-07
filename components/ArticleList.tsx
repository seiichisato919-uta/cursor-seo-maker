'use client';

import { useState, useEffect } from 'react';

interface ArticleListItem {
  id: string;
  name: string;
  title?: string;
  mainKeyword?: string;
  savedAt: string;
  data: any;
}

interface ArticleListProps {
  onSelectArticle: (articleData: any) => void;
  onNewArticle: () => void;
}

export default function ArticleList({ onSelectArticle, onNewArticle }: ArticleListProps) {
  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // 保存された記事一覧を読み込む
  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = () => {
    try {
      const savedArticles = localStorage.getItem('seo-article-list');
      if (savedArticles) {
        const parsed = JSON.parse(savedArticles);
        setArticles(parsed);
      }
    } catch (error) {
      console.error('Error loading articles:', error);
    }
  };

  const handleSelectArticle = (article: ArticleListItem) => {
    // 記事データを復元（articleIdも含める）
    const articleDataWithId = {
      ...article.data,
      articleId: article.id,
    };
    onSelectArticle(articleDataWithId);
  };

  const handleDeleteArticle = (articleId: string) => {
    try {
      const updatedArticles = articles.filter(a => a.id !== articleId);
      localStorage.setItem('seo-article-list', JSON.stringify(updatedArticles));
      setArticles(updatedArticles);
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting article:', error);
      alert('記事の削除に失敗しました');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-black">保存された記事一覧</h2>
        <button
          onClick={onNewArticle}
          className="bg-blue-500 text-white px-4 py-2 rounded font-semibold hover:bg-blue-600"
        >
          新しい記事を作成
        </button>
      </div>

      {articles.length === 0 ? (
        <div className="text-center py-8 text-gray-600">
          <p>保存された記事がありません。</p>
          <p className="mt-2">「新しい記事を作成」ボタンから記事を作成してください。</p>
        </div>
      ) : (
        <div className="space-y-3">
          {articles.map((article) => (
            <div
              key={article.id}
              className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-black mb-1">
                    {article.name}
                  </h3>
                  {article.title && (
                    <p className="text-sm text-gray-600 mb-1">
                      タイトル: {article.title}
                    </p>
                  )}
                  {article.mainKeyword && (
                    <p className="text-sm text-gray-600 mb-1">
                      キーワード: {article.mainKeyword}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    保存日時: {formatDate(article.savedAt)}
                  </p>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleSelectArticle(article)}
                    className="bg-blue-500 text-white px-4 py-2 rounded font-semibold hover:bg-blue-600 text-sm"
                  >
                    編集を続ける
                  </button>
                  {showDeleteConfirm === article.id ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDeleteArticle(article.id)}
                        className="bg-red-500 text-white px-3 py-2 rounded font-semibold hover:bg-red-600 text-sm"
                      >
                        削除
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(null)}
                        className="bg-gray-300 text-gray-700 px-3 py-2 rounded font-semibold hover:bg-gray-400 text-sm"
                      >
                        キャンセル
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowDeleteConfirm(article.id)}
                      className="bg-red-500 text-white px-4 py-2 rounded font-semibold hover:bg-red-600 text-sm"
                    >
                      削除
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

