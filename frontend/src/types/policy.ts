export interface Message {
  role: "user" | "ai";
  text: string;
}

// TODO: structured answer from Actian VectorAI policy clause retrieval
export interface PolicyClauseResponse {
  authorizationRequired: boolean;
  tierLevel: string;
  copayConditions: string;
  stepTherapyRules: string;
}
