export interface QueryResults<T> {
    results: T[];
    totalResults: number;
    nextPageStartToken: string | null;
}