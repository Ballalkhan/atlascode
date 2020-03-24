export enum FeedbackType {
    Bug = 'bug',
    Comment = 'comment',
    Suggestion = 'suggestion',
    Question = 'question',
    Empty = ''
}

export enum KnownLinkID {
    AtlascodeRepo = 'atlascodeRepoLink',
    AtlascodeIssues = 'atlascodeIssuesLink',
    AtlascodeDocs = 'atlascodeDocsLink'
}

export interface FeedbackData {
    type: FeedbackType;
    description: string;
    canBeContacted: boolean;
    userName: string;
    emailAddress: string;
}

export interface FeedbackUser {
    userName: string;
    emailAddress: string;
}

export const emptyFeedbackUser: FeedbackUser = {
    userName: '',
    emailAddress: ''
};

export enum PMFLevel {
    VERY = 'Very disappointed',
    SOMEWHAT = 'Somewhat disappointed',
    NOT = 'Not disappointed'
}

export function numForPMFLevel(level: PMFLevel): string {
    switch (level) {
        case PMFLevel.VERY: {
            return '0';
        }
        case PMFLevel.SOMEWHAT: {
            return '1';
        }
        case PMFLevel.NOT: {
            return '3';
        }
    }
}
export interface PMFData {
    level: PMFLevel;
    improvements: string;
    alternative: string;
    benefits: string;
}
