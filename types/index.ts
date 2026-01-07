export interface ArticleInputData {
  mainKeyword: string;
  relatedKeywords: string;
  targetReader: string;
  searchIntent: string;
  competitorArticles: string;
  sampleStructure: string;
  primaryInfo: string;
  articleGoal: string;
  mediaExample: string;
  productUrl: string;
  introReaderWorry: string;
  descriptionKeywords: string;
}

export interface ArticleStructure {
  title?: string;
  h2Blocks: H2Block[];
}

export interface H2Block {
  h2: string;
  h3s: string[];
  content?: string;
}

export interface ArticleData extends ArticleInputData {
  structure?: string;
  title?: string;
  h2Blocks?: H2Block[];
  intro?: string;
  description?: string;
}


