export interface Question {
  id: string;
  text: string;
  tags: string[];
  followUps?: string[];
}

export interface RawQuestion {
  id?: string;
  text: string;
  tags?: string[];
  followUps?: string[];
}
