import { Module } from "../module";

export interface ModuleSearchResults {
    results: Module[];
    totalResults: number;
    nextPageStartToken: string;
}