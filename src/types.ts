export interface Requirement {
  id: string;
  title: string;
  text: string;
  classification: string; // Functional, Non-Functional, Security, Performance, UI/UX, etc.
  score: number; // 0 to 100
  isVerifiable: boolean;
  ambiguitiesCount: number;
  decompositionCount: number;
  analysis?: RequirementAnalysis;
}

export interface Ambiguity {
  term: string;
  explanation: string;
  suggestions: string[];
}

export interface Improvement {
  original: string;
  suggested: string;
  explanation: string;
}

export interface RequirementAnalysis {
  classification: string;
  score: number;
  scores: {
    clarity: number;
    completeness: number;
    feasibility: number;
    testability: number;
  };
  ambiguities: Ambiguity[];
  isVerifiable: boolean;
  nonVerifiableReason?: string;
  missingAcceptanceCriteria: string[];
  suggestedImprovements: Improvement[];
  decomposedStatements: string[];
}

export interface DuplicateRelation {
  req1Id: string;
  req1Title: string;
  req2Id: string;
  req2Title: string;
  similarity: number; // 0-100
  explanation: string;
}

export interface ConflictRelation {
  req1Id: string;
  req1Title: string;
  req2Id: string;
  req2Title: string;
  explanation: string;
  severity: 'High' | 'Medium' | 'Low';
}

export interface BatchAnalysisResult {
  duplicates: DuplicateRelation[];
  conflicts: ConflictRelation[];
}

export interface MockApiProject {
  id: string;
  name: string;
  requirements: {
    title: string;
    text: string;
  }[];
}
