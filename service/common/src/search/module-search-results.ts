import { Module } from "../module.js";

export interface ModuleSearchResults {
    results: Module[];
    totalResults: number;
    nextPageStartToken: string;
}