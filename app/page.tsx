'use client';

import { useState, useEffect } from 'react';
import ArticleInputForm from '@/components/ArticleInputForm';
import ArticleStructureEditor from '@/components/ArticleStructureEditor';
import TitleGenerator from '@/components/TitleGenerator';
import ArticleWriter from '@/components/ArticleWriter';
import ArticleList from '@/components/ArticleList';

export default function Home() {
  const [step, setStep] = useState<'list' | 'input' | 'structure' | 'title' | 'writing'>('list');
  const [articleData, setArticleData] = useState<any>(null);

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">SEO記事作成システム</h1>
        
        <div className="mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setStep('list')}
              className={`px-4 py-2 rounded font-semibold transition-colors ${
                step === 'list' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              記事一覧
            </button>
            <button
              onClick={() => setStep('input')}
              className={`px-4 py-2 rounded font-semibold transition-colors ${
                step === 'input' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              1. 情報入力
            </button>
            <button
              onClick={() => setStep('structure')}
              className={`px-4 py-2 rounded font-semibold transition-colors ${
                step === 'structure' 
                  ? 'bg-blue-500 text-white' 
                  : !articleData
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
              disabled={!articleData}
            >
              2. 記事構成
            </button>
            <button
              onClick={() => setStep('title')}
              className={`px-4 py-2 rounded font-semibold transition-colors ${
                step === 'title' 
                  ? 'bg-blue-500 text-white' 
                  : !articleData?.structure
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
              disabled={!articleData?.structure}
            >
              3. タイトル生成
            </button>
            <button
              onClick={() => setStep('writing')}
              className={`px-4 py-2 rounded font-semibold transition-colors ${
                step === 'writing' 
                  ? 'bg-blue-500 text-white' 
                  : !articleData?.title
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
              disabled={!articleData?.title}
            >
              4. 記事執筆
            </button>
          </div>
        </div>

        {step === 'list' && (
          <ArticleList
            onSelectArticle={(data) => {
              setArticleData(data);
              // 保存されたデータから適切なステップを決定
              if (data.title && data.h2Blocks && data.h2Blocks.length > 0) {
                // タイトルと執筆データがある場合は執筆画面へ
                setStep('writing');
              } else if (data.title) {
                // タイトルがある場合は執筆画面へ
                setStep('writing');
              } else if (data.structure) {
                // 構成がある場合はタイトル生成画面へ
                setStep('title');
              } else {
                // それ以外は構成画面へ
                setStep('structure');
              }
            }}
            onNewArticle={() => {
              setArticleData(null);
              setStep('input');
            }}
          />
        )}

        {step === 'input' && (
          <ArticleInputForm
            onComplete={(data) => {
              setArticleData(data);
              setStep('structure');
            }}
          />
        )}

        {step === 'structure' && articleData && (
          <>
            <div className="mb-4">
              <button
                onClick={() => setStep('list')}
                className="bg-gray-400 text-white px-4 py-2 rounded font-semibold hover:bg-gray-500"
              >
                ← 記事一覧に戻る
              </button>
            </div>
            <ArticleStructureEditor
              initialData={articleData}
              onComplete={(structure) => {
                setArticleData({ ...articleData, structure });
                setStep('title');
              }}
              onSaveArticle={(savedData) => {
                setArticleData(savedData);
              }}
            />
          </>
        )}

        {step === 'title' && articleData && (
          <>
            <div className="mb-4">
              <button
                onClick={() => setStep('list')}
                className="bg-gray-400 text-white px-4 py-2 rounded font-semibold hover:bg-gray-500"
              >
                ← 記事一覧に戻る
              </button>
            </div>
            <TitleGenerator
              articleData={articleData}
              onComplete={(title) => {
                setArticleData({ ...articleData, title });
                setStep('writing');
              }}
              onSaveArticle={(savedData) => {
                setArticleData(savedData);
              }}
            />
          </>
        )}

        {step === 'writing' && articleData && (
          <>
            <div className="mb-4">
              <button
                onClick={() => setStep('list')}
                className="bg-gray-400 text-white px-4 py-2 rounded font-semibold hover:bg-gray-500"
              >
                ← 記事一覧に戻る
              </button>
            </div>
            <ArticleWriter 
              articleData={articleData}
              onSaveArticle={(savedData) => {
                // 保存されたデータでarticleDataを更新
                setArticleData(savedData);
              }}
            />
          </>
        )}
      </div>
    </main>
  );
}

