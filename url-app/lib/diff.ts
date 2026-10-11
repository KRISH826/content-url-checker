import { diffWordsWithSpace, Change } from 'diff';

export interface DiffResult {
    score: number;
    isExactMatch: boolean;
    removeWords: number;
    addWords: number;
    parts: Change[];
}

export function compareText(oldText: string, newText: string): DiffResult {
    const parts = diffWordsWithSpace(oldText, newText);
    let addWords = 0;
    let removeWords = 0;
    let equalWords = 0;

    for (const part of parts) {
        const count = part.value.trim().split(/\s+/).filter(Boolean).length;
        if (part.added) addWords += count;
        else if (part.removed) removeWords += count;
        else equalWords += count;
    }

    const total = equalWords + Math.max(addWords, removeWords);
    const score = total === 0 ? 100 : Math.round((equalWords / total) * 100);

    return {
        score,
        isExactMatch: oldText === newText,
        removeWords,
        addWords,
        parts,
    };
}