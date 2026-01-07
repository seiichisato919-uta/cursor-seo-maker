'use client';

import { useState } from 'react';

interface ArticleInputFormProps {
  onComplete: (data: any) => void;
}

export default function ArticleInputForm({ onComplete }: ArticleInputFormProps) {
  const [formData, setFormData] = useState({
    mainKeyword: '',
    relatedKeywords: '',
    targetReader: '',
    searchIntent: '',
    competitorArticles: '',
    sampleStructure: '',
    primaryInfo: '',
    articleGoal: '',
    mediaExample: '',
    productUrl: '',
    introReaderWorry: '',
    descriptionKeywords: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete(formData);
  };

  // エンターキーでフォームが送信されないようにする
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4 text-black">記事作成に必要な情報を入力してください</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-2 font-semibold text-black">1. メインキーワード *</label>
          <input
            type="text"
            value={formData.mainKeyword}
            onChange={(e) => setFormData({ ...formData, mainKeyword: e.target.value })}
            onKeyDown={handleKeyDown}
            className="w-full p-2 border rounded text-black"
            required
          />
        </div>

        <div>
          <label className="block mb-2 font-semibold text-black">2. 関連キーワード候補</label>
          <textarea
            value={formData.relatedKeywords}
            onChange={(e) => setFormData({ ...formData, relatedKeywords: e.target.value })}
            className="w-full p-2 border rounded text-black"
            rows={3}
          />
        </div>

        <div>
          <label className="block mb-2 font-semibold text-black">3. ターゲット読者</label>
          <textarea
            value={formData.targetReader}
            onChange={(e) => setFormData({ ...formData, targetReader: e.target.value })}
            className="w-full p-2 border rounded text-black"
            rows={2}
          />
        </div>

        <div>
          <label className="block mb-2 font-semibold text-black">4. 検索意図</label>
          <textarea
            value={formData.searchIntent}
            onChange={(e) => setFormData({ ...formData, searchIntent: e.target.value })}
            className="w-full p-2 border rounded text-black"
            rows={2}
          />
        </div>

        <div>
          <label className="block mb-2 font-semibold text-black">5. 競合記事リスト</label>
          <textarea
            value={formData.competitorArticles}
            onChange={(e) => setFormData({ ...formData, competitorArticles: e.target.value })}
            className="w-full p-2 border rounded text-black"
            rows={4}
            placeholder="URLとH1/H2/H3構成を入力"
          />
        </div>

        <div>
          <label className="block mb-2 font-semibold text-black">6. お手本の構成</label>
          <textarea
            value={formData.sampleStructure}
            onChange={(e) => setFormData({ ...formData, sampleStructure: e.target.value })}
            className="w-full p-2 border rounded text-black"
            rows={4}
          />
        </div>

        <div>
          <label className="block mb-2 font-semibold text-black">7. 一次情報</label>
          <textarea
            value={formData.primaryInfo}
            onChange={(e) => setFormData({ ...formData, primaryInfo: e.target.value })}
            className="w-full p-2 border rounded text-black"
            rows={3}
          />
        </div>

        <div>
          <label className="block mb-2 font-semibold text-black">8. 記事のゴール（CTA）</label>
          <textarea
            value={formData.articleGoal}
            onChange={(e) => setFormData({ ...formData, articleGoal: e.target.value })}
            className="w-full p-2 border rounded text-black"
            rows={2}
          />
        </div>

        <div>
          <label className="block mb-2 font-semibold text-black">9. 掲載するメディアの記事例</label>
          <textarea
            value={formData.mediaExample}
            onChange={(e) => setFormData({ ...formData, mediaExample: e.target.value })}
            className="w-full p-2 border rounded text-black"
            rows={4}
          />
        </div>

        <div>
          <label className="block mb-2 font-semibold text-black">10. 訴求したい商品・サービスのURL</label>
          <input
            type="url"
            value={formData.productUrl}
            onChange={(e) => setFormData({ ...formData, productUrl: e.target.value })}
            onKeyDown={handleKeyDown}
            className="w-full p-2 border rounded text-black"
          />
        </div>

        <div>
          <label className="block mb-2 font-semibold text-black">11. 導入文の冒頭に入れる読者の「悩み」や「キーワード」</label>
          <input
            type="text"
            value={formData.introReaderWorry}
            onChange={(e) => setFormData({ ...formData, introReaderWorry: e.target.value })}
            onKeyDown={handleKeyDown}
            className="w-full p-2 border rounded text-black"
          />
        </div>

        <div>
          <label className="block mb-2 font-semibold text-black">12. ディスクリプションに含めたいキーワード</label>
          <textarea
            value={formData.descriptionKeywords}
            onChange={(e) => setFormData({ ...formData, descriptionKeywords: e.target.value })}
            className="w-full p-2 border rounded text-black"
            rows={2}
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-3 rounded font-semibold hover:bg-blue-600 transition-colors"
        >
          記事構成を作成する
        </button>
      </form>
    </div>
  );
}

