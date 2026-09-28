export const CREDIT_COSTS = {
  // Chat
  CHAT_TEXT: 2,
  CHAT_VOICE: 1,
  CHAT_IMAGE_UPLOAD: 4,
  CHAT_DOCUMENT_UPLOAD: 5,
  CHAT_IMAGE_GENERATE: 10,
  CHAT_PDF_EXPORT: 3,
  CHAT_THINKING: 4,
  CHAT_WEB_SEARCH: 5,

  // Code Workspace
  CODE_REQUEST: 4,
  CODE_FILE_UPLOAD: 3,
};

export const PLAN_LIMITS = {
  free: {
    credits: 100,
    codeProjects: 2,
  },
  pro: {
    credits: 1000,
    codeProjects: 10,
  },
  enterprise: {
    credits: 10000,
    codeProjects: Infinity,
  },
};